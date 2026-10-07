// Dashboard section of the states playground. Split out of app.tsx; see that file's header comment
// for the whole page's rules.

import { ListTree, Rows3 } from "lucide-react";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";

import { AgentList, type HeadingNewTab } from "@/components/agent-list";
import { BuildStamp } from "@/components/build-stamp";
import { ListGroup } from "@/components/ui/list-group";
import { TabBar } from "@/components/ui/tab-bar";
import type { DashView } from "@/lib/dash-view";
import { countBlocked, hasReady } from "@/lib/triage";
import { t, tn } from "@/lib/i18n";
import { PaneStrip } from "@/components/pane-strip";
import type { PaneOrder } from "@/lib/pane-order";
import { ReadOnlyBanner } from "@/components/read-only-banner";
import { SessionSwitcher } from "@/components/session-switcher";
import { SpaceStrip } from "@/components/space-strip";
import { TabStrip } from "@/components/tab-strip";
import { UpdateRibbon } from "@/components/update-ribbon";
import { UpdateBanner } from "@/components/update-banner";
import { clearNotPaired, markNotPaired } from "@/lib/pairing";
import { holdReload, releaseReload, __resetReloadGuard } from "@/lib/reload-guard";
import { __resetSelfUpdate, __setReloadImpl } from "@/lib/self-update";
import { observeServerBuild, __resetServerBuild } from "@/lib/server-build";
import { DashboardRowsCard } from "../dashboard-card";
import {
  allPanes,
  deviceRefused,
  herd,
  homeSolo,
  manyTabs,
  manyTabsActiveTabId,
  manyTabsWorkspaceId,
  spaces,
  tabs,
  updateMajor,
  updateRelease,
  updateRestart,
} from "../fixtures";
import {
  Card,
  Group,
  RootRouter,
  Section,
  Segmented,
  Stage,
  type SectionDef,
} from "../harness";
import { PhoneFrameCard } from "./shared";

export const DEF: SectionDef = {
  id: "dashboard",
  title: "Dashboard",
  intent:
    "The home screen: the herd in triage order, the strips that say a write will be refused, the two update notices, and the footer's meta zone.",
};

/** Each workspace heading's "+" (M40/03), wired to nothing: the card shows where it sits, as the
 *  dashboard draws it, and a tap goes nowhere. */
const HEADING_NEW_TAB: HeadingNewTab = { scope: {}, creating: new Set(), onNewTab: () => {} };

/** The dashboard with its order toggle live (ADR 0071): tap a segment and the list re-ranks, the way
 *  the route does, with the reading held between taps. */
function OrderedAgentList({ initial }: { initial: PaneOrder }) {
  const [order, setOrder] = useState<PaneOrder>(initial);
  return (
    <AgentList
      agents={herd}
      bridge="connected"
      onOpen={() => {}}
      newTab={HEADING_NEW_TAB}
      order={order}
      onOrderChange={setOrder}
    />
  );
}

/** A tab body this card does not build for real: one quiet line saying what the tab would hold. */
const body = (label: string) => () => (
  <p className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">{label}</p>
);

/**
 * The dashboard's footer tabs and its needs-you switch (ADR 0085), composed from the real parts: the
 * real `AgentList` with the switch live, and the real `TabBar` with the items `routes/home.tsx`
 * builds. A mock of the route, not a mount of it: the route reads its tab and its switch from
 * localStorage, and the cards cannot share one store. The Changes tab's body is a placeholder,
 * because its own component fetches the changes and this page has no API.
 */
function DashboardTabsPhone({
  initialOn,
  initialView = "dashboard",
}: {
  initialOn: boolean;
  initialView?: DashView;
}) {
  const [on, setOn] = useState(initialOn);
  const [view, setView] = useState<DashView>(initialView);
  const [order, setOrder] = useState<PaneOrder>("place");
  const blocked = countBlocked(herd);
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AgentList
          agents={herd}
          bridge="connected"
          onOpen={() => {}}
          newTab={HEADING_NEW_TAB}
          order={order}
          onOrderChange={setOrder}
          needsYouOnly={view === "dashboard" && on}
          onNeedsYouOnlyChange={setOn}
          renderBody={
            view === "changes"
              ? body("The Changes tab's body, one row per workspace")
              : undefined
          }
        />
      </div>
      <TabBar<DashView>
        label={t("home.tabs.aria")}
        active={view}
        onSelect={setView}
        items={[
          {
            value: "dashboard",
            label: t("home.tabs.dashboard"),
            icon: <Rows3 className="size-5" />,
            badge: blocked,
            dot: blocked === 0 && hasReady(herd),
            badgeLabel: blocked > 0 ? tn("home.tabs.blocked", blocked) : t("home.tabs.unseen"),
          },
          { value: "changes", label: t("files.title"), icon: <ListTree className="size-5" /> },
        ]}
      />
    </>
  );
}

const TABS_REACH =
  "the dashboard's footer. Dashboard is the list and the default, under the thumb; the old Focus tab is the circle-dot switch in the summary line's row, beside the order toggle.";

export function DashboardSection() {
  return (
    <Section def={DEF}>
      <Group title="The herd">
        {/* First, deliberately: the row is the unit every other card on this page is made of, and it
            is the only card here drawn from a real snapshot rather than a designed herd. */}
        <DashboardRowsCard />

        <Card
          state="agent-list-working-herd"
          label="agent list, a working herd, all four sections"
          reach="the dashboard on a busy day. The order is the one the whole app agrees on: Needs you → Ready · unseen → Working → Recent."
          note="Fourteen panes across four spaces and five harnesses. `gemini` has no bundled logo, so it lands on the neutral initials tile — the honest rendering, not a placeholder."
          span={2}
        >
          <PhoneFrameCard>
            <AgentList agents={herd} bridge="connected" onOpen={() => {}} newTab={HEADING_NEW_TAB} />
          </PhoneFrameCard>
        </Card>

        <Card
          state="agent-list-activity-order"
          label="agent list, ordered by activity"
          reach="the operator taps the clock beside the status line. The workspace groups give way to one list, newest first, and each row names its workspace on line 2."
          note="The toggle is live: tap Place, Activity or Cache. The reading is taken when the order changes or the selected segment is tapped again, never on a poll. Check the controls row at 390px: the counts wrap before the toggle shrinks."
          span={2}
        >
          <PhoneFrameCard>
            <OrderedAgentList initial="activity" />
          </PhoneFrameCard>
        </Card>

        <Card
          state="agent-list-empty"
          label="agent list, empty"
          reach="a Herdr session with no agent panes in it. Nothing is wrong; there is simply nothing running."
        >
          <Stage height={220}>
            <AgentList agents={[]} bridge="connected" onOpen={() => {}} />
          </Stage>
        </Card>

        <Card
          state="agent-list-empty-stale"
          label="agent list, empty and stale"
          reach="the bridge stops answering while the herd list is empty. “Nothing is running” and “we do not know what is running” are different sentences, and this is the second one."
        >
          <Stage height={220}>
            <AgentList
              agents={[]}
              bridge={undefined}
              onOpen={() => {}}
              error
              lastSeenAt={homeSolo.ts - 3_600_000}
            />
          </Stage>
        </Card>
      </Group>

      <Group title="Write gate">
        <WriteGateCard />
      </Group>

      <Group title="Tabs and the needs-you switch">
        <Card
          state="dashboard-tabs-solo-switch-off"
          label="tabs, solo, switch off"
          reach={TABS_REACH}
          note="Two tabs, Dashboard and Changes. The switch is off: the Spaces navigator and the launch strip trail the list on the real route, and the pin hint sits under the summary line. The footer's red count is on Dashboard."
        >
          <PhoneFrameCard height={640}>
            <DashboardTabsPhone initialOn={false} />
          </PhoneFrameCard>
        </Card>

        <Card
          state="dashboard-tabs-solo-switch-on"
          label="tabs, solo, switch on"
          reach={TABS_REACH}
          note="The switch wears the primary tint and reads pressed. Each workspace keeps only its panes that need you, a group with none is dropped, and every heading still counts its whole workspace. The mark stays on Dashboard."
        >
          <PhoneFrameCard height={640}>
            <DashboardTabsPhone initialOn />
          </PhoneFrameCard>
        </Card>

      </Group>

      <Group title="Navigation strips">
        <Card
          state="nav-strips-three-rows"
          label="three strips, spaces, tabs, panes"
          reach="open a space. The three navigation rows stack under the header, one level apart, and every one of them overflows on a phone. Scroll each row sideways: the name stays put, because it sits above the scroller rather than inside it."
          note="Real <SpaceStrip>, <TabStrip> and <PaneStrip> with the fixture herd, in a 390px frame — the width the row was measured at. The chips are live: tapping one moves the selection. Every pill is drawn 34px tall and answers a 46px touch: the extra 12px is a transparent hit area inside the row's own padding, so the tap floor costs no height. Try tapping just above or just below a pill."
          span={2}
        >
          <PhoneFrameCard height={240}>
            <StripsHarness />
          </PhoneFrameCard>
        </Card>

        <Card
          state="nav-strip-drill-in"
          label="space strip, the drill-in (leads with Back)"
          reach="tap into a single space. The row leads with an explicit way back instead of the “All” chip."
          note="Same height as the card above, deliberately: the label is drawn in both states, so navigating in and out does not jump the page."
          span={2}
        >
          <PhoneFrameCard height={140}>
            <StripsHarness backOnly />
          </PhoneFrameCard>
        </Card>

        <Card
          state="tab-strip-many-tabs"
          label="tab strip, sixteen tabs, active tab off-screen"
          reach="open a space with a lot of tabs open, on a workspace whose active tab is well past the first screenful."
          note="A real <TabStrip> with sixteen tabs; the active one (14th) starts outside the 390px frame. It scrolls into view on mount, at the NEAREST edge, no animation on arrival. Tap another far tab and watch it follow, smoothly this time."
          span={2}
        >
          <PhoneFrameCard height={90}>
            <ManyTabsHarness />
          </PhoneFrameCard>
        </Card>
      </Group>

      <Group title="Update notices">
        <Card
          state="update-stale-bundle"
          label="update, the stale-bundle row, held"
          reach="a fresh build is confirmed on the server but the app cannot auto-update right now: unsent work, an open sheet, an upload — or it already auto-updated once for this build. With no hold at all the app reloads ITSELF and this row never appears, which is the normal path."
          note="Driven through the actual controller: a reload hold is taken and a newer build id is observed twice, which is the hysteresis the real poll performs. `lib/self-update.ts` is a PAGE-WIDE singleton, exactly like lib/status.ts and lib/connection-health.ts, and every banner on this page reads it — so driving it here puts every OTHER banner card into this same state. Hence the toggle, and hence it is off by default."
          span={2}
        >
          <StaleBuildHarness />
        </Card>

        <Card
          state="update-footer-chip"
          label="update, the footer chip, all three states"
          reach="the dashboard footer. The precedence function decides whether it shows at all."
          note="Precedence: a stale running PROCESS outranks an available release, which outranks a major that needs explicit consent (ADR 0020). Three snapshots, three routers — the three cannot be true at once on one bridge."
        >
          <Stage>
            <ListGroup>
              <RootRouter data={{ ...homeSolo, update: updateRestart }}>
                <div className="p-3">
                  <UpdateBanner />
                </div>
              </RootRouter>
              <RootRouter data={{ ...homeSolo, update: updateRelease }}>
                <div className="p-3">
                  <UpdateBanner />
                </div>
              </RootRouter>
              <RootRouter data={{ ...homeSolo, update: updateMajor }}>
                <div className="p-3">
                  <UpdateBanner />
                </div>
              </RootRouter>
            </ListGroup>
          </Stage>
        </Card>
      </Group>

      <Group title="Footer">
        <Card
          state="footer-build-stamp"
          label="footer, build stamp"
          reach="scroll to the bottom of the dashboard."
          note="BuildStamp asks /api/config once for the bridge's own build, so the second line fills in only against a live bridge."
        >
          <Stage>
            <RootRouter data={homeSolo}>
              <div className="pb-3">
                <BuildStamp className="px-3 pt-3" />
              </div>
            </RootRouter>
          </Stage>
        </Card>

        <Card
          state="session-switcher"
          label="session switcher"
          reach="run more than one named Herdr session. The chip names the current one; the sheet lists the rest with their per-session counts, and an unreachable session is greyed out."
        >
          <Stage>
            <RootRouter data={homeSolo}>
              <div className="flex items-center gap-2 p-3">
                <SessionSwitcher sessions={homeSolo.sessions} scope={{}} viewAll={false} />
              </div>
            </RootRouter>
          </Stage>
        </Card>
      </Group>
    </Section>
  );
}

type WriteGate = "device" | "pairing";
const GATE_OPTIONS = [
  { value: "device", label: "Device" },
  { value: "pairing", label: "Pairing" },
] as const satisfies readonly { value: WriteGate; label: string }[];

/**
 * The two write gates are independent on the bridge and compose by AND, and the pairing latch is
 * checked FIRST — so only one of the two strips can ever be on screen. The control picks which fact
 * is true rather than pretending both can be.
 */
function WriteGateCard() {
  const [gate, setGate] = useState<WriteGate>("device");

  useEffect(() => {
    if (gate === "pairing") markNotPaired();
    else clearNotPaired();
    return () => clearNotPaired();
  }, [gate]);

  return (
    <Card
      state="read-only-write-gate"
      label={gate === "pairing" ? "read-only, not paired" : "read-only, device not allowlisted"}
      reach={
        gate === "pairing"
          ? "open Collie on a phone that holds no bearer token, or whose token was revoked. The remedy is on the phone: pair it."
          : "put a fronting proxy in front that names this device, and leave the name off the bridge's allowlist. Nothing on the phone can fix it."
      }
      note="The pairing latch is set through lib/pairing's own markNotPaired/clearNotPaired, and it OUTRANKS the device gate — the two can never both show, so pick one."
    >
      <div className="mb-2">
        <Segmented name="write gate" value={gate} options={GATE_OPTIONS} onChange={setGate} />
      </div>
      {/* 390px and the routes' own `mx-4 mt-3`: this box WRAPS in five of six locales, so its
          height is a function of the width it is read at, and a card-wide stage measures a box
          nobody has. The gutter rides the component the way home.tsx and space.tsx pass it. */}
      <div className="mx-auto w-[390px] max-w-full">
        <Stage>
          {/* A router, because the pairing strip is a `<Link>` to Settings' Paired-devices card and
              it reads the active scope off the query. Nothing here navigates — the card only has to
              provide the context the real app always has. */}
          <MemoryRouter>
            <ReadOnlyBanner device={deviceRefused} />
          </MemoryRouter>
          <div className="h-3" />
        </Stage>
      </div>
    </Card>
  );
}

/**
 * The three navigation strips, stacked as the space route stacks them (space › tab › pane) and
 * wired to real state so the selection actually moves. `backOnly` shows the drill-in branch, where
 * SpaceStrip leads with Back instead of the "All" chip.
 *
 * They need no provider: every capability they gate on reads as present when no bridge has said
 * otherwise (lib/mux-capability.ts), which is the same answer the real app gets on a fresh load.
 */
function StripsHarness({ backOnly = false }: { backOnly?: boolean }) {
  const [space, setSpace] = useState<string | null>("w1");
  const [tab, setTab] = useState<string | null>("w1:t1");
  const panes = allPanes.filter((p) => p.tabId === "w1:t1");
  const [pane, setPane] = useState(panes[0]?.paneId ?? "");
  return (
    <div className="flex flex-col">
      <SpaceStrip
        workspaces={spaces}
        agents={allPanes}
        selected={space}
        onSelect={setSpace}
        onNewSpace={() => {}}
        onBack={backOnly ? () => {} : undefined}
      />
      {!backOnly && (
        <>
          <TabStrip
            workspaceId={space ?? "w1"}
            tabs={tabs}
            agents={allPanes}
            selected={tab}
            onSelect={setTab}
            onNewTab={() => {}}
          />
          <PaneStrip panes={panes} currentPaneId={pane} onSelect={setPane} />
        </>
      )}
    </div>
  );
}

/**
 * A single, real `<TabStrip>` over the sixteen-tab fixture, starting selected on the 14th tab — the
 * one deep enough into the row to start off-screen at 390px. Proves `useRevealActive` end to end:
 * mount should land with the active tab visible, and tapping another tab should carry it there too.
 */
function ManyTabsHarness() {
  const [tab, setTab] = useState<string | null>(manyTabsActiveTabId);
  return (
    <TabStrip
      workspaceId={manyTabsWorkspaceId}
      tabs={manyTabs}
      agents={[]}
      selected={tab}
      onSelect={setTab}
      onNewTab={() => {}}
      allowAll={false}
    />
  );
}

/**
 * Drive the self-updater to its "confirmed stale but held" state the way the real poll does: take a
 * reload hold (what an open composer draft or an in-flight upload does), then observe a server build
 * id that is not ours twice — the hysteresis needs two consecutive sightings before it acts.
 * `__setReloadImpl` is the module's own test seam, and it is what stops the page reloading itself.
 *
 * Behind a toggle, and off by default, for the reason the card's own note gives: that controller is
 * one page-wide store and every banner on this page reads it.
 */
function StaleBuildHarness() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (!stale) return;
    __resetSelfUpdate();
    __setReloadImpl(() => {});
    holdReload("collie-playground");
    observeServerBuild("collie-playground-newer-build");
    observeServerBuild("collie-playground-newer-build");
    return () => {
      releaseReload("collie-playground");
      __resetReloadGuard();
      __resetServerBuild();
      __resetSelfUpdate();
    };
  }, [stale]);
  return (
    <>
      <PlaygroundToggle
        name="stale bundle"
        on={stale}
        onToggle={() => setStale((v) => !v)}
        onLabel="stale bundle: ON — tap to clear (every other band card reads it while on)"
        offLabel="stale bundle: off — tap to confirm one (it takes over every other band card)"
      />
      <Stage>
        <RootRouter data={homeSolo}>
          <UpdateRibbon />
        </RootRouter>
      </Stage>
    </>
  );
}

/** The strip a card grows when the state it shows lives in a page-wide store and must be opt-in.
 *  Same shape as the two buttons inside `StackHarness` (sections/pane.tsx), promoted the moment a
 *  third appeared. */
function PlaygroundToggle({
  name,
  on,
  onToggle,
  onLabel,
  offLabel,
}: {
  /**
   * The button's accessible name, stable across both halves of the toggle. The visible text is a
   * whole instruction and it changes with the state, so it is no handle for a browser case; the
   * pressed state travels on `aria-pressed` instead.
   */
  name: string;
  on: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={on}
      onClick={onToggle}
      className="mb-2 w-full rounded-md border border-border bg-muted px-3 py-1 text-left text-[11px] font-medium text-muted-foreground"
    >
      {on ? onLabel : offLabel}
    </button>
  );
}
