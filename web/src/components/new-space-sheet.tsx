import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listWorktrees } from "@/lib/api";
import type { Scope } from "@/lib/scope";
import type { Launcher, WorktreeView } from "@/lib/types";
import { Collapse } from "@/components/ui/collapse";
import { OneOf } from "@/components/ui/one-of";
import { SHELL_CHOICE, defaultLauncher, rememberLauncher } from "@/lib/branch-off";
import { branchOffName, mintRequestId } from "@/lib/worktree-name";
import { BottomSheet } from "@/components/ui/sheet";
import { FolderSections } from "@/components/new-space-folders";
import { useFolders } from "@/lib/folders";
import { useHoldReload } from "@/lib/reload-guard";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

/** A repo the sheet can branch a worktree from — one entry per repo, however many spaces show it. */
export interface WorktreeRepo {
  /** The space the worktree call is addressed to (every route is scoped to a space). */
  workspaceId: string;
  repoRoot: string;
  /** What to call it in the picker: the space's own label, which the operator already recognises. */
  label: string;
}

/** Stable empty default: a fresh `[]` per render would break referential equality downstream. */
const NO_REPOS: readonly WorktreeRepo[] = [];

/**
 * "New agent on a branch" (ADR 0089): the sheet opened from a pane's ⋯ menu rather than from the
 * dashboard's "+". It opens straight on the worktree side, with the pane's repo chosen and a fresh
 * branch name typed, and adds the one question the dashboard's sheet does not ask: which agent to
 * start in the new shell.
 */
export interface BranchOffSetup {
  /** The pane's space, which is the repo the sheet opens on. Must be one of `repos`. */
  workspaceId: string;
  /** This scope's launcher rows. The picker offers them, plus a plain shell. */
  launchers: readonly Launcher[];
  /**
   * Run the create. Resolves true once the phone has moved to the new space, which closes the sheet.
   * `launcher` is a row's `command`, absent for a shell; `requestId` is one per sheet opening and is
   * reused by a retry, so a second tap after a lost reply replays rather than creating again.
   */
  onCreate: (workspaceId: string, branch: string, extras: { requestId: string; launcher?: string }) => Promise<boolean>;
}
interface NewSpaceSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * Create the space. The second argument is the scope the create is ADDRESSED to — the host
   * picker's answer, which overrides the ambient one for this create and for the navigation that
   * follows it. Omitted (solo, and every caller that never renders the picker) means "the ambient
   * scope", exactly as before.
   */
  onCreate: (opts: { label?: string; cwd?: string }, at?: Scope) => void;
  /**
   * The repos a worktree could be branched from. EMPTY means the worktree tab is not offered at
   * all — either the multiplexer cannot do it, or nothing open sits in a repo. Hiding it beats
   * showing a tab whose only content would be "no repos".
   */
  repos?: readonly WorktreeRepo[];
  /** Branch a worktree from `workspaceId`. Absent alongside an empty `repos`. */
  onCreateWorktree?: (workspaceId: string, branch: string) => void;
  /** Show a worktree that exists on disk but is not open as a space. */
  onOpenWorktree?: (workspaceId: string, path: string) => void;
  /** Session scope for the listing read. */
  scope?: Scope;
  /** Open as "New agent on a branch" (ADR 0089). Absent is the dashboard's sheet, exactly as before. */
  branchOff?: BranchOffSetup;
}

// Create a new space (workspace). Both fields are optional and dictation-friendly: leave the
// directory blank to open the shell in your home dir (it's a shell — cd from there), or set a path
// for a specific project. The new space opens a fresh shell you launch your own agent in.
export function NewSpaceSheet({
  open,
  onClose,
  onCreate,
  repos = NO_REPOS,
  onCreateWorktree,
  onOpenWorktree,
  scope,
  branchOff,
}: NewSpaceSheetProps) {
  useLocale();
  const [label, setLabel] = useState("");
  const [cwd, setCwd] = useState("");
  // Which kind of space this will be. Two tabs rather than two entry points: from the spaces list
  // there is no "current space" to carry a repo, so the worktree side has to ask which repo anyway
  // — and once it asks, the choice belongs beside the plain one, not behind a second button.
  const [mode, setMode] = useState<"space" | "worktree">("space");
  const [branch, setBranch] = useState("");
  const [repo, setRepo] = useState("");
  const worktreesOffered = repos.length > 0 && (onCreateWorktree !== undefined || branchOff !== undefined);
  // The branch-off half (ADR 0089). `launcherChoice` is a row's command or SHELL_CHOICE; a choice
  // whose row is not (or no longer) in this scope's list reads as the shell, so the picker never
  // shows a value it has no option for.
  const [launcherChoice, setLauncherChoice] = useState(SHELL_CHOICE);
  const launcherRows = branchOff?.launchers ?? [];
  const pickedLauncher = launcherRows.some((r) => r.command === launcherChoice) ? launcherChoice : SHELL_CHOICE;
  // Whether the operator moved the picker in this opening: until they do, a row list that arrives
  // after the sheet opened may still supply the remembered default.
  const launcherTouched = useRef(false);
  // ONE create per opening. The state paints the busy button; the ref is the guard, because it is
  // already set inside the handler a second tap lands in, before React has re-rendered.
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  // One request id per opening, kept across a failed or lost create so a retry replays it.
  const requestId = useRef("");
  // This machine's own folder list (#289): read when the sheet opens, never polled. A bridge on an
  // older version has none, and the sheet then renders as it always did. The fork is single-machine
  // (one multiplexer per install, ADR 0036), so the list rides the ambient scope and there is no
  // host picker to move it.
  const { folders, star } = useFolders(scope, open);
  // What the list holds NOW, for a tap that lands on a row the Collapse is still fading out: a
  // stale folder must never reach the field.
  const shownFolders = useRef(folders);
  shownFolders.current = folders;
  const isShown = (folder: string): boolean =>
    shownFolders.current.recent.includes(folder) || shownFolders.current.favourites.includes(folder);
  const createButton = useRef<HTMLButtonElement>(null);
  /**
   * Worktrees of the chosen repo that NOTHING is showing.
   *
   * The ones that are open are already spaces in the list behind this sheet — offering them again
   * here would be the same thing under two names. These are the only worktrees the phone has no
   * other route to, which is exactly why they are here and not in a panel of their own.
   */
  const [unopened, setUnopened] = useState<WorktreeView[]>([]);

  // Don't let a self-update reload yank this tab/space form out from under a half-typed
  // directory/label — hold while it's open; the self-updater shows the banner and updates on close.
  useHoldReload("new-space", open);

  useEffect(() => {
    if (open) {
      setLabel("");
      setCwd("");
      setBranch("");
      setMode("space");
      // Default to the first repo, which is the most recently used one: the list arrives in the
      // spaces list's own order, so the top entry is the repo you were last in.
      setRepo(repos[0]?.workspaceId ?? "");
      setCreating(false);
      creatingRef.current = false;
      if (branchOff !== undefined) {
        setMode("worktree");
        setRepo(branchOff.workspaceId);
        setBranch(branchOffName());
        setLauncherChoice(defaultLauncher(branchOff.launchers));
        launcherTouched.current = false;
        requestId.current = mintRequestId();
      }
    }
    // `repos` is derived per render; keying the reset on `open` alone is deliberate — a poll that
    // reorders the repos must not wipe a half-typed branch name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The rows are read when the pane view mounts, so they may land after the sheet opened. Until the
  // operator has touched the picker, the remembered default is re-read against them.
  const launcherCount = branchOff?.launchers.length ?? 0;
  useEffect(() => {
    if (!open || branchOff === undefined || launcherTouched.current) return;
    setLauncherChoice(defaultLauncher(branchOff.launchers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, launcherCount]);

  // Only a sheet that can OPEN one lists them. A boolean, not the callback: a caller's inline arrow is
  // a new function every render, and the read must not re-run on each one.
  const listsUnopened = onOpenWorktree !== undefined;
  useEffect(() => {
    if (!open || mode !== "worktree" || repo === "" || !listsUnopened) {
      setUnopened([]);
      return;
    }
    let live = true;
    void (async () => {
      const res = await listWorktrees(repo, scope);
      // A read the operator asked for by opening this tab — not a poll, so it runs once per repo
      // choice and never on the list behind it.
      if (live) setUnopened(res.ok ? res.worktrees.filter((w) => w.linked && w.openWorkspaceId === null) : []);
    })();
    return () => {
      live = false;
    };
  }, [open, mode, repo, scope, listsUnopened]);

  function create() {
    onCreate({ label: label.trim() || undefined, cwd: cwd.trim() || undefined }, undefined);
    onClose();
  }

  /** A folder row's tap: fill the field and move to Create. Never a create by itself. */
  function fillFolder(folder: string) {
    if (!isShown(folder)) return;
    setCwd(folder);
    createButton.current?.focus();
  }

  function toggleStar(folder: string, starred: boolean) {
    if (!isShown(folder)) return;
    void star(folder, starred);
  }

  function createWorktree() {
    const name = branch.trim();
    if (name === "" || repo === "") return;
    if (branchOff !== undefined) {
      void createBranchOff(branchOff, name);
      return;
    }
    if (onCreateWorktree === undefined) return;
    onCreateWorktree(repo, name);
    onClose();
  }

  /**
   * The branch-off create. The sheet STAYS OPEN while it runs, with the button busy, because a
   * create can take a minute and a sheet that closed at once would leave the operator looking at the
   * pane they came from with no sign that anything is happening. It closes once the phone has moved.
   */
  async function createBranchOff(setup: BranchOffSetup, name: string) {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    rememberLauncher(pickedLauncher);
    try {
      const moved = await setup.onCreate(repo, name, {
        requestId: requestId.current,
        launcher: pickedLauncher === SHELL_CHOICE ? undefined : pickedLauncher,
      });
      if (moved) onClose();
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={branchOff !== undefined ? t("paneActions.branchOff.label") : t("space.new.title")}
    >
      <div className="flex flex-col gap-3">
        {/* Only where there is a choice to make: one tab is not a tab strip, it is noise. A branch-off
            has no choice to make, it is a worktree by definition. */}
        {worktreesOffered && branchOff === undefined && (
          <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
            {(["space", "worktree"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={mode === option}
                onClick={() => setMode(option)}
                className={cn(
                  // min-h, never h: the floor stands above whatever the label needs, so a longer
                  // translation grows the strip rather than being clipped (DESIGN.md §6).
                  "flex-1 min-h-11 rounded-md px-3 text-sm font-medium transition-colors",
                  mode === option
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "space" ? t("space.new.tab.plain") : t("space.new.tab.worktree")}
              </button>
            ))}
          </div>
        )}

        {mode === "worktree" && worktreesOffered ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("space.new.repo.label")}</span>
              <select
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {repos.map((candidate) => (
                  <option key={candidate.workspaceId} value={candidate.workspaceId}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("worktree.branchLabel")}</span>
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder={t("worktree.branchPlaceholder")}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-11 rounded-lg border border-border bg-background px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </label>
            {branchOff !== undefined && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{t("branchOff.agentLabel")}</span>
                <select
                  value={pickedLauncher}
                  onChange={(e) => {
                    launcherTouched.current = true;
                    setLauncherChoice(e.target.value);
                  }}
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value={SHELL_CHOICE}>{t("branchOff.shell")}</option>
                  {launcherRows.map((row) => (
                    <option key={row.command} value={row.command}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button
              onClick={createWorktree}
              disabled={branch.trim() === "" || creating}
              aria-busy={creating || undefined}
              className="mt-1 h-11"
            >
              {/* The word changes while a create runs, so both words share one reserved box
                  (DESIGN.md §2): the button keeps its width whichever is showing. */}
              <OneOf
                active={creating ? "creating" : "create"}
                className="justify-items-center"
                options={[
                  { key: "create", node: t("worktree.create") },
                  { key: "creating", node: t("worktree.creating") },
                ]}
              />
            </Button>
            {/* This list arrives from a read that runs when the repo is chosen, so it appears in
                flow under the button — the one thing DESIGN.md §1 says may only ever happen
                through Collapse. The condition stays in the children, per its contract. */}
            <Collapse open={unopened.length > 0 && onOpenWorktree !== undefined}>
              {unopened.length > 0 && onOpenWorktree !== undefined ? (
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("worktree.orOpenExisting")}
                  </span>
                  {unopened.map((worktree) => (
                    <button
                      key={worktree.path}
                      type="button"
                      onClick={() => {
                        onOpenWorktree(repo, worktree.path);
                        onClose();
                      }}
                      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {worktree.branch ?? t("worktree.detached")}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t("worktree.open")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </Collapse>
          </>
        ) : (
        <>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{t("space.new.dir.label")}</span>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder={t("space.new.dir.placeholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 rounded-lg border border-border bg-background px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </label>
        <FolderSections folders={folders} onUse={fillFolder} onStar={toggleStar} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{t("space.new.label.label")}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("space.new.label.placeholder")}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </label>
        <Button ref={createButton} onClick={create} className="mt-1 h-11">
          {t("space.new.create")}
        </Button>
        </>
        )}
      </div>
    </BottomSheet>
  );
}
