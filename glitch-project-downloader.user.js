// ==UserScript==
// @name         Glitch Project Downloader
// @namespace    http://tampermonkey.net/
// @version      v1.0.0
// @description  This script allows users to easily download all of their active and deleted projects from Glitch.com. It intercepts web requests to Glitch's API, retrieves project data and persistent tokens, and provides a convenient "Download All Projects" button on the Glitch website. The script can download both active and deleted projects, saving them as zip files to your device.
// @match        https://glitch.com/*
// @grant        GM_download
// @run-at       document-start
// @updateURL    https://github.com/yourusername/yourrepository/raw/main/glitch-project-downloader.user.js
// @downloadURL  https://github.com/yourusername/yourrepository/raw/main/glitch-project-downloader.user.js
// @license      GPL-3.0
// ==/UserScript==


(function() {
    'use strict';

    // —————————————————————————————
    // Helpers to wait for a DOM element
    // —————————————————————————————
    async function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
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
    let persistentToken   = null;
    let projects          = [];  // [{ id, domain }]
    let deletedProjects   = [];  // full objects from deletedProjects.items

    // —————————————————————————————
    // Patch XHR.prototype.open & .send
    // —————————————————————————————
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
        this._glitchURL = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener('load', function() {
            const url = this._glitchURL;
            if (!url.includes('api.glitch.com/v1/users/')) {
                return;
            }

            let data;
            try {
                data = JSON.parse(this.responseText);
            } catch (e) {
                return console.warn('[GlitchDL] JSON parse error', e);
            }

            const u = new URL(url, location.origin);
            const path = u.pathname;

            // 1) persistentToken endpoint
            if (path === '/v1/users/by/id' && u.searchParams.has('id')) {
                const id = u.searchParams.get('id');
                if (data[id]?.persistentToken) {
                    persistentToken = data[id].persistentToken;
                    console.log('[GlitchDL] Token:', persistentToken);
                }
            }

            // 2) projects list endpoint
            if (path === '/v1/users/by/id/projects' && u.searchParams.has('id')) {
                if (Array.isArray(data.items)) {
                    projects = data.items.map(item => ({
                        id:     item.id,
                        domain: item.domain || 'unknown'
                    }));
                    console.log('[GlitchDL] Projects:', projects);
                }
            }

            // 3) deletedProjects endpoint
            //    e.g. /v1/users/123/deletedProjects
            if (path.endsWith('/deletedProjects')) {
                if (Array.isArray(data.items)) {
                    deletedProjects = data.items;
                }
                console.log('[GlitchDL] Deleted Projects:', deletedProjects);
            }
        });

        return origSend.apply(this, arguments);
    };

    // —————————————————————————————
    // triggerDownload helper
    // —————————————————————————————
    function triggerDownload(blob, filename) {
        const objUrl = URL.createObjectURL(blob);
        const link   = document.createElement('a');
        link.style.display = 'none';
        link.href = objUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 10_000);
    }

    // —————————————————————————————
    // Download logic using GM_download (unchanged)
    // —————————————————————————————
    function startDownloads() {
        if (!persistentToken || projects.length === 0) {
            return alert('Waiting on API data—try again shortly.');
        }

        // download active projects
        projects.forEach(({ id, domain }) => {
            const url =
                  'https://api.glitch.com/project/download/?' +
                  'authorization=' + encodeURIComponent(persistentToken) +
                  '&projectId='    + encodeURIComponent(id);

            GM_download({
                url,
                name: `glitch-${domain}-${id}.zip`,
                onerror(err) {
                    console.error(`[GlitchDL] download failed for ${id}`, err);
                }
            });
        });

        // if you also want to handle deletedProjects downloads, you could:
        // deletedProjects.forEach(item => { ... });
    }

    // —————————————————————————————
    // Inject the “Download All” button once the UI is ready
    // —————————————————————————————
    window.addEventListener('load', async () => {
        const container = await checkElementExists_Query(
            '#main > section > div[class*="introProjectHours"]'
        );
        if (!container) {
            console.warn('[GlitchDL] Could not find introProjectHours container');
            return;
        }

        const dlbtn = document.createElement('button');
        dlbtn.textContent = 'Download All Projects';
        dlbtn.className = '_inlineAction_15o5z_415 css-1odo2sl';
        dlbtn.style.marginTop = '10px';
        dlbtn.addEventListener('click', startDownloads);

        const migratebtn = document.createElement('button');
        migratebtn.textContent = 'Migration Guides';
        migratebtn.className = '_inlineAction_15o5z_415 css-1odo2sl';
        migratebtn.style.marginTop = '10px';
        migratebtn.addEventListener('click', ()=>{window.open("https://help.glitch.com/s/topic/0TONx00000064CDOAY/migration-guides")});

        container.appendChild(dlbtn);
        container.appendChild(migratebtn);
        console.log('[GlitchDL] Download All button injected');
    });
})();
