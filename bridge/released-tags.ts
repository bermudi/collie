// A tag is not a release.
//
// GitHub's `/tags` endpoint lists every ref ever pushed — including foreign ones. A fork that
// merges its upstream wholesale can carry upstream's ENTIRE tag history: one `git push
// --follow-tags` after the merge flushes them all (2026-10-16: 130 of upstream's tags sat on
// bermudi/collie, and the banner announced upstream's 1.21.2 as "a new major" over the running
// 0.56.1 — `collie update --major` would have detached the checkout onto upstream's own commit).
//
// The release workflow is the only thing that creates a GitHub release, so `/releases` is the
// discriminator: a tag with no release behind it is not an update candidate, whatever its semver.
// Upstream reads raw tags by design (docs/upgrading.md — on that repo every tag is theirs); this
// file intersects that read with what the repo actually released. Where every tag is honestly the
// repo's own, the filter changes nothing.
//
// Three seams, mirroring `update.ts`'s own:
//   * `githubReleasesUrl` — the endpoint, paged like `/tags`.
//   * `readAllReleasedTagNames` — every page through the caller's fetch (the bridge's `fetch` or
//     the CLI's `net` seam), answering the `tag_name` set or the caller's own failure.
//   * `releasedTagsOnly` — the monitor's `fetchTags` composed behind the set.
//
// A rehearsal mirror is fixture-controlled truth and serves no `/releases` list: callers pass
// `null` where one is in play and the tags go through unfiltered.

import type { JsonValue } from "./json.ts";
import {
  type ApiTag,
  type GithubCredential,
  githubHeaders,
  MIRROR_FETCH,
  TAG_PAGE_SIZE,
  TAG_PAGES_MAX,
  type TagPage,
} from "./update.ts";

/** The endpoint that answers which tags are RELEASES — the discriminator `/tags` cannot give. */
export function githubReleasesUrl(repo: string, mirror: string | null = null, page = 1): string {
  return `${mirror ?? "https://api.github.com"}/repos/${repo}/releases?per_page=${TAG_PAGE_SIZE}${page > 1 ? `&page=${page}` : ""}`;
}

/** `/releases` → the tag names it covers. Drafts are dropped — a release nobody can see announces
 *  nothing. Prereleases stay: a published prerelease is a real release of a real tag, and the
 *  candidate sets downstream decide what a prerelease is for. */
export function parseReleasesResponse(data: JsonValue): string[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((r) => {
    if (r === null || typeof r !== "object" || Array.isArray(r)) return [];
    if (r.draft === true) return [];
    if (typeof r.tag_name !== "string" || r.tag_name === "") return [];
    return [r.tag_name];
  });
}

/** Every released tag name, page after page — the released-set twin of `readAllTags`: the same
 *  paging bound, and the same rule that the first failed page fails the whole read. */
export async function readAllReleasedTagNames<F>(
  repo: string,
  mirror: string | null,
  fetchPage: (url: string) => Promise<TagPage<F>>,
): Promise<{ ok: true; names: ReadonlySet<string> } | { ok: false; failure: F }> {
  const names = new Set<string>();
  for (let page = 1; page <= TAG_PAGES_MAX; page++) {
    const answer = await fetchPage(githubReleasesUrl(repo, mirror, page));
    if (!answer.ok) return answer;
    for (const name of parseReleasesResponse(answer.value)) names.add(name);
    if (!Array.isArray(answer.value) || answer.value.length < TAG_PAGE_SIZE) break;
  }
  return { ok: true, names };
}

const RELEASES_TIMEOUT_MS = 10_000;

/** HTTPS fetch of a repo's released tag names, with the credential and mirror handled the way
 *  `githubTagsFetcher` handles them. Throws on a non-OK response or timeout so the caller keeps
 *  its previous result and retries next tick. */
export function githubReleasedTagNames(
  repo: string,
  credential: GithubCredential | null = null,
  mirror: string | null = null,
): () => Promise<ReadonlySet<string>> {
  const fetchPage = async (url: string): Promise<TagPage<never>> => {
    const init: RequestInit = {
      headers: githubHeaders(url, credential, {
        accept: "application/vnd.github+json",
        "user-agent": "collie-update-check",
      }),
      signal: AbortSignal.timeout(RELEASES_TIMEOUT_MS),
    };
    if (mirror !== null) init.redirect = MIRROR_FETCH.redirect;
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`github releases: HTTP ${res.status}`);
    // SAFETY: `Response.json()` output IS a JsonValue by construction; `parseReleasesResponse`
    // checks every field before it is kept.
    return { ok: true, value: (await res.json()) as JsonValue };
  };
  return async () => {
    const all = await readAllReleasedTagNames(repo, mirror, fetchPage);
    return all.ok ? all.names : new Set<string>();
  };
}

/** The own-channel `fetchTags`, restricted to tags the repo actually released. A `fetchReleased`
 *  of `null` means no filter (a rehearsal mirror is its own truth). A released-set read that
 *  throws fails the composed fetch: an unverifiable tag list never announces an update. */
export function releasedTagsOnly(
  fetchTags: () => Promise<readonly ApiTag[]>,
  fetchReleased: (() => Promise<ReadonlySet<string>>) | null,
): () => Promise<ApiTag[]> {
  if (fetchReleased === null) return async () => [...(await fetchTags())];
  return async () => {
    const tags = await fetchTags();
    const released = await fetchReleased();
    return tags.filter((t) => released.has(t.name));
  };
}
