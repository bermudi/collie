// Mint a device-pairing code — Pup's stand-in for upstream's `collie pair`, which lives in the
// CLI this fork strips (ADR 9004). Pairing is always on (ADR 0086): reads need the token, so the
// FIRST device has to be admitted by exactly this verb, and every later one too.
//
// Reuses the bridge's own primitives (bridge/pairing.ts: newPending, filePairingIo) so the file it
// writes is byte-compatible with what the running bridge's /api/pair claims against — the same
// posture push-test.ts takes with the Push class. Only the code's HASH is persisted; the code
// itself exists here, on the operator's terminal, for ten minutes.
//
//   bun run scripts/pair.ts [--expires 30d|h|w]    (or: bash scripts/collie-ctl.sh pair [...])
//
// --expires puts a lifetime on the TOKEN the code mints (upstream parity); without it the token
// never expires. Prints the code, a scannable /settings?pair=<code> QR when a front-door URL is
// known, and where to type it by hand.

import { filePairingIo, generateCode, newPending } from "../bridge/pairing.ts";
import { resolveStateDir } from "../bridge/config.ts";

/** `30d` / `12h` / `2w` → ms, mirroring the CLI's `--expires` units exactly. */
function lifetimeMs(spec: string): number | undefined {
  const m = spec.match(/^(\d+)\s*([dhw])$/i);
  if (m === null) return undefined;
  const n = Number(m[1]);
  const unit = { d: 86_400_000, h: 3_600_000, w: 7 * 86_400_000 }[m[2]!.toLowerCase()]!;
  return n * unit;
}

const args = process.argv.slice(2);
let tokenLifetimeMs: number | undefined;
const expiresAt = args.indexOf("--expires");
if (expiresAt !== -1) {
  const spec = args[expiresAt + 1];
  if (spec === undefined) {
    console.error("--expires wants a unit: 30d, 12h, 2w");
    process.exit(2);
  }
  tokenLifetimeMs = lifetimeMs(spec);
  if (tokenLifetimeMs === undefined) {
    console.error(`--expires: "${spec}" is not <n>d|h|w`);
    process.exit(2);
  }
  args.splice(expiresAt, 2);
}

const stateDir = resolveStateDir();
const io = filePairingIo(stateDir);
const code = generateCode();
await io.writePending(newPending(code, Date.now(), undefined, tokenLifetimeMs));

const url = process.env.COLLIE_PAIR_URL; // set by collie-ctl.sh when a front door is known
console.log("");
console.log(`  pairing code:  ${code}`);
console.log(`  valid for:     10 minutes, 5 attempts`);
console.log(`  on the phone:  Collie → Settings → System → pair form`);
if (tokenLifetimeMs !== undefined) {
  console.log(`  token expires: after ${specFor(tokenLifetimeMs)} (revoke or re-pair anytime)`);
}
console.log("");
if (url) {
  const landing = `${url.replace(/\/$/, "")}/settings?pair=${code}`;
  try {
    const { renderQr } = await import("./qr.ts");
    process.stdout.write("\n" + (await renderQr(landing)) + "\n" + landing + "\n\n");
  } catch {
    console.log(landing);
  }
} else {
  console.log("  (no front-door URL known — COLLIE_PAIR_URL unset; type the code by hand)");
}

function specFor(ms: number): string {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000}d`;
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  return `${ms / (7 * 86_400_000)}w`;
}
