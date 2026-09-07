// A launcher row's pinned `cwd` is an absolute path on the host that answered — and the phone has
// no shell to shorten it with. `GET /api/config` answers the actual home dir for that host
// (`BridgeConfig.launchersHome`), so this collapses against THAT fact instead of guessing at $HOME
// by pattern-matching `/home/<user>` — a guess that is wrong the moment the operator runs a less
// common layout.

/**
 * Shorten `path` to a leading `~` when it sits under `home`, exactly (path === home) or as a
 * descendant (path === home + "/…"). Anything else — a different tree entirely, or a path that
 * merely shares `home` as a string prefix without the directory boundary (`/home/opera` under
 * `/home/op`) — is returned unchanged, because a false "under home" is a worse reading than none.
 */
export function shortenHome(path: string, home: string): string {
  if (home === "") return path;
  // Trim a trailing slash off `home` so `home + "/"` below never doubles one — the operator's
  // own home dir string is never trusted to already be normalised.
  const base = home.endsWith("/") ? home.slice(0, -1) : home;
  if (base === "") return path;
  if (path === base) return "~";
  if (path.startsWith(`${base}/`)) return `~${path.slice(base.length)}`;
  return path;
}
