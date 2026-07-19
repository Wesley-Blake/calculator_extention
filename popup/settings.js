// Settings page: lists the sites the calculator has been granted
// permission to run on (via the popup's "Allow this site" button), and
// lets the user revoke that access. See background.js for how the
// content script registration is kept in sync with this list.

const hostsContainer = document.getElementById('hosts');

// Matches the popup's theme (see popup/popup.js) via the shared
// browser.storage.local copy, and stays in sync if it's changed there
// while this page is open.
function applyTheme(theme) {
  document.documentElement.classList.toggle('theme-light', theme === 'light');
}

async function loadTheme() {
  const stored = await browser.storage.local.get(THEME_STORAGE_KEY);
  applyTheme(stored[THEME_STORAGE_KEY] || 'dark');
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && THEME_STORAGE_KEY in changes) {
    applyTheme(changes[THEME_STORAGE_KEY].newValue || 'dark');
  }
});

async function revokeOrigin(origin) {
  // Look up tabs already on this site while we still hold the host
  // permission needed to see their URLs — we're about to give that up.
  // Best-effort only: if this fails, the revoke below must still go through.
  const openTabs = await browser.tabs.query({ url: originPattern(origin) }).catch(() => []);

  await browser.permissions.remove({ origins: [originPattern(origin)] });
  await removeAllowedHost(origin);
  await requestUnregistration(origin);

  // Unregistering only stops *future* page loads from getting the content
  // script — a tab that already has it injected keeps running until
  // reloaded, so make sure that happens for every open tab on this site.
  await Promise.all(openTabs.map((tab) => browser.tabs.reload(tab.id).catch(() => {})));
}

function renderHostRow(origin) {
  const row = document.createElement('div');
  row.className = 'host-row';

  const label = document.createElement('span');
  label.className = 'host-origin';
  label.textContent = origin;

  const revokeButton = document.createElement('button');
  revokeButton.type = 'button';
  revokeButton.textContent = 'Revoke';
  revokeButton.addEventListener('click', async () => {
    if (!confirm(`Revoke calculator access for ${origin}?`)) return;
    await revokeOrigin(origin);
    render();
  });

  row.append(label, revokeButton);
  return row;
}

async function render() {
  const hosts = await getAllowedHosts();
  hostsContainer.innerHTML = '';

  if (!hosts.length) {
    hostsContainer.textContent = 'No sites allowed yet — use "Allow this site" in the calculator popup.';
    return;
  }

  hosts.forEach((origin) => hostsContainer.appendChild(renderHostRow(origin)));
}

loadTheme();
render();
