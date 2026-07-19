// Content script: shows a floating calculator when the user double-clicks
// into an input, textarea, or content-editable element.
//
// This file is only ever injected into sites the user has granted
// permission to (see background.js), so no permission check is needed
// here — if this code is running, the site is allowed.

// Same storage key and dark/light color choices as popup/popup.js and
// popup.css, so the on-page overlay matches whatever theme is set in the
// popup. Kept as a small inline palette (rather than sharing popup.css)
// since this needs to stay independent of the host page's own stylesheet.
const THEME_STORAGE_KEY = 'calculator-theme';
const THEMES = {
  dark: {
    background: '#111827',
    border: '#374151',
    text: '#f9fafb',
    inputBackground: '#1f2937',
    placeholder: '#64748b',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  light: {
    background: '#ffffff',
    border: '#cbd5e1',
    text: '#0f172a',
    inputBackground: '#e2e8f0',
    placeholder: '#64748b',
    shadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
  },
};

// Read the current theme from extension storage so the overlay matches the popup UI.
async function getTheme() {
  const stored = await browser.storage.local.get(THEME_STORAGE_KEY);
  return THEMES[stored[THEME_STORAGE_KEY]] ? stored[THEME_STORAGE_KEY] : 'dark';
}

// Placeholder color needs a real stylesheet rule (::placeholder can't be
// set inline), scoped by ID so it can't leak into or clash with the host
// page's own styles.
function applyPlaceholderStyle(color) {
  let styleEl = document.getElementById('ext-calc-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ext-calc-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `#ext-calc-input::placeholder { color: ${color}; }`;
}

// Create the floating calculator overlay that appears near the active editable field.
function createCalculatorOverlay(theme) {
  if (document.getElementById('ext-calc-overlay')) return null;

  const colors = THEMES[theme] || THEMES.dark;
  applyPlaceholderStyle(colors.placeholder);

  const overlay = document.createElement('div');
  overlay.id = 'ext-calc-overlay';
  overlay.style.position = 'absolute';
  overlay.style.zIndex = 2147483647;
  overlay.style.minWidth = '220px';
  overlay.style.padding = '8px';
  overlay.style.background = colors.background;
  overlay.style.border = `1px solid ${colors.border}`;
  overlay.style.borderRadius = '10px';
  overlay.style.boxShadow = colors.shadow;
  overlay.style.fontFamily = 'Arial, sans-serif';

  const input = document.createElement('input');
  input.id = 'ext-calc-input';
  input.type = 'text';
  input.placeholder = 'Enter expression and press Enter';
  input.style.width = '100%';
  input.style.padding = '8px';
  input.style.borderRadius = '6px';
  input.style.boxSizing = 'border-box';
  input.style.background = colors.inputBackground;
  input.style.border = `1px solid ${colors.border}`;
  input.style.color = colors.text;
  overlay.appendChild(input);

  document.body.appendChild(overlay);

  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const out = window.Calculator.evaluateExpression(input.value || '');

      if (out && out !== 'Error' && overlay._target) {
        const target = overlay._target;

        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          target.value = out;
          // Not every input type supports setSelectionRange (e.g. type="number").
          try {
            const pos = String(out).length;
            target.setSelectionRange(pos, pos);
          } catch (e) {
            // Selection isn't supported on this input type — value is already set.
          }
        } else if (target.isContentEditable) {
          target.innerText = out;
          const range = document.createRange();
          range.selectNodeContents(target);
          range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }

        try {
          await navigator.clipboard.writeText(out);
        } catch (e) {
          // Clipboard access can be denied by the page/browser; not critical.
        }
      }

      removeOverlay();
    }

    if (event.key === 'Escape') removeOverlay();
  });

  return overlay;
}

// Remove the floating calculator if it is currently open.
function removeOverlay() {
  const overlay = document.getElementById('ext-calc-overlay');
  if (overlay) overlay.remove();
}

// Position the overlay beside the target element and fill it with any selected text.
async function showOverlayNearTarget(target, prefill) {
  const overlay = document.getElementById('ext-calc-overlay') || createCalculatorOverlay(await getTheme());
  if (!overlay) return;

  const rect = target.getBoundingClientRect();
  overlay.style.top = `${window.scrollY + rect.bottom + 6}px`;
  overlay.style.left = `${window.scrollX + rect.left}px`;

  const input = overlay.querySelector('#ext-calc-input');
  input.value = prefill || '';
  input.focus();
  input.select();
  overlay._target = target;
}

// Pull the current text selection out of the target element, if any, so the
// overlay can start pre-filled with what the user already had selected.
function getSelectionPrefill(target) {
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const { selectionStart: start, selectionEnd: end } = target;
    return start !== null && end !== null && end > start ? target.value.slice(start, end) : '';
  }

  const selection = window.getSelection();
  return selection ? selection.toString() : '';
}

document.addEventListener('dblclick', (event) => {
  const target = event.target;
  if (!target) return;

  const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if (!isEditable) return;

  showOverlayNearTarget(target, getSelectionPrefill(target));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') removeOverlay();
});

// Clicking outside the overlay dismisses it.
document.addEventListener('click', (event) => {
  const overlay = document.getElementById('ext-calc-overlay');
  if (!overlay || overlay.contains(event.target)) return;
  removeOverlay();
});
