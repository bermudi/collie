// THE CONFORMANCE FIXTURE REGISTRY — the second half of what registering an adapter means.
//
// `registry.ts` says which multiplexers this build can DRIVE. This says how each of them is PROVED:
// one {@link MuxConformanceFixture} per registered adapter, and `conformance.test.ts` fails an
// adapter that has none. Two lists rather than one field on the factory, because a fixture pulls in a
// fake transport and a seeded world — none of which belongs in the module the bridge starts from.
//
// Adding tmux (M10/04) or zellij (M10/05) is therefore exactly two lines: its factory in
// `MUX_ADAPTERS`, its fixture here. No new test file, ever — the suite iterates.
//

import type { MuxConformanceFixture } from "./conformance.ts";
import { herdrConformanceFixture } from "./herdr/fixture.ts";
import { tmuxConformanceFixture } from "./tmux/fixture.ts";
import { zellijConformanceFixture } from "./zellij/fixture.ts";

/**
 * One fixture per registered adapter, plus the decorated build of each adapter that has a beacon
 * matcher. Keyed by nothing — the suite matches on `fixture.mux`, and a variant shares it.
 */
export const MUX_CONFORMANCE_FIXTURES: readonly MuxConformanceFixture[] = [
  herdrConformanceFixture,
  tmuxConformanceFixture,
  zellijConformanceFixture,
];

/**
 * The fixture for `mux`, or undefined when the adapter has not contributed one.
 *
 * The FIRST match, which is the undecorated one: this answers "is this adapter proved at all", and
 * the variants are extra proof of a build rather than a replacement for the adapter's own.
 */
export function fixtureFor(mux: string): MuxConformanceFixture | undefined {
  return MUX_CONFORMANCE_FIXTURES.find((fixture) => fixture.mux === mux);
}
