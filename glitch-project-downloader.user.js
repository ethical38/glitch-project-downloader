// ==UserScript==
// @name         Glitch Project Downloader
// @namespace    http://tampermonkey.net/
// @version      v2.0.5
// @description  This script allows users to easily download all of their active and deleted projects from Glitch.com. It intercepts web requests to Glitch's API, retrieves project data and persistent tokens, and provides a convenient "Download All Projects" button on the Glitch website. The script can download both active and deleted projects, saving them as zip files to your device.
// @match        https://glitch.com/*
// @grant        GM_download
// @run-at       document-start
// @connect      api.glitch.com
// @updateURL    https://github.com/ethical38/glitch-project-downloader/raw/main/glitch-project-downloader.user.js
// @downloadURL  https://github.com/ethical38/glitch-project-downloader/raw/main/glitch-project-downloader.user.js
// @license      GPL-3.0
// ==/UserScript==

const SCRIPT_VERSION = "2.0.5";
console.log("Running Glitch Project Downloader v" + SCRIPT_VERSION);

(function () {
  "use strict";

  // —————————————————————————————
  // Helpers to wait for a DOM element
  // —————————————————————————————
  async function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function checkElementExists_Query(selector) {
    while (true) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(100);
    }
  }

  // —————————————————————————————
  // State for token, projects, and deletedProjects
  // —————————————————————————————
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
          projects = data.items;
          console.log("[GlitchDL] Projects:", projects);
        }
      }

      if (path.endsWith("/deletedProjects")) {
        if (Array.isArray(data.items)) {
          deletedProjects = data.items;
        }
        console.log("[GlitchDL] Deleted Projects:", deletedProjects);
      }
    });

    return origSend.apply(this, arguments);
  };

  // —————————————————————————————
  // Download logic using GM_download
  // —————————————————————————————
  function startDownloads() {
    if (!persistentToken) {
      return alert("Still waiting for API data…");
    }
    if (projects.length + deletedProjects.length === 0) {
      return alert("No projects found yet—try again in a moment.");
    }

    // Active projects
    projects.forEach((project) => {
      const label =
        project.permission?.accessLevel >= 30 ? "personal" : "shared";
      const downloadUrl =
        "https://api.glitch.com/project/download/?" +
        "authorization=" +
        encodeURIComponent(persistentToken) +
        "&projectId=" +
        encodeURIComponent(project.domain);

      GM_download({
        url: downloadUrl,
        name: `glitch-project-${label}-${project.domain}.tgz`,
        onerror(err) {
          console.error(
            `[GlitchDL] download failed for ${label}/${project.domain}`,
            err
          );
        },
      });
    });

    // Deleted projects (always owner-deleted)
    deletedProjects.forEach((project) => {
      const downloadUrl =
        "https://api.glitch.com/project/download/?" +
        "authorization=" +
        encodeURIComponent(persistentToken) +
        "&projectId=" +
        encodeURIComponent(project.domain);

      GM_download({
        url: downloadUrl,
        name: `glitch-project-deleted-${project.domain}.tgz`,
        onerror(err) {
          console.error(
            `[GlitchDL] deleted download failed for ${project.domain}`,
            err
          );
        },
      });
    });
  }

  function detectOS() {
    if (navigator.userAgentData) {
      const platform = navigator.userAgentData.platform.toLowerCase();
      if (platform.includes("win")) return "windows";
      if (platform.includes("mac")) return "mac";
      if (platform.includes("linux") || platform.includes("chrome os"))
        return "linux";
    } else {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("win")) return "windows";
      if (ua.includes("mac")) return "mac";
      if (ua.includes("linux") || ua.includes("x11")) return "linux";
    }

    return "unknown";
  }

  // —————————————————————————————
  // Inject the “Download All” button once the UI is ready
  // —————————————————————————————
  window.addEventListener("load", async () => {
    const container = await checkElementExists_Query(
      '#main > section > div[class*="introProjectHours"]'
    );
    if (!container) {
      console.warn("[GlitchDL] Could not find introProjectHours container");
      return;
    }

    const dlBtn = document.createElement("button");
    dlBtn.textContent = "Download All Projects";
    dlBtn.className = "_inlineAction_15o5z_415 css-1odo2sl css-1yn8q2s";
    dlBtn.style.marginTop = "10px";
    dlBtn.style.marginRight = "4px";
    dlBtn.addEventListener("click", startDownloads);

    const setupScriptsBtn = document.createElement("button");
    setupScriptsBtn.textContent = "Download Setup Scripts";
    setupScriptsBtn.className =
      "_inlineAction_15o5z_415 css-1odo2sl css-1yn8q2s";
    setupScriptsBtn.style.marginTop = "10px";
    setupScriptsBtn.style.marginRight = "4px";
    setupScriptsBtn.addEventListener("click", () => {
      const base = `https://github.com/ethical38/glitch-project-downloader/releases/download/v${SCRIPT_VERSION}/`;
      let files = [];

      // Detect OS
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

      // Trigger download for each file
      files.forEach((path) => {
        window.open(base + path);
      });
    });

    const migrateBtn = document.createElement("button");
    migrateBtn.textContent = "Migration Guides";
    migrateBtn.className = "_inlineAction_15o5z_415 css-1odo2sl css-1yn8q2s";
    migrateBtn.style.marginTop = "10px";
    //migrateBtn
    migrateBtn.addEventListener("click", () => {
      window.open(
        "https://help.glitch.com/s/topic/0TONx00000064CDOAY/migration-guides"
      );
    });

    container.appendChild(dlBtn);
    container.appendChild(setupScriptsBtn);
    container.appendChild(migrateBtn);
    console.log("[GlitchDL] Download All button injected");
  });
})();
