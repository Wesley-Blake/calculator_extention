// Constants and small storage helpers shared by background.js, popup.js,
// and settings.js — kept in one place instead of duplicated across those
// three separate script contexts.

const ALLOWED_HOSTS_KEY = 'allowedHosts';
const THEME_STORAGE_KEY = 'calculator-theme';

function originPattern(origin) {
  return `${origin}/*`;
}

async function getAllowedHosts() {
  const stored = await browser.storage.local.get(ALLOWED_HOSTS_KEY);
  return stored[ALLOWED_HOSTS_KEY] || [];
}

async function addAllowedHost(origin) {
  const hosts = await getAllowedHosts();
  await browser.storage.local.set({
    [ALLOWED_HOSTS_KEY]: Array.from(new Set([...hosts, origin])),
  });
}

async function removeAllowedHost(origin) {
  const hosts = await getAllowedHosts();
  await browser.storage.local.set({
    [ALLOWED_HOSTS_KEY]: hosts.filter((host) => host !== origin),
  });
}

// Tell the background script to register/unregister the content script for
// an origin, and wait for it to finish — the popup and settings page both
// reload the affected tab right after, and need the registration change to
// have actually landed first (registrations only affect future page loads).
function requestRegistration(origin) {
  return browser.runtime.sendMessage({ type: 'ensureRegistered', origin });
}

function requestUnregistration(origin) {
  return browser.runtime.sendMessage({ type: 'ensureUnregistered', origin });
}
