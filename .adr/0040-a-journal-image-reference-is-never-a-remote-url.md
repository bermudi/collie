# 0040 — A journal image reference is this bridge's blob path or inline bytes, never a remote URL

Status: **Accepted** (2026-09-09) — the mirror half is superseded by
[0041](./0041-the-mirror-does-not-guess-images.md); everything this ADR says about journal
references still stands for History/transcript.

## Context

Journals now carry pictures: pi (and omp, which writes pi's format) records an `image` block with a
`data` payload, and a tool result can carry a screenshot. The phone wants to render those — the
desktop terminal shows the picture via the Kitty graphics protocol, while the mirror sees only the
placeholder cells it left behind.

A journal is an **agent's output**. The same field that holds a legit screenshot could hold
`https://evil.example/track.png`, and the moment that string becomes an `<img src>`, the phone
fetches an arbitrary host on the agent's word — a request the operator never made, from a page
inside the tailnet, leaking the pane's existence and the fact the bridge is up. "But the agent
wouldn't do that" is the model this repo refuses everywhere else: the reply guard assumes the screen
may be lying, the journal containment assumes the path may be hostile. The image reference gets the
same paranoia.

## Decision

**An image reference may take exactly two shapes, and both sides check independently:**

- `/api/blobs/<64 hex>` — this bridge's own content-addressed blob route (`server.ts` § `blobRoute`),
  whose bytes live under the `blobs/` directory sibling to a configured journal root, contained the
  same way every journal path is.
- `data:image/*;base64,…` — inline bytes the log itself carried.

Everything else is **dropped, not passed through**: `http://` and `https://` in both spellings
(bridge-side `pi.ts` § `resolveImageUrl`, including the bare-base64 branch a crafted `mimeType`
could smuggle a URL through), non-image `data:` values, and unrecognised shapes. The web side
re-checks with the same rule (`lib/api.ts` § `imageSrc`) because the side that *fetches* — the
`<img>` — is the side that must own the veto, and the two checks drift independently if either is
edited alone. A dropped reference renders as nothing (or the `[Image]` badge in the mirror), never
a broken image and never a request.

## Consequences

- An agent cannot make the phone call any host. The only origins an image can touch are the bridge
  itself (same-origin, already behind the access gate) or the document itself (inline bytes).
- Legit workflows that would have used a remote URL — an agent linking a screenshot it uploaded
  somewhere — are unsupported on purpose. If that day comes, the remedy is the operator pointing
  Collie at the file (`COLLIE_*_ROOT` / the blob store), not relaxing the refusal.
- CSP already matches: `img-src 'self' data:` admits exactly the two allowed shapes and nothing the
  refusal would have blocked anyway. The two layers agree by construction.
- The match from a mirror placeholder to a journal image is by ORDER (oldest-first against
  top-first, aligned from the end), not by id — the Kitty diacritics encode an image id no journal
  records. That is an approximation and the rendered card says so; this ADR covers only what a
  reference may BE, not how it is matched.
