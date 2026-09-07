import { useCallback, useRef, useState } from "react";
import { useNavigate, useRevalidator, useRouteLoaderData } from "react-router";

import * as api from "@/lib/api";
import { setStatus } from "@/lib/status";
import { panePath } from "@/lib/nav";
import { ROOT_ROUTE_ID, type HomeData } from "@/lib/loaders";
import { isReadOnly, type AgentView, type CreateResponse } from "@/lib/types";

// Shared "create a tab/space, then jump into its fresh shell" flow, used by the home space view and
// the detail Herdr palette. The new pane won't be in the snapshot until the next poll, so we pass
// it through navigation state (`freshPane`) — the detail route falls back to it so the composer is
// live immediately (no "agent gone" flash) while a revalidate catches the snapshot up.
export function useSpaceActions() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  // revalidator changes identity each revalidation cycle; keep the callbacks stable via a ref so
  // they don't break a memoized child when passed as props.
  const revalidatorRef = useRef(revalidator);
  revalidatorRef.current = revalidator;

  // Creating a tab/space is a sensitive (structural) action — a read-only device can't, and the
  // bridge rejects it anyway. Short-circuit centrally so every create entry point (tab strip,
  // space list, command palette) is covered with one friendly notice. Read via a ref so the
  // returned callbacks stay stable across revalidations.
  const root = useRouteLoaderData(ROOT_ROUTE_ID) as HomeData | undefined;
  const readOnlyRef = useRef(false);
  readOnlyRef.current = isReadOnly(root?.device);
  // The session the new tab/space must be created in (and navigated into). Read via a ref so the
  // returned callbacks stay stable across revalidations, like readOnly above.
  const sessionRef = useRef<string | undefined>(undefined);
  sessionRef.current = root?.session;

  const open = useCallback(
    (res: CreateResponse, what: "tab" | "space") => {
      if (!res.ok) {
        setStatus(res.error, "error");
        return;
      }
      const p = res.pane;
      const fresh: AgentView = {
        paneId: p.paneId,
        workspaceId: p.workspaceId,
        workspaceLabel: p.workspaceLabel,
        workspaceNumber: 0,
        tabId: p.tabId,
        agent: "shell",
        status: "unknown",
        cwd: p.cwd,
        focused: false,
        kind: "shell",
      };
      setStatus(`New ${what} ready — launch your agent`, "success");
      revalidatorRef.current.revalidate();
      navigate(panePath(p.paneId, sessionRef.current), { state: { freshPane: fresh } });
    },
    [navigate],
  );

  // ONE create per Space's "+" at a time: a create is a round trip, an impatient second tap on a
  // phone is normal, and every tap that gets through makes another throwaway tab the operator then
  // has to close. Keyed by workspaceId, not global, so a different Space's "+" stays live while
  // this one is in flight. A ref for the guard itself (it must hold between render and tap) plus
  // state for the spinner, the same shape the launch guard uses upstream.
  const [creatingTab, setCreatingTab] = useState<ReadonlySet<string>>(() => new Set());
  const creatingTabRef = useRef<Set<string>>(new Set());
  const newTab = useCallback(
    async (workspaceId: string) => {
      if (readOnlyRef.current) return setStatus("Read-only — device not authorised", "error");
      if (creatingTabRef.current.has(workspaceId)) return;
      creatingTabRef.current.add(workspaceId);
      setCreatingTab(new Set(creatingTabRef.current));
      try {
        open(await api.createTab(workspaceId, {}, sessionRef.current), "tab");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e), "error");
      } finally {
        creatingTabRef.current.delete(workspaceId);
        setCreatingTab(new Set(creatingTabRef.current));
      }
    },
    [open],
  );

  // ONE Space create in flight at a time, globally — there is only ever one "+" for a new Space
  // on screen (the dashboard's, or the drill-in's), unlike tabs where each Space has its own.
  const [creatingSpace, setCreatingSpace] = useState(false);
  const creatingSpaceRef = useRef(false);
  const newSpace = useCallback(
    async (opts: { label?: string; cwd?: string } = {}) => {
      if (readOnlyRef.current) return setStatus("Read-only — device not authorised", "error");
      if (creatingSpaceRef.current) return;
      creatingSpaceRef.current = true;
      setCreatingSpace(true);
      try {
        open(await api.createWorkspace(opts, sessionRef.current), "space");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e), "error");
      } finally {
        creatingSpaceRef.current = false;
        setCreatingSpace(false);
      }
    },
    [open],
  );

  // ONE launch per row at a time, and per-row: a launch takes a moment (the bridge waits for the
  // new shell to draw before typing), so the row shows a spinner and refuses a second tap while
  // its neighbours stay live — another launcher is another intention.
  const [launching, setLaunching] = useState<ReadonlySet<string>>(() => new Set());
  const launchingRef = useRef<Set<string>>(new Set());
  const launch = useCallback(
    async (command: string) => {
      if (readOnlyRef.current) return setStatus("Read-only — device not authorised", "error");
      if (launchingRef.current.has(command)) return;
      launchingRef.current.add(command);
      setLaunching(new Set(launchingRef.current));
      try {
        open(await api.launch(command, sessionRef.current), "space");
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e), "error");
      } finally {
        launchingRef.current.delete(command);
        setLaunching(new Set(launchingRef.current));
      }
    },
    [open],
  );

  return { newTab, newSpace, creatingTab, creatingSpace, launch, launching };
}
