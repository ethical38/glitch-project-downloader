# Glitch Project Downloader (Active, Deleted, and Shared Projects)

A Tampermonkey script to download all your Glitch projects, including active, deleted, and shared ones. It intercepts web requests to Glitch's API to retrieve project data and persistent tokens, allowing users to easily download their projects as ZIP files.

## Features
- Download all **active**, **deleted**, and **shared** Glitch projects with a single click.
- Automatically retrieves the persistent token and project data from Glitch's API.
- Includes an easy-to-use "Download All Projects" button that appears in the Glitch interface.

## How It Works
1. **Intercepts Web Requests**: The script listens for requests to the Glitch API and extracts project data and persistent tokens.
2. **Download Button**: Once the page loads, a "Download All Projects" button appears, enabling users to download all of their projects (active, deleted, and shared) as ZIP files.
3. **Project Types**:
   - **Active Projects**: Currently active projects are retrieved directly.
   - **Deleted Projects**: The script also downloads projects that have been deleted.
   - **Shared Projects**: Shared projects with the user are also included in the download.

## Installation

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** (or a similar userscript manager) in your browser.
2. Create a new script and paste the contents of `glitch-project-downloader.user.js` into it.
3. Save the script, and visit [Glitch](https://glitch.com).
4. You should see a "Download All Projects" button on the Glitch dashboard once the page has loaded.

## Usage

- Once the script is installed and active, navigate to your Glitch dashboard.
- The "Download All Projects" button will appear.
- Click the button to download **all** your projects (active, deleted, and shared) as ZIP files.

## Requirements
- Tampermonkey or similar userscript manager.
- A Glitch account with projects you want to download.

## Tested Browsers

The script has been tested on the latest versions of the following browsers:

| Browser    | Version           | Tested |
|------------|-------------------|--------|
| Chrome     | v136.0.7103.114    | ✅      |
| Firefox    | v138.0.4    | ✅      |

## Contributing

Feel free to fork this repository, submit issues, or contribute pull requests if you'd like to add features or improve the script.

## License

This script is provided under the **GNU GENERAL PUBLIC License**. See the LICENSE file for details.
