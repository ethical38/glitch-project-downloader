# Glitch Project Downloader & Post‑Processing Scripts

[![Version](https://img.shields.io/github/v/release/ethical38/glitch-project-downloader)](https://github.com/ethical38/glitch-project-downloader/releases)
[![Downloads](https://img.shields.io/github/downloads/ethical38/glitch-project-downloader/total)](https://github.com/ethical38/glitch-project-downloader/releases)
[![License](https://img.shields.io/github/license/ethical38/glitch-project-downloader)](LICENSE)

A complete end‑to‑end solution for backing up all your Glitch.com (active, deleted, shared) projects and assets. Download projects with a Tampermonkey userscript, then run local scripts to extract, organize, the files and to also download the assets.


## 🚀 Features

### Tampermonkey Downloader

* **Permission‑based filenames**: Projects saved as `glitch-project-<personal|shared|deleted>-<domain>.tgz` based on `permission.accessLevel`.
* **Intercepts Web Requests**: The script listens for requests to the Glitch API and extracts project data and persistent tokens.
* **Download Button**: Once the page loads, a "Download All Projects" button appears, enabling users to download all of their projects (active, deleted, and shared) as ZIP files.
* **Download Setup Scripts Button**: After you have downloaded all of your projects, you download the post-processing scripts to handle the unzipping and asset downloading.
* **Project Types**:
   - **Active Projects**: Currently active projects are retrieved directly.
   - **Deleted (aka Archived) Projects**: The script also downloads projects that have been deleted.
   - **Shared Projects**: Shared projects with the user are also included in the download.
* **Migration Guides**: A "Migration Guides" button is also added to the page, allowing users to easily access Glitch's official migration documentation.
* **Browser Notifications**: Notifications for progress updates on project downloads.

### Local Post‑Processing

* **Automatic extraction**: Unpacks each TGZ into `Glitch-Projects/{personal,shared,deleted}/{project}`.
* **Assets download**: Creates an `assets/` subfolder per project, fetching every URL in `.glitch-assets`.
* **UUID‑prefixed filenames**: Saves assets as `<UUID>-<originalName>` to avoid collisions.
* **Per‑project logs**: Generates `<projectName>-asset-download-log.txt` with status entries:

  * `downloaded:success:<url>`
  * `downloaded:exists:<url>`
  * `failed:deleted:<url>`
  * ...and more.
* **Console summaries**: Shows counts of downloaded, skipped, and failed assets per project.
* **Cleanup prompt**: Option to delete original `.tgz` files after successful extraction.
* **Windows fix**: Includes `setup-glitch-scripts.bat` to enable PowerShell execution through policy adjustments.


## 📦 Installation

1. **Install the Tampermonkey userscript**

   * Install **[Tampermonkey](https://www.tampermonkey.net/)** (or a similar userscript manager) in your browser.
   * Click **[here to install the script](https://github.com/ethical38/glitch-project-downloader/releases/latest/download/glitch-project-downloader.user.js)**
   * Save the script, and visit **[Glitch Dashboard](https://glitch.com/dashboard)** in a new tab.
   * You should see a "Download All Projects" button on the Glitch dashboard once the page has loaded.
   
2. **Download the respective post-processing scripts**
   * After the script is installed, and you have downloaded your projects, click the second labeled `Download Setup Scripts`
      * This will download the respective scripts according to your system.

## 📄 Guides
1. **Enable faster project downloads**
   * Chrome users (copy the following url and navigate to it in a new tab):
      *  ```chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=settings ```
      * Change the Config mode from `Novice` to `Beginner`
      * Scroll to the bottom and change the Download Mode from `Default` to `Browser API`
      * Click the save button
   * Other browsers:
      * Click on the Tampermonkey Extension
      * Click `Dashboard`
      * Click the Settings tab (should on the right towards the top)
      * Follow the steps mentioned under chrome users.
2. **Enable Downloading of Post-Processing Scripts (Optional)**
   * If your config mode has not been changed yet, follow the above steps
   * Scroll to the bottom and in the `Whitelist File Extension` text area add the following line
   ```text
   /\.(ps1|bat|sh)$/
   ```
   * Click save


## ▶️ Usage

### 1. Download projects in browser
- Navigate to any Glitch.com page.  
- Click the injected **Download All Projects** button.  
- All projects will download as `.tgz` files into your default Downloads folder.

### 2. Post-Processing Workflow

> **Note:** Before running the asset downloader, you must first extract and organize your downloaded archives by using the organizer script.

**1. Organizer Script (Extraction & Organization)**  
- **Windows PowerShell:**  
  ```powershell
  cd C:\path\to\parent-folder    # contains organize-glitch-zips.ps1 + Glitch-Projects\
  .\setup-glitch-scripts.bat     # run once to allow PowerShell scripting
  .\organize-glitch-zips.ps1
   ```
   or

   - Double click on the `setup-glitch-scripts.bat` file
   - Then right click on the `organize-glitch-zips.ps1` file and click "Run with PowerShell

- **macOS/Linux:**

  ```bash
  cd /path/to/parent-folder       # contains organize-glitch-tgz.sh + Glitch-Projects/
  chmod +x organize-glitch-tgz.sh
  ./organize-glitch-tgz.sh
  ```

**2. Asset Download Script**

- **Windows PowerShell:**

  ```powershell
  cd C:\path\to\parent-folder
  .\download-assets.ps1
  ```

  or

  - Right click on the `download-assets.ps1` file and click "Run with PowerShell
* **macOS/Linux:**

  ```bash
  cd /path/to/parent-folder
  chmod +x download-assets.sh
  ./download-assets.sh
  ```

Each script will unpack projects, download assets, and leave per‑project logs.

## ⚠️ Known Issues

1. Sometimes, Chrome marks ZIP downloads as suspicious

   * On Chrome, the browser may flag the post-proccessing files as "suspicious" and block the download until you manually approve each one.

   * **Quick workaround:**  
Go to `chrome://settings/security` → under **Safe Browsing**, change the setting to **No Protection**.

   **Warning:** Disabling Safe Browsing reduces your browser’s protection, so only do this temporarily if you understand the risks. Make sure to turn it back on when you’re done.

2. (Windows-Only)
   * For projects with node servers the tar unzipping will show possible download issues as windows has an issue with the .node files, example, `A required privilege is not held by the client` this error usually occurs with the `.node-gyp` file. None of your project files are lost but node modules are not extracted. Linux/Mac should have no issues with this.


## Contributing

Feel free to fork this repository, submit issues, or contribute pull requests if you'd like to add features or improve the script.

## License

This script is provided under the **GNU GENERAL PUBLIC License**. See the LICENSE file for details.
