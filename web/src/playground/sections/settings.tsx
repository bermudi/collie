// Settings section of the states playground. Split out of app.tsx; see that file's header comment
// for the whole page's rules.

import { NotifyPrefsCard } from "@/components/notify-prefs-control";
import { NewSpaceSheet } from "@/components/new-space-sheet";
import { SpaceOverview } from "@/components/space-overview";
import {
  devicesPaired,
  devicesUnpaired,
  homeSolo,
  spacesWithWorktrees,
  watchedPanes,
} from "../fixtures";
import { Card, Group, Section, SettingsRouter, Stage, type SectionDef } from "../harness";
import { PhoneFrameCard } from "./shared";

export const DEF: SectionDef = {
  id: "settings",
  title: "Settings",
  intent:
    "The whole settings route, mounted twice: once on a solo collie with nothing paired, once with three paired devices to show for it.",
};

export function SettingsSection() {
  return (
    <Section def={DEF}>
      <Group title="Settings">
        <Card
          state="settings-solo-unpaired"
          label="settings, solo collie, nothing paired"
          reach="tap the gear from the dashboard. With no device paired, writes are ungated and the Paired devices card offers the pairing verb instead of a list."
          note="The whole real route. Two things on it still reach the network on purpose — /api/config for the diagnostics build, and the browser's own push subscription — and both fail soft, so the page renders whole with no bridge."
          span={2}
        >
          <PhoneFrameCard height={760}>
            <SettingsRouter home={homeSolo} devices={devicesUnpaired} />
          </PhoneFrameCard>
        </Card>

        <Card
          state="settings-paired"
          label="settings, three devices paired"
          reach="pair a phone with `collie pair`, then open Settings again. The device list names which row is the phone you are holding."
          note="One Updates card, where a page of update cards used to stand: the check control confirms an up-to-date result or surfaces a failure, and the footer chip carries the actionable lines."
          span={2}
        >
          <PhoneFrameCard height={760}>
            <SettingsRouter home={homeSolo} devices={devicesPaired} />
          </PhoneFrameCard>
        </Card>
      </Group>

      <Group title="Notify when">
        <Card
          state="settings-notify-cache-row"
          label="notify card, the fourth switch and the panes watched one by one"
          reach="scroll to Notify when in Settings. The fourth row is the cache warning, off by default,
            and the section under it names the panes switched on one at a time from their own sheets —
            which is what makes the global-OR-per-pane rule visible instead of implicit."
          note="The real card with a fixture: the playground answers no API, so the controller's two
            fetches are replaced by handed-in values rather than stubbed."
        >
          <Stage height={420}>
            <div className="p-4">
              <NotifyPrefsCard
                prefs={{ blocked: true, done: false, updates: true, cache: false }}
                busy={false}
                onToggle={() => {}}
                entries={watchedPanes}
                entriesBusy={false}
                onForget={() => {}}
              />
            </div>
          </Stage>
        </Card>
      </Group>

      <Group title="Spaces">
        <Card
          state="spaces-repo-worktrees"
          label="spaces, a repo and its worktrees"
          reach="open a worktree of a repo you already have open as a space. Herdr reports the repo on both, so the list nests the worktree under the checkout showing that repo — no extra call, and nothing to switch on."
          note="`blog` sits outside any repo and stays flat, which is the same row it always was. A worktree whose repo is NOT open would also stay flat: there would be nothing to indent under."
          span={2}
        >
          <PhoneFrameCard height={430}>
            <SpaceOverview
              workspaces={spacesWithWorktrees}
              // No agents: this card is about SHAPE. With a herd attached every row also carries its
              // triage tint, and a wall of "needs you" red says nothing about nesting.
              agents={[]}
              onOpen={() => {}}
              onNewSpace={() => {}}
              open
              onOpenChange={() => {}}
            />
          </PhoneFrameCard>
        </Card>

        <Card
          state="new-space-worktree-tab"
          label="new space, the worktree tab"
          reach="tap + on the spaces list where at least one open space sits in a repo. With no repo open (or a multiplexer that cannot make one) the tab strip is not rendered at all and this is the plain new-space sheet."
          note="The repo picker is here because the sheet is opened from the LIST, where there is no current space to take a repo from. `Or open one that already exists` reads the worktrees of the chosen repo once — it is the only route to a checkout that is not a space."
          span={2}
        >
          <PhoneFrameCard height={560}>
            <NewSpaceSheet
              open
              onClose={() => {}}
              onCreate={() => {}}
              repos={[
                { workspaceId: "w1", repoRoot: "/src/collie", label: "collie" },
                { workspaceId: "w9", repoRoot: "/src/nixcfg", label: "nixcfg" },
              ]}
              onCreateWorktree={() => {}}
              onOpenWorktree={() => {}}
            />
          </PhoneFrameCard>
        </Card>

      </Group>
    </Section>
  );
}
