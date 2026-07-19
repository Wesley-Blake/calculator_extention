# Calculator Extension

A lightweight browser extension that provides a quick, easy-to-use calculator available from the extension popup and via content/background scripts.

## Features
- Double-click any input, textarea, or content-editable area to open an inline calculator
- Type an expression and press Enter — the field is replaced with the numeric result
- Result is copied to the clipboard automatically
- Lightweight parser with support for + - * / ^ and parentheses

## Files
- `manifest.json`: Extension manifest and permissions
- `popup/popup.html`, `popup/popup.css`, `popup/popup.js`: Popup UI and logic (optional)
- `calculator.js`: Core calculator logic and utilities
- `background.js`: Background script (event handling)
- `content.js`: Content script — opens floating calculator on double-click and inserts results

## Installation
1. Clone or download this repository.
2. Open your browser's extensions page (e.g., `chrome://extensions/` or `edge://extensions/`).
3. Enable Developer mode.
4. Click "Load unpacked" and select the project folder.

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

---

If you'd like, I can add screenshots, badges, or an option in the popup to enable/disable the double-click overlay.


