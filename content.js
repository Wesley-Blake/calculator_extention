// Content script: show a floating calculator when the user double-clicks into an input.

function createCalculatorOverlay() {
  if (document.getElementById('ext-calc-overlay')) return null;

  const overlay = document.createElement('div');
  overlay.id = 'ext-calc-overlay';
  overlay.style.position = 'absolute';
  overlay.style.zIndex = 2147483647;
  overlay.style.minWidth = '220px';
  overlay.style.padding = '8px';
  overlay.style.background = '#fff';
  overlay.style.border = '1px solid #ccc';
  overlay.style.borderRadius = '6px';
  overlay.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  overlay.style.fontFamily = 'Arial, sans-serif';

  overlay.innerHTML = `
    <input id="ext-calc-input" type="text" placeholder="Enter expression and press Enter" 
      style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;" />
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('#ext-calc-input');

  function evaluateExpression(expr) {
    try {
      if (window.Calculator && typeof window.Calculator.evaluateExpression === 'function') {
        return window.Calculator.evaluateExpression(expr || '');
      }
    } catch (e) {}
    return 'Error';
  }

  input.addEventListener('keydown', async (ev) => {
    if (ev.key === 'Enter') {
      const out = evaluateExpression(input.value || '');

      if (out && out !== 'Error') {
        // Replace the entire target field value/content with the result
        try {
          if (overlay._target) {
            const target = overlay._target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
              try {
                target.value = out;
                const pos = String(out).length;
                try { target.setSelectionRange(pos, pos); } catch (e) {}
              } catch (e) {
                target.value = out;
              }
            } else if (target.isContentEditable) {
              target.innerText = out;
              try {
                const range = document.createRange();
                range.selectNodeContents(target);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              } catch (e) {}
            }
            try { await navigator.clipboard.writeText(out); } catch (e) {}
          }
        } catch (e) {}
      }
      removeOverlay();
    }
    if (ev.key === 'Escape') removeOverlay();
  });

  return overlay;
}

function removeOverlay() {
  const el = document.getElementById('ext-calc-overlay');
  if (el) el.remove();
}

function showOverlayNearTarget(target, prefill) {
  let overlay = document.getElementById('ext-calc-overlay') || createCalculatorOverlay();
  if (!overlay) return;

  const rect = target.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 6;
  const left = window.scrollX + rect.left;

  overlay.style.top = `${top}px`;
  overlay.style.left = `${left}px`;

  const input = overlay.querySelector('#ext-calc-input');
  input.value = prefill || '';
  input.focus();
  input.select();
  overlay._target = target;
}

// Listen for double-clicks on input-like elements
document.addEventListener('dblclick', (ev) => {
  const t = ev.target;
  if (!t) return;
  const isInput = (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || t.isContentEditable;
  if (!isInput) return;

  // If there's a selection inside the element, use it as prefill
  let prefill = '';
  try {
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
      const start = t.selectionStart;
      const end = t.selectionEnd;
      if (start !== null && end !== null && end > start) {
        prefill = t.value.slice(start, end);
      }
    } else {
      const sel = window.getSelection();
      if (sel && sel.toString()) prefill = sel.toString();
    }
  } catch (e) {}

  showOverlayNearTarget(t, prefill);
});

// Close overlay on Escape anywhere or click outside
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') removeOverlay();
});

document.addEventListener('click', (ev) => {
  const overlay = document.getElementById('ext-calc-overlay');
  if (!overlay) return;
  if (overlay.contains(ev.target)) return;
  // If clicked outside an input/textarea that opened it, remove overlay
  removeOverlay();
});

// Content script loaded.
