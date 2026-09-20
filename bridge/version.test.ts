import { describe, expect, test } from "bun:test";

import { collieVersion, collieVersionBare } from "./version.ts";

// ── THE VERSION UNDER A PACKAGE SWAP (M17/02) ───────────────────────────────────────────────────
//
// `collieVersion` and `collieVersionBare` read `web/dist/build-info.json` and `herdr-plugin.toml`
// FROM DISK ON EVERY CALL, which is what makes them able to notice a package manager replacing the
// root under a live process. It is also what makes calling one per request a defect: a bridge that
// re-read the manifest to answer `hello` would start naming the NEW version while running the OLD
// code, and a lead reads that as "that peer already levelled" and moves on.
//
// So the rule is: capture once at boot, compare against a live read to raise restart-needed, and put
// the CAPTURED string on the wire. Stale but true, never new but false.

const ROOT = "/opt/collie";

/** A fake disk. The reader is injectable precisely so this file needs no temp directory. */
function disk(version: string): (p: string) => string | null {
  return (p) => (p.endsWith("herdr-plugin.toml") ? `version = "${version}"\n` : null);
}

describe("the wire version stays the one it is running", () => {
  test("a manifest swapped under a running bridge does not change the captured string", () => {
    // Boot. This is `bridge/index.ts`'s `version`, resolved once.
    const files = { read: disk("0.48.0") };
    const version = collieVersionBare(ROOT, files.read);
    const bootVersion = collieVersion(ROOT, files.read);
    expect(version).toBe("0.48.0");

    // An update lands. The files say 0.49.0; this process is still 0.48.0.
    files.read = disk("0.49.0");

    // What `/api/health` answers is the captured string, and it has not moved.
    expect(version).toBe("0.48.0");
    // And a LIVE read disagrees with the boot capture — which is the restart-needed signal itself.
    expect(collieVersion(ROOT, files.read)).not.toBe(bootVersion);
  });

  test("the bridge resolves its wire version once, at module scope, and never per request", async () => {
    const source = await Bun.file(new URL("./index.ts", import.meta.url)).text();
    // One resolution, and it is the bare spelling — a parenthetical would make a machine with no
    // built bundle read as skewed against itself.
    expect(source.split("collieVersionBare(").length - 1).toBe(1);
    expect(source).toContain("const version = collieVersionBare(rootDir);");
  });
});
