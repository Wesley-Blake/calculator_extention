// Background script: registers the calculator content script only on
// sites the user has explicitly allowed via the popup's "Allow this site"
// button (see popup/popup.js) or removed via the settings page
// (see popup/settings.js).
//
// Two things make this dynamic instead of a static entry in manifest.json:
//   1. Host permissions are opt-in per site (see "optional_permissions" in
//      manifest.json), so we can't list matches up front.
//   2. browser.contentScripts.register() registrations don't survive a
//      browser restart even though the underlying permission grant does,
//      so we have to re-create them every time this script starts up.
//      (The background page is marked "persistent" in manifest.json so
//      those registrations aren't lost if Firefox suspends an idle
//      extension page.)

// origin -> a promise for the handle returned by contentScripts.register(),
// so it can be unregistered again later. Granting a site triggers a
// registration both directly (the popup's "ensureRegistered" message) and
// indirectly (storage.onChanged -> syncRegistrations), so the promise is
// stored *before* awaiting it — a second concurrent call for the same
// origin then sees the map entry immediately and reuses it instead of
// creating a second, untracked registration that "remove" could never
// clean up.
const registeredScripts = new Map();

// Register the calculator content script for a specific site origin.
function registerHost(origin) {
  if (registeredScripts.has(origin)) return registeredScripts.get(origin);

  const registrationPromise = browser.contentScripts.register({
    matches: [originPattern(origin)],
    js: [{ file: 'calculator.js' }, { file: 'content.js' }],
    runAt: 'document_idle',
  });

  registeredScripts.set(origin, registrationPromise);
  return registrationPromise;
}

async function unregisterHost(origin) {
  const pending = registeredScripts.get(origin);
  if (!pending) return;

  registeredScripts.delete(origin);
  const handle = await pending;
  handle.unregister();
}

// Keep the live content-script registrations in sync with the allow-list.
// This removes sites that were revoked and adds sites that were newly allowed.
async function syncRegistrations() {
  const allowedHosts = await getAllowedHosts();
  const allowedSet = new Set(allowedHosts);

  const toUnregister = Array.from(registeredScripts.keys()).filter((origin) => !allowedSet.has(origin));
  await Promise.all(toUnregister.map(unregisterHost));

  await Promise.all(allowedHosts.map(registerHost));
}

browser.runtime.onInstalled.addListener(syncRegistrations);
browser.runtime.onStartup.addListener(syncRegistrations);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ALLOWED_HOSTS_KEY in changes) {
    syncRegistrations();
  }
});

// If the user revokes the site permission from Firefox's own
// about:addons permissions UI instead of our settings page, forget the
// site here too so the allow-list doesn't go stale.
browser.permissions.onRemoved.addListener(async ({ origins }) => {
  const removedOrigins = new Set((origins || []).map((pattern) => pattern.replace(/\/\*$/, '')));
  const allowedHosts = await getAllowedHosts();
  const nextHosts = allowedHosts.filter((host) => !removedOrigins.has(host));

  if (nextHosts.length !== allowedHosts.length) {
    await browser.storage.local.set({ [ALLOWED_HOSTS_KEY]: nextHosts });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === 'ensureRegistered') return registerHost(message.origin);
  if (message?.type === 'ensureUnregistered') return unregisterHost(message.origin);
});

syncRegistrations();
