// DOM references for the calculator display and history sidebar
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyPanel = document.getElementById('history-panel');
const themeToggle = document.getElementById('theme-toggle');

// Current calculator input and recent result history
let expression = '';
let history = [];
const THEME_STORAGE_KEY = 'calculator-theme';

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.classList.toggle('theme-light', isLight);

  if (themeToggle) {
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-pressed', String(isLight));
  }
}

function loadTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(savedTheme);
}

function setExpression(nextExpression) {
  expression = nextExpression;
  updateDisplay();
}

// Update the screen display and result preview
function updateDisplay() {
  const currentExpression = expression || '0';
  expressionEl.value = currentExpression;
  expressionEl.setAttribute('title', currentExpression);

  const nextResult = expression ? window.Calculator.evaluateExpression(expression) : '0';
  const displayResult = nextResult === 'Error' ? '-' : nextResult;
  resultEl.textContent = displayResult;
  resultEl.setAttribute('title', displayResult);
}

// Render the history sidebar from the most recent entries
function renderHistory() {
  const items = history.slice(-20).reverse();

  if (!items.length) {
    historyPanel.innerHTML = `
      <button class="history-item" type="button">No history yet</button>
    `;
    return;
  }

  historyPanel.innerHTML = `
    ${items
      .map(
        (entry) => `
          <button class="history-item" type="button" data-expression="${entry.expression}">
            <span class="history-expression">${entry.expression}</span>
            <span class="history-result">${entry.result}</span>
          </button>
        `
      )
      .join('')}
  `;
}

// Add a new calculation to history, keeping the last 20 entries
function addHistoryEntry(input, result) {
  if (!input || !input.trim()) {
    return;
  }

  const normalizedInput = input.trim();
  if (normalizedInput === result) {
    return;
  }

  history.push({ expression: normalizedInput, result });
  if (history.length > 20) {
    history = history.slice(-20);
  }
}

// Append a history entry back into the current expression
function appendHistoryExpression(value) {
  setExpression(expression + value);
}

// Append a number or decimal to the current expression
function appendValue(value) {
  if (value === '.' && /\.\d*$/.test(expression)) {
    return;
  }

  if (expression === '' && /[0-9.]/.test(value)) {
    setExpression(value === '.' ? '0.' : value);
  } else {
    setExpression(expression + value);
  }
}

// Handle operator input, enforcing valid expression syntax
function handleOperator(value) {
  if (value === '(') {
    if (expression === '' || /[+\-*/^(]$/.test(expression)) {
      setExpression(expression + value);
    }
  } else if (value === ')') {
    if (expression && /[0-9)]/.test(expression.slice(-1))) {
      setExpression(expression + value);
    }
  } else {
    if (expression === '' && value !== '-') {
      return;
    }

    if (/[+\-*/^]$/.test(expression)) {
      setExpression(expression.slice(0, -1) + value);
    } else {
      setExpression(expression + value);
    }
  }
}

// Reset the current expression and clear the display
function clearExpression() {
  setExpression('');
}

// Remove the last entered character from the expression
function deleteLast() {
  setExpression(expression.slice(0, -1));
}

async function copyResultToClipboard(result) {
  try {
    await navigator.clipboard.writeText(result);
  } catch (error) {
    console.warn('Unable to copy result to clipboard:', error);
  }
}

// Evaluate the current expression and store success results in history
async function evaluate() {
  const result = window.Calculator.evaluateExpression(expression);
  if (result === 'Error') {
    updateDisplay();
    return;
  }

  addHistoryEntry(expression, result);
  renderHistory();
  await copyResultToClipboard(result);
  setExpression(result);
}

// Keep the editable field in sync with the current expression
expressionEl.addEventListener('input', () => {
  setExpression(expressionEl.value);
});

// Reuse a clicked history expression in the current calculator input
historyPanel.addEventListener('click', (event) => {
  const button = event.target.closest('.history-item');
  const expressionToAppend = button?.dataset.expression;

  if (expressionToAppend) {
    appendHistoryExpression(expressionToAppend);
  }
});

// Keyboard shortcuts for calculator input and control keys
document.addEventListener('keydown', (event) => {
  const key = event.key;
  const isOperatorKey = ['+', '-', '*', '/', '^', '(', ')'].includes(key);

  if (/^[0-9.]$/.test(key)) {
    appendValue(key);
    event.preventDefault();
  } else if (isOperatorKey) {
    handleOperator(key);
    event.preventDefault();
  } else if (key === 'Enter') {
    evaluate();
    event.preventDefault();
  } else if (key === 'Backspace') {
    deleteLast();
    event.preventDefault();
  } else if (key === 'Delete') {
    clearExpression();
    event.preventDefault();
  } else if (key === 'Escape') {
    clearExpression();
    event.preventDefault();
  }
});

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
});

// Initialize UI state when popup loads
loadTheme();
updateDisplay();
