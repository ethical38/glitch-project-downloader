# Glitch Project Downloader (With Deleted Projects)

A Tampermonkey script to download all your Glitch projects, including deleted ones. It intercepts web requests to Glitch's API to retrieve project data and persistent tokens, allowing users to easily download their projects as ZIP files.

## Features
- Download all active Glitch projects with a single click.
- Optionally, download deleted projects.
- Works with both current and deleted projects by leveraging the Glitch API.
- Includes an easy-to-use "Download All Projects" button that appears in the Glitch interface.

## How It Works
1. **Intercepts Web Requests**: The script listens for requests to the Glitch API and extracts project data and persistent tokens.
2. **Download Button**: Once the page loads, a "Download All Projects" button appears, enabling users to download all their projects as ZIP files.
3. **Deleted Projects**: If you want to download deleted projects, the script can handle that as well (though you would need to modify the download logic to include them).

## Installation

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** (or a similar userscript manager) in your browser.
2. Create a new script and paste the contents of `glitch-project-downloader.user.js` into it.
3. Save the script, and visit [Glitch](https://glitch.com).
4. You should see a "Download All Projects" button on the Glitch dashboard once the page has loaded.

## Usage

- Once the script is installed and active, navigate to your Glitch dashboard.
- The "Download All Projects" button will appear.
- Click the button to download all of your active projects as ZIP files.

### Optional: Download Deleted Projects

The script can also handle downloading deleted projects. You can modify the script to enable this feature by uncommenting the relevant section in the script, which is currently set to download active projects only.

## Requirements
- Tampermonkey or similar userscript manager.
- A Glitch account with projects you want to download.

## Contributing

Feel free to fork this repository, submit issues, or contribute pull requests if you'd like to add features or improve the script.

## License

This script is provided under the MIT License. See the LICENSE file for details.
