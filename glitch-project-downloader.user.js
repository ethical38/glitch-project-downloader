// ==UserScript==
// @name         Glitch Project Downloader
// @namespace    http://tampermonkey.net/
// @version      v3.0.0
// @description  This script allows users to easily download all of their active and deleted projects from Glitch.com. It intercepts web requests to Glitch's API, retrieves project data and persistent tokens, and provides a convenient "Download All Projects" button on the Glitch website. The script can download both active and deleted projects, saving them as zip files to your device, and provides a summary of successes and failures with retry logic for failed downloads.
// @match        https://glitch.com/*
// @grant        GM_download
// @grant        GM_notification
// @run-at       document-start
// @connect      api.glitch.com
// @updateURL    https://github.com/ethical38/glitch-project-downloader/raw/main/glitch-project-downloader.user.js
// @downloadURL  https://github.com/ethical38/glitch-project-downloader/raw/main/glitch-project-downloader.user.js
// @license      GPL-3.0
// ==/UserScript==

console.log(
  "%c  Glitch Project Downloader " + GM_info.script.version,
  "background: #ff1ad9; color: white; font-size: 18px; font-weight: bold; padding: 12px 24px; border-radius: 10px; font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;"
);

(function () {
  "use strict";

  // —————————————————————————————
  // Helpers to wait for a DOM element
  // —————————————————————————————
  async function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function checkElementExists_Query(selector, parent = document) {
    while (true) {
      const el = parent.querySelector(selector);
      if (el) return el;
      await wait(100);
    }
  }

  function showNotification({
    text = "Notification text",
    title = "Notification Title",
    image = "https://glitch.com/favicon.ico",
    highlight = false,
    silent = false,
    timeout = 10000,
    url,
    tag,
    onclick,
    ondone,
  } = {}) {
    if (typeof GM_notification !== "function") {
      console.warn(
        "GM_notification is not available. Make sure you have the right permissions and Tampermonkey is up to date."
      );
      return;
    }

    GM_notification({
      text,
      title,
      image,
      tag,
      highlight,
      silent,
      timeout,
      onclick: (e) => {
        e.preventDefault();
      },
      ondone: (e) => {
        if (typeof ondone === "function") ondone(e);
      },
      url,
    });
  }

  let persistentToken = null;
  let projects = [];
  let deletedProjects = [];

  // —————————————————————————————
  // Patch XHR.prototype.open & .send
  // —————————————————————————————

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    this._glitchURL = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("load", function () {
      const url = this._glitchURL;
      if (!url.includes("api.glitch.com/v1/users/")) {
        return;
      }

      let data;
      try {
        data = JSON.parse(this.responseText);
      } catch (e) {
        return console.warn("[GlitchDL] JSON parse error", e);
      }

      const u = new URL(url, location.origin);
      const path = u.pathname;

      if (path === "/v1/users/by/id" && u.searchParams.has("id")) {
        const id = u.searchParams.get("id");
        if (data[id]?.persistentToken) {
          persistentToken = data[id].persistentToken;
          console.log("[GlitchDL] Token:", persistentToken);
        }
      }

      if (path === "/v1/users/by/id/projects" && u.searchParams.has("id")) {
        if (Array.isArray(data.items)) {
          projects.push(...data.items);
          console.log("[GlitchDL] Projects:", projects);
        }
      }

      if (path.endsWith("/deletedProjects")) {
        if (Array.isArray(data.items)) {
          deletedProjects.push(...data.items);
          console.log("[GlitchDL] Deleted Projects:", deletedProjects);
        }
      }
    });

    return origSend.apply(this, arguments);
  };

  function checkAllDone() {
    const totalCount = projects.length + deletedProjects.length;

    let msg =
      `✅ All downloads attempted.\n\n` +
      `Successful: ${successList.size}\n` +
      `Failed: ${failureList.size}`;

    if (failureList.size > 0) {
      msg +=
        "\n\nFailed Projects:\n" +
        [...failureList].map((f) => f.domain).join("\n");
    }

    console.log(msg);

    showNotification({
      text: `✅ ${successList.size} succeeded, ❌ ${failureList.size} failed.`,
      title: "Glitch Project Downloader – Done",
      tag: "final-report",
      highlight: true,
    });

    console.log(
      `Was able to download ${
        successList.size
      } out of ${totalCount} or ${parseFloat(
        ((successList.size / totalCount) * 100).toFixed(2)
      )}% of all projects`
    );

    alert(msg);
  }

  const successList = new Set();
  const failureList = new Set();
  const inProgress = new Set();

  // —————————————————————————————
  // Download logic with retry and summary
  // —————————————————————————————

  function downloadWithRetry(url, name, displayName, project, attemptsLeft) {
    const mode = GM_info.downloadMode;
    console.log(mode);

    const cleanup = () => inProgress.delete(project.id);

    const handleFailure = (message, err) => {
      console.error(`[GlitchDL] ✖︎ ${message} for ${displayName}`, err || "");
      failureList.add(project);
      cleanup();
    };

    const retry = () => {
      console.warn(
        `[GlitchDL] retrying ${displayName}, attempts left ${attemptsLeft - 1}`
      );
      setTimeout(() => {
        downloadWithRetry(url, name, displayName, project, attemptsLeft - 1);
      }, 5000);
    };

    const dl = GM_download({
      url,
      name,
      saveAs: false,
      onload() {
        successList.add(project);
        console.log(`✅ Success ${project.domain}`);
        cleanup();
      },
      onerror(err) {
        if (err?.error === "not_whitelisted") {
          console.warn(
            `[GlitchDL] not_whitelisted for ${displayName}, opening directly`
          );
          window.open(url, "_blank");
          return;
        }

        if (err?.error === "aborted") {
          handleFailure("FAILED download due to large file size", err);
          return;
        }

        if (attemptsLeft > 1) {
          retry();
        } else {
          handleFailure("FAILED after 3 attempts", err);
        }
      },
      ontimeout() {
        handleFailure("timeout");
      },
    });
  }

  function finalizeDownloads() {
    for (const id of inProgress) {
      const isSuccess = [...successList].some((p) => p.id === id);
      const isFail = [...failureList].some((p) => p.id === id);
      if (isSuccess || isFail) {
        console.warn(`[GlitchDL] cleaning up stale inProgress id: ${id}`);
        inProgress.delete(id);
      }
    }
  }

  async function startDownloads() {
    successList.clear();
    failureList.clear();
    inProgress.clear();

    if (!persistentToken) {
      return alert("Still waiting for API data…");
    }

    const totalCount = projects.length + deletedProjects.length;
    if (totalCount === 0) {
      return alert("No projects found yet—try again in a moment.");
    }

    const os = detectOS();
    let devToolsShortcut = "";

    switch (os) {
      case "windows":
      case "linux":
        devToolsShortcut = "Ctrl+Shift+I";
        break;
      case "mac":
        devToolsShortcut = "Cmd+Option+I";
        break;
      default:
        devToolsShortcut = "F12 or your browser's DevTools shortcut";
    }

    [...projects, ...deletedProjects].forEach((p) => inProgress.add(p.id));

    const mode = GM_info.downloadMode;

    if (mode !== "browser") {
      const proceed = confirm(
        "⚠️ Warning: Your current download mode is extremely inefficient and may result in horribly slow downloads or memory issues.\n\n" +
          "To avoid this, please switch to the 'browser' download mode in your script settings.\n\n" +
          "Click OK to open the setup guide in a new tab, or Cancel to stay here."
      );
      if (proceed) {
        window.open(
          "https://example.com/how-to-switch-to-browser-mode",
          "_blank"
        );
      }
      return null;
    }

    alert(
      `📦 Download loop started for ${totalCount} projects.\n\nYou will get a final summary in the console once all attempts finish.\n\n🔍 To view more details, open your browser's DevTools (e.g., ${devToolsShortcut}) to check for errors or see why any projects may have failed.`
    );

    // Build an array of Promises for each project
    for (const project of projects) {
      const label =
        project.permission?.accessLevel >= 30 ? "personal" : "shared";
      const downloadUrl =
        "https://api.glitch.com/project/download/?" +
        "authorization=" +
        encodeURIComponent(persistentToken) +
        "&projectId=" +
        encodeURIComponent(project.id);
      const fileName = `glitch-project-${label}-${project.domain}.tgz`;
      const displayName = `${label}/${project.domain}`;

      downloadWithRetry(downloadUrl, fileName, displayName, project, 3);
    }

    // 3) Kick off “deleted” project downloads using for…of
    for (const project of deletedProjects) {
      const downloadUrl =
        "https://api.glitch.com/project/download/?" +
        "authorization=" +
        encodeURIComponent(persistentToken) +
        "&projectId=" +
        encodeURIComponent(project.id);
      const fileName = `glitch-project-deleted-${project.domain}.tgz`;
      const displayName = `deleted/${project.domain}`;

      downloadWithRetry(downloadUrl, fileName, displayName, project, 3);
    }

    const waitForEmptyList = (set) =>
      new Promise((resolve) => {
        const interval = setInterval(() => {
          let completed = successList.size + failureList.size;

          if (completed > 0 && completed < totalCount) {
            showNotification({
              text: `Progress: ${completed}/${totalCount} projects processed`,
              title: "Glitch Downloader Working...",
              tag: "progress-update",
              timeout: 6000, // Keep it slightly longer than the interval
              silent: true,
            });
          }

          if (set.size === 0) {
            clearInterval(interval);
            resolve(true);
          }

          if (completed >= totalCount) {
            console.log("Finalizing ...");
            finalizeDownloads();
          }
        }, 5000);
      });

    await waitForEmptyList(inProgress);
  }

  function detectOS() {
    if (navigator.userAgentData) {
      const platform = navigator.userAgentData.platform.toLowerCase();
      if (platform.includes("win")) return "windows";
      if (platform.includes("mac")) return "mac";
      if (platform.includes("linux")) return "linux";
    } else {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("win")) return "windows";
      if (ua.includes("mac")) return "mac";
      if (ua.includes("linux") || ua.includes("x11")) return "linux";
    }

    return "unknown";
  }

  function actionBtn(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "_inlineAction_15o5z_415 css-1odo2sl css-1yn8q2s";
    btn.style.marginBottom = "25px";
    btn.style.marginRight = "4px";
    btn.addEventListener("click", onClick);
    return btn;
  }

  // —————————————————————————————
  // Inject the “Download All” button once the UI is ready
  // —————————————————————————————

  window.addEventListener("load", async () => {
    const container = await checkElementExists_Query("#main > div");
    const header = await checkElementExists_Query("header", container);
    const table = await checkElementExists_Query("table", container);

    const dlBtn = actionBtn("Download All Projects", async () => {
      dlBtn.disabled = true;
      const msg = await startDownloads();

      if (msg) checkAllDone(dlBtn);
      dlBtn.disabled = false;
    });

    const setupScriptsBtn = actionBtn("Download Setup Scripts", () => {
      const base = `https://github.com/ethical38/glitch-project-downloader/releases/download/${GM_info.script.version}/`;
      let files = [];

      const os = detectOS();
      switch (os) {
        case "windows":
          files = [
            "setup-glitch-scripts.bat",
            "organize-glitch-zips.ps1",
            "download-assets.ps1",
          ];
          break;
        case "mac":
        case "linux":
          files = ["download-assets.sh", "organize-glitch-zips.sh"];
          break;
        default:
          console.warn("Unsupported platform:", os);
          break;
      }

      files.forEach((filename) => {
        const url = base + filename;
        const displayName = `script/${filename}`;
        const fakeProject = { id: `script-${filename}`, domain: filename };

        downloadWithRetry(url, filename, displayName, fakeProject, 3);
      });
    });

    const migrateBtn = actionBtn("Migration Guides", () => {
      window.open(
        "https://help.glitch.com/s/topic/0TONx00000064CDOAY/migration-guides"
      );
    });

    container.insertBefore(dlBtn, table);
    container.insertBefore(setupScriptsBtn, table);
    container.insertBefore(migrateBtn, table);

    console.log("[GlitchDL] UI Buttons injected");
  });
})();
