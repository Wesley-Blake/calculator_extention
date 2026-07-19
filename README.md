# Calculator Extension

A lightweight browser extension that provides a quick, easy-to-use calculator available from the extension popup and via content/background scripts.

## Features
- Double-click any input, textarea, or content-editable area to open an inline calculator
- Type an expression and press Enter — the field is replaced with the numeric result
- Result is copied to the clipboard automatically
- Lightweight parser with support for + - * / ^ and parentheses
- Per-site permissions: the overlay only runs on sites you've explicitly allowed

## Files
- `manifest.json`: Extension manifest and permissions
- `shared.js`: Constants/storage helpers shared by the background script, popup, and settings page
- `popup/popup.html`, `popup/popup.css`, `popup/popup.js`: Popup UI and logic
- `popup/settings.html`, `popup/settings.js`: Settings page — review and revoke allowed sites
- `calculator.js`: Core calculator logic and utilities
- `background.js`: Background script — keeps the content script registered on allowed sites
- `content.js`: Content script — opens floating calculator on double-click and inserts results

## Site permissions
The calculator overlay doesn't run anywhere by default. To enable it on a site:
1. Open the extension popup while on that site.
2. Click "Allow this site" and approve the browser's permission prompt.

Allowed sites are listed in the settings page (gear icon in the popup, top left), where access can be revoked at any time. Permissions and the allow-list both persist across browser restarts.

## Installation
This is a Firefox extension (uses the `browser.*` WebExtension API and Firefox-only `browser.contentScripts.register()`).
1. Clone or download this repository.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Click "Load Temporary Add-on…" and select `manifest.json` from the project folder.

## Usage
- Double-click any editable field on a webpage to open the calculator overlay.
- Enter an expression (e.g. `2+3*4`) and press Enter — the field will be replaced with `14` and the result copied to clipboard.
- Reload the extension after code changes to test updates.

## Permissions
The extension requests only the permissions declared in `manifest.json`. Review the manifest before installing.

## Development
- Make code changes in the respective files and reload the extension in Developer mode to test.
- To debug the popup, open its inspector via the extensions page (Inspect views).

## Contributing
- Feel free to open issues or pull requests with improvements, bug fixes, or feature suggestions.

## License
This project is licensed under the terms in the `LICENSE` file.

