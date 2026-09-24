// The English dictionary — the source of truth for every string and every key.
//
// Shape rules, because the whole layer's type safety rests on them:
//   * FLAT object, dot-namespaced keys (`area.thing.part`). No nesting: a flat map is what makes
//     `keyof typeof en` a finite union of literals, which is what makes a missing translation a
//     compile error rather than a blank label at runtime.
//   * `as const` so the keys stay literal. Only English is `as const` — the other locales carry
//     different VALUES for the same keys, so they are typed `Record<MessageKey, string>`.
//   * `{name}` marks an interpolation slot; `t()` fills it. Slots are named, never positional,
//     because a translator re-orders a sentence and positions do not survive that.
//   * A plural comes as a `.one` / `.other` PAIR and is read through `tn()`, never `t()`.
//
// Seeded with the language-selector copy only — the full string sweep lands separately.

export const en = {
  "settings.updateBanner.restart": "Bridge restart needed",
  "settings.updateBanner.releaseAvailable": "Collie {version} available",
  "settings.updateBanner.majorAvailable": "Collie {version} — a new major",
  "settings.updateBanner.copyAria": "Copy command: {command}",
  "settings.language.title": "Language",
  "settings.language.description": "The terminal mirror is never translated.",

  // --- settings (page chrome) ---
  "settings.title": "Settings",
  "settings.nav.back": "Back",

  // --- settings.theme ---
  "settings.theme.title": "Appearance",
  "settings.theme.description": "Follow your phone, or pin one.",
  "settings.theme.option.system": "System",
  "settings.theme.option.light": "Light",
  "settings.theme.option.dark": "Dark",

  // --- settings.haptics ---
  "settings.haptics.title": "Haptics",
  "settings.haptics.description": "A short buzz when you press a key or a quick reply.",


  // --- settings.zen ---
  // Availability only: the toggle decides whether the pane menu offers zen at all.
  "settings.install.title": "Install the app",
  "settings.install.description": "Add Collie to your home screen — full screen, its own icon.",
  "settings.install.button": "Install",
  "settings.install.iosHint": "On an iPhone or iPad, install from the browser's share sheet: tap Share, then \"Add to Home Screen\".",
  "settings.harnessBar.title": "Harness shortcuts",
  "settings.harnessBar.description": "A row of the running agent's own commands above the keys.",
  "settings.beltSize.title": "Action belt size",
  "settings.beltSize.description": "How tall the row of actions above the input is, and how large its icons and words are.",
  "settings.beltSize.option.default": "Default",
  "settings.beltSize.option.large": "Large",
  "settings.beltSize.option.larger": "Larger",
  "settings.zen.title": "Zen mode",
  "settings.zen.description": "Adds a row to the pane menu that hides everything but the terminal.",
  "settings.zen.auto.label": "Enter on landscape",
  "settings.zen.auto.hint": "Rotate the phone sideways to open zen automatically; rotate back to close it.",

  // --- settings.handsFree ---
  "settings.handsFree.title": "Hands-free voice",
  "settings.handsFree.description":
    "Send the transcript immediately instead of putting it in the message box. Off by default — you normally read what was heard before it reaches the terminal.",
  "settings.handsFree.ariaLabel": "Hands-free voice: send transcript immediately",

  // --- settings.push ---
  "settings.push.title": "Push notifications",
  "settings.push.description": "Get a notification when an agent needs you.",
  "settings.push.reason.insecure": "Push needs an HTTPS connection.",
  "settings.push.reason.serverOff": "Push isn't configured on the bridge (no VAPID keys).",
  "settings.push.reason.denied":
    "Notifications are blocked — enable them in your browser settings.",
  "settings.push.reason.unsupported": "This browser doesn't support push notifications.",
  "settings.push.reason.default": "Couldn't enable push notifications.",
  "settings.push.reason.timeout": "Notification setup timed out. Check that this device can reach its push service, then try again.",
  "settings.push.availability.unavailable": "Could not check notification setup. Check your connection or sign in again, then retry.",
  "settings.push.availability.insecure":
    "Unavailable over plain HTTP — serve Collie over HTTPS to enable push.",
  "settings.push.availability.serverOff":
    "The bridge has no VAPID keys configured, so push is disabled server-side.",
  "settings.push.availability.denied":
    "Notifications are blocked for this site. Re-enable them in your browser settings.",
  "settings.push.availability.unsupported": "This browser doesn't support push notifications.",

  // --- settings.notify ---
  "settings.notify.title": "Notify when",
  "settings.notify.description": "Applies to all devices.",
  "settings.notify.blocked.label": "Needs input",
  "settings.notify.blocked.hint": "an agent is waiting on you",
  "settings.notify.done.label": "Finished",
  "settings.notify.done.hint": "an agent completes its task",
  "settings.notify.updates.label": "App updates",
  "settings.notify.updates.hint": "a new Collie version is available",
  "settings.notify.cache.label": "Cache about to go cold",
  // The second clause is the whole point of this hint: the rule is global OR per-pane, with no per-pane
  // off, so a watched list keeps working under this switch and the operator is told once, here.
  "settings.notify.cache.hint":
    "a pane's prompt cache expires in a few minutes; also covers panes you watched one by one",
  "settings.notify.watched.title": "Watched panes",
  "settings.notify.watched.empty": "None yet — open a pane's settings to watch it.",
  "settings.notify.watched.remove": "Remove",
  "settings.notify.watched.removeAria": "Stop watching {label}",

  // --- settings.snooze ---
  "settings.snooze.title": "Do not disturb",
  "settings.snooze.description.idle": "Pause all push notifications for a while.",
  "settings.snooze.description.active": "Snoozed until {time} — no pushes until then.",
  "settings.snooze.resume": "Resume now",
  "settings.snooze.preset.min30": "30m",
  "settings.snooze.preset.hour1": "1h",
  "settings.snooze.preset.hour4": "4h",

  // --- settings.devices ---
  "settings.devices.title": "Paired devices",
  "settings.devices.description.enforced": "Every write needs a paired device. Reading stays open.",
  "settings.devices.description.open":
    "Nothing is paired, so writes are ungated. Pair a device to require a credential.",
  "settings.devices.pairedAs": "This device is paired as {device}.",
  "settings.devices.loadError": "Couldn’t load the paired devices from the bridge.",
  "settings.devices.thisDevice": "This device",
  "settings.devices.row.meta": "Paired {paired} · last seen {lastSeen}",
  "settings.devices.revokeError": "Couldn’t revoke that device.",
  "settings.devices.cancel": "Cancel",
  "settings.devices.unpairSelf": "Unpair this phone",
  "settings.devices.revoke": "Revoke",
  "settings.devices.revokeAria": "Revoke {label}",
  "settings.devices.pair.title": "Pair this device",
  "settings.devices.pair.hint":
    "Run {command} on the host, then scan the code it prints or type it here.",
  "settings.devices.pair.codeLabel": "Pairing code",
  "settings.devices.pair.codePlaceholder": "8 characters",
  "settings.devices.pair.nameLabel": "Name for this device",
  "settings.devices.pair.namePlaceholder": "e.g. my phone",
  "settings.devices.pair.networkError":
    "Couldn’t reach the bridge to pair. Check the connection and try again.",
  "settings.devices.pair.failure.noPending":
    "No pairing code is waiting. Run `bin/collie pair` on the host to mint one.",
  "settings.devices.pair.failure.expired":
    "That code has expired. Run `bin/collie pair` on the host for a fresh one.",
  "settings.devices.pair.failure.exhausted":
    "Too many wrong codes, so that pairing was destroyed. Run `bin/collie pair` on the host to mint a new one.",
  "settings.devices.pair.failure.badCode":
    "That code doesn’t match. Check it and try again — a few more wrong tries and it’s destroyed.",
  "settings.devices.pair.failure.duplicateLabel":
    "A device is already using that name. Pick a different one — the code is still good.",
  "settings.devices.pair.failure.badRequest":
    "The code or the name wasn’t usable. A name is 1–48 characters.",

  // --- settings.connection ---
  "settings.connection.title": "Connection",
  "settings.connection.description": "Diagnostics for this device.",
  "settings.connection.row.endpoint": "Endpoint",
  "settings.connection.row.secure": "Secure context",
  "settings.connection.row.bridge": "Bridge",
  "settings.connection.row.deviceAccess": "Device access",
  "settings.connection.row.serverBuild": "Server build",
  "settings.connection.secure.yes": "Yes",
  "settings.connection.secure.no": "No (plain HTTP)",
  "settings.connection.bridge.connected": "Connected",
  "settings.connection.bridge.offline": "Herdr offline",
  "settings.connection.bridge.connecting": "Connecting…",
  "settings.connection.device.notEnforced": "Not enforced",
  "settings.connection.device.fullAccessNamed": "Full access · {device}",
  "settings.connection.device.fullAccessLocal": "Full access (local)",
  "settings.connection.device.readOnlyNamed": "Read-only · {device}",
  "settings.connection.device.readOnly": "Read-only",

  // --- settings.update (update-check-control + footer update banner) ---
  "settings.update.title": "Updates",
  "settings.update.check.prompt": "Check whether a new Collie version is available.",
  "settings.update.check.running": "Running v{current}",
  "settings.update.check.runningChecked": "Running v{current} · checked {checked}",
  "settings.update.action": "Check for updates",
  "settings.update.checking": "Checking…",
  "settings.update.error": "Couldn't check.",
  "settings.update.upToDate": "Up to date",

  // --- settings.typeface (the APP's own face — a per-device preference since ADR 0033) ---
  // FAMILY NAMES ARE NOT HERE, and must not be added: "Space Grotesk" and "Aldrich" are proper
  // nouns and are named the same in every locale, exactly like the terminal families below. The
  // NOTES are phrases about a face rather than the name of one, so they are translated.
  "settings.typeface.title": "Typeface",
  "settings.typeface.description": "The app's own face, on this device.",
  "settings.typeface.family": "Family",
  "settings.typeface.system": "System default",
  "settings.typeface.note.system": "Your phone's own face. Downloads nothing.",
  "settings.typeface.note.grotesk": "Collie's own voice, drawn to match the mark.",
  // Says the cost out loud rather than letting it be discovered: Aldrich ships one weight, and the
  // app suppresses synthesized bold, so bold text under it is not heavier than the rest.
  "settings.typeface.note.aldrich": "One weight, so bold text looks the same as regular.",
  "settings.typeface.note.operator": "Added by this collie's operator.",

  // --- settings.fonts (the terminal face: the mirror's size and the draft field's; NOT the app's own typeface) ---
  "settings.fonts.title": "Terminal font",
  "settings.fonts.description": "The terminal mirror and the draft field, on this device.",
  "settings.fonts.family": "Family",
  "settings.fonts.size": "Mirror text",
  "settings.fonts.draftSize": "Draft text",
  "settings.fonts.draftSize.hint":
    "iOS keeps this at 16 — Safari zooms the page into any smaller field you type in, and never zooms back out.",
  "settings.fonts.draftSize.decrease": "Decrease draft text size",
  "settings.fonts.draftSize.increase": "Increase draft text size",
  "settings.fonts.system": "System default",

  // --- settings.display (mirror display prefs, behind the composer's ⚙ dock) ---
  "settings.display.wrap.label": "Wrap lines",
  "settings.display.wrap.hint":
    "Off pans the whole pane, column-faithful. You no longer need it for a table — a table pans by itself while Wrap is on.",
  "settings.display.tapToType.label": "Tap to type",
  "settings.display.tapToType.hint":
    "On, tapping the mirror anywhere opens the keyboard. Off, the mirror behaves like a document — taps land on the text and only the composer opens the keyboard.",
  "settings.display.fullReply.label": "Full latest reply",
  "settings.display.fullReply.hint":
    "An agent's terminal keeps no scrollback, so a long answer loses its start. On, that reply is shown in full from the agent's own log, in place of the rows it covers.",
  "settings.display.rawTerminal.label": "Raw terminal",
  "settings.display.rawTerminal.hint":
    "Shows the plain mirror — no tappable prompt buttons, no chrome or status strips. Use it when a dialog renders wrong and you want to drive it by hand from Keys.",
  "settings.display.noInvert.label": "Render this pane natively",
  "settings.display.noInvert.hint":
    "Skips the light-theme inversion for this pane only. Turn it on when an agent is on a LIGHT theme and the mirror renders it dark; leave it off when the pane looks right.",
  "settings.display.textSize.label": "Text size",
  "settings.display.textSize.decrease": "Decrease font size",
  "settings.display.textSize.increase": "Increase font size",

  // --- settings.buildStamp ---
  "settings.buildStamp.tapToUpdate": "new build — tap to update",
  "settings.buildStamp.updating": "updating…",

  // --- composer (the reply box + its Keys/Quick/Display docks) ---
  "composer.dock.closeAria": "Close {title}",
  "composer.controls.label": "Controls",
  "composer.controls.keys": "Keys",
  "composer.controls.typeAria": "Type into terminal",
  "composer.controls.type": "Type",
  "composer.controls.quick": "Quick",
  "composer.controls.agent": "Agent",
  "composer.controls.displayAria": "Display settings",
  "composer.controls.display": "Display",
  "composer.sentPreview.label": "You sent:",
  "composer.placeholder.gone": "Pane is gone",
  "composer.placeholder.readOnly": "Read-only — not authorised",
  "composer.placeholder.noMuxSend": "Can't type into this terminal",
  "composer.placeholder.direct": "Type into the terminal…",
  "composer.placeholder.shell": "Type a shell command…",
  "composer.placeholder.reply": "Type a reply…",
  "composer.mic.unavailable": "Voice input is unavailable",
  "composer.mic.stopAria": "Stop recording",
  "composer.mic.recordAria": "Record a voice message",
  "composer.mic.transcribing": "Transcribing…",
  "composer.mic.recording": "Recording {elapsed}",
  "composer.mic.handsFreeHint": "will send when you stop",
  "composer.mic.manualHint": "lands in the message box",
  "composer.mic.stop": "Stop",
  "composer.mic.discardAria": "Discard recording",
  "composer.attach.aria": "Attach file",
  "composer.attach.title": "Attach",
  "composer.attach.photos": "Photos",
  "composer.attach.files": "Files",
  "composer.attach.listAria": "Attachments",
  "composer.attach.removeAria": "Remove {name}",
  "composer.attach.inFront": "Its marker is gone from your text, so Send puts {name} in front.",
  "composer.send.typeAnyway": "Type anyway?",
  "composer.send.reallySend": "Really send?",
  "composer.send.stopTypingAria": "Stop typing into terminal",
  "composer.send.sendAria": "Send",
  "composer.draft.tooLong":
    "Too long to keep as a saved draft — it survives switching panes, but not closing the app.",
  "composer.status.dialogWaiting": "A dialog is waiting — answer it first, then send.",
  "composer.status.unreadDialog":
    "Collie cannot read this dialog. {key} is on the card. Tap Send again to type anyway.",
  "composer.status.paneNotWritable": "Pane is no longer writable — nothing was sent",
  "composer.status.inputChanged":
    "The input box changed while clearing it — nothing was typed. Check the pane.",
  "composer.status.clearFailed": "Couldn't clear the terminal input",
  "composer.status.sent": "Sent ✓",
  "composer.status.tapAgainToType": "{error} Tap Send again to type anyway.",
  "composer.discard.confirmKeys.one": "Tap again to discard {count} queued key",
  "composer.discard.confirmKeys.other": "Tap again to discard {count} queued keys",
  "composer.destructive.confirm": "Destructive: {reason} — tap Send again to confirm",
  "composer.destructive.confirmOnHost": "Destructive: {reason} on {host} — tap Send again to confirm",
  "composer.upload.success": "File attached",
  "composer.upload.tooLarge": "That file is bigger than {max} MB, the limit on this collie.",
  "composer.upload.badType": "Collie can't attach {name}.",
  "composer.noEcho.title": "Password prompt — nothing echoes",
  "composer.noEcho.noLiveTyped":
    "What you typed is already in the pane, unsubmitted — but this view isn't live, so nothing can be sent from here. Answer it at the terminal.",
  "composer.noEcho.noLiveUntyped":
    "Nothing was typed. This view isn't live, so the keys that would work can't be sent from here.",
  "composer.noEcho.liveTyped":
    "What you typed is already in the pane — it just can't be confirmed, so it wasn't submitted. Press Enter in Type, and don't send it again.",
  "composer.noEcho.liveUntyped":
    "Send confirms what it typed, and this prompt shows nothing to confirm. Type sends your keys straight through, Enter included.",
  "composer.noEcho.useType": "Use Type",
  "composer.noEcho.dismissAria": "Dismiss password-prompt notice",
  "composer.draftPreview.title": "Draft in terminal",
  "composer.draftPreview.takeOver": "Take over",
  "composer.draftPreview.dismissAria": "Dismiss the terminal draft notice",

  // --- sendMode (the armed "typing straight through" indicator) ---
  "sendMode.armed.title": "Typing into terminal",
  "sendMode.armed.hint": "keys go straight through",
  "sendMode.armed.stop": "Stop",

  // --- chat (the pane view shell: header, mirror, switcher) ---
  "chat.zen.label": "Zen mode",
  // The floating pill is the ONE way out of zen, and it carries no words — only the glyph.
  "chat.zen.exitAria": "Exit zen mode",
  // --- chat.strips (the tab row + pane row, folded into one bar of beads) ---
  // The chevron's own name, and the summary bar's. Both are chosen for the rows actually on screen:
  // a pane row appears only above one pane, so naming it unconditionally would promise a row that is
  // not there. Each case is a WHOLE sentence rather than a phrase assembled from parts — "3 tabs" is
  // a noun phrase, and dropping one into a template is the bug every language with cases hands back.
  "chat.strips.hide.both": "Hide tabs and panes",
  "chat.strips.hide.tabs": "Hide tabs",
  "chat.strips.hide.panes": "Hide panes",
  "chat.strips.show.both": "Show tabs and panes. {tabs}, {panes} hidden.",
  "chat.strips.show.tabs": "Show tabs. {tabs} hidden.",
  "chat.strips.show.panes": "Show panes. {panes} hidden.",
  "chat.find.label": "Find in output",
  "chat.history.label": "Conversation history",
  // The header's ⋮ — the glyph names nothing, so the accessible name has to say what it OPENS.
  "chat.paneMenu.aria": "Pane actions",
  "chat.header.openOverviewAria": "Open {workspace} overview{status}",
  "chat.header.statusAria": " — {label}",
  "chat.header.agentGone": "(agent gone)",
  "chat.scrollback.showHistory": "Show entire history",
  "chat.scrollback.loadOlder": "Load older",
  "chat.scrollback.loading": "Loading…",
  "chat.scrollback.noSessionReported":
    "{agent} has not reported a session to Herdr. Install or update the Herdr integration for it, then restart the agent in this pane.",
  "chat.fullReply.title": "Full reply",
  "chat.fullReply.fromTranscript": "from transcript",
  "chat.fullReply.showingTerminal": "showing the terminal",
  "chat.output.empty": "(no recent output)",
  "chat.switcher.aria": "Switch pane",
  "chat.switcher.ariaNeedsYou": "Switch pane, another pane needs you",
  "chat.switcher.title": "Switch pane",
  "chat.switcher.launch.here": "here",
  "chat.status.feedbackSent": "Feedback sent",
  "chat.status.sent": "Sent",
  "chat.status.menuChanged": "Menu changed — refreshing",
  "chat.status.sendFailed": "Send failed",
  "chat.status.wizardChanged": "Wizard changed — refreshing",
  "chat.status.noteSaved": "Note saved",
  "chat.status.noteRemoved": "Note removed",
  "chat.status.dialogChanged": "Dialog changed — refreshing",
  "chat.status.selectionChanged": "Selection changed — refreshing",
  "chat.status.screenChanged": "The screen changed — refreshing",
  "chat.status.readOnly": "Read-only — device not authorised",

  // --- prompt (the native prompt-select / plan-feedback block) ---
  "prompt.family.select": "Choose an option",
  "prompt.family.permission": "Permission required",
  "prompt.family.trust": "Trust this folder?",
  "prompt.family.plan": "Review the plan",
  "prompt.sendingAria": "Sending",
  "prompt.feedback.cancel": "Cancel",
  "prompt.feedback.typedAria": "Feedback in the terminal",
  "prompt.feedback.planChange.offer": "Tell Claude what to change",
  "prompt.feedback.planChange.editorLabel": "What should Claude change?",
  "prompt.feedback.planChange.textAria": "Feedback text",
  "prompt.feedback.planChange.placeholder": "Say what to do differently…",
  "prompt.feedback.planChange.help":
    "Sends the plan back with your notes — Claude keeps planning instead of starting work.",
  "prompt.feedback.planChange.send": "Send feedback",
  "prompt.feedback.planChange.sending": "Sending feedback…",
  "prompt.feedback.planChange.focused":
    "The feedback box has the keyboard in the terminal — these buttons would type into it instead of answering. They resume when it closes.",
  "prompt.feedback.planChange.typedPrefix": "Feedback is being written in the terminal: ",
  "prompt.feedback.freeText.focused":
    "The free-text row has the keyboard in the terminal — these buttons would type into it instead of answering. They resume when it closes.",
  "prompt.feedback.freeText.typedPrefix": "A custom answer is being written in the terminal: ",

  // --- paneSettings (one pane's own preferences; today the prompt-cache warning, ADR 0042) ---
  "paneSettings.title": "Pane settings",
  "paneSettings.cacheWatch.label": "Warn me before this pane's cache goes cold",
  // "about", because the deadline is read off the agent's own transcript and the clock is the poll.
  "paneSettings.cacheWatch.hint": "about {minutes} minutes before it expires",
  "paneSettings.cacheWatch.pushOff": "Turn notifications on for this device in Settings first.",
  "paneSettings.cacheWatch.globalOn": "Settings warns about every pane, so this one is covered.",
  "paneSettings.cacheWatch.noSession": "This pane's agent names no session, so there is nothing to watch.",

  // --- paneActions (long-press sheet: rename / close a pane) ---
  "paneActions.title.fallback": "Pane",
  "paneActions.settings.label": "Pane settings",
  "paneActions.readOnly": "Read-only — this device isn't authorised to rename or close panes.",
  "paneActions.rename.label": "Rename",
  "paneActions.rename.placeholder": "name this pane",
  "paneActions.close.label": "Close pane",
  "paneActions.close.confirm": "Tap again to close",
  "paneActions.close.closing": "Closing…",
  "paneActions.focus.labelWithMux": "Focus in {mux}",
  "paneActions.focus.labelFallback": "Focus in the terminal",
  "paneActions.focus.done": "Focused in the terminal",
  "paneActions.focus.failed": "Couldn't focus in the terminal",
  "paneActions.empty.fallback": "This multiplexer offers no actions for a pane.",
  "paneActions.status.renamed": "Renamed",
  "paneActions.status.labelCleared": "Label cleared",
  "paneActions.status.renameFailed": "Rename failed",
  "paneActions.status.closeFailed": "Close failed",

  // --- keys (the inline Keys tray + its staging strip) ---
  "keys.presets.label": "Presets",
  "keys.fkeys.label": "F keys",
  "keys.confirm.label": "Confirm?",
  "keys.queue.removeAria": "Remove {label}",
  "keys.queue.charPlaceholder": "key",
  "keys.queue.charAria": "Type a key to combine",
  "keys.queue.send": "Send",
  "keys.queue.clearAria": "Clear queued keys",

  // --- nav (app header, Collie mark, settings gear) ---
  "nav.settings.aria": "Settings",
  "nav.home.aria.default": "Collie home",
  "nav.home.aria.lost": "Collie home — not connected",
  "nav.home.aria.reconnecting": "Collie home — reconnecting",
  "nav.mux.onPrefix": "on",
  "nav.prereleaseTitle": "Pre-release build — {version}",

  // --- home (dashboard herd list) ---
  "home.empty.disconnected": "Disconnected",
  "home.empty.disconnectedAt": "Disconnected — last seen {time}",
  "home.empty.noAgents": "No agents running.",
  "home.empty.waiting": "Waiting for Herdr…",
  "home.empty.panesHint": "Your panes are under Spaces.",
  "home.allClear": "Nothing needs you",
  "home.workspace.paneCount.one": "{count} pane",
  "home.workspace.paneCount.other": "{count} panes",
  "home.workspace.hidden": "hidden",
  "home.sidebar.shells": "Shells",
  "home.sidebar.paneActionsTitle": "Tap for pane actions",
  "home.row.tabPosition": "tab {n}",
  "home.row.unseen": "unseen",
  "home.tabs.aria": "Dashboard views",
  "home.tabs.panes": "Panes",
  "home.tabs.focus": "Focus",
  "home.tabs.blocked.one": "{count} blocked",
  "home.tabs.blocked.other": "{count} blocked",
  "home.tabs.unseen": "finished panes unseen",
  "home.changes.listAria": "Changes by workspace",
  "home.changes.loading": "Reading…",
  "home.changes.clean": "No changes",
  "home.changes.noFolder": "No folder",
  "home.changes.unavailable": "Can't read changes",
  "home.changes.files.one": "{count} file",
  "home.changes.files.other": "{count} files",

  // --- status (triage sections, status labels, counts) ---
  "status.section.needsYou": "Needs you",
  "status.section.readyUnseen": "Ready · unseen",
  "status.section.working": "Working",
  "status.section.recent": "Recent",
  "status.label.blocked": "needs you",
  "status.label.working": "working",
  "status.label.idle": "idle",
  "status.label.done": "done",
  "status.label.unknown": "unknown",
  "status.count.needsYou.one": "{count} needs you",
  "status.count.needsYou.other": "{count} needs you",
  "status.count.working.one": "{count} working",
  "status.count.working.other": "{count} working",
  "status.shellBadge": "shell",
  "status.dismissAria": "Dismiss",
  "status.detailAria": "Show the whole message",
  "status.detail.title": "What went wrong",
  "status.detail.copy": "Copy",
  "status.detail.copied": "Copied",
  "status.detail.dismiss": "Dismiss",

  // --- space (spaces overview/strip/view, tabs, panes, new-space) ---
  "space.overview.title": "Spaces",
  "space.overview.new.aria": "New space",
  "space.overview.filter.placeholder": "Filter spaces…",
  "space.overview.filter.aria": "Filter spaces",
  "space.overview.empty.none": "No spaces yet.",
  "space.overview.empty.noMatch": "No space matches “{query}”.",
  "space.overview.needsYou.one": "{count} space needs you",
  "space.overview.needsYou.other": "{count} spaces need you",
  "space.overview.paneCount.one": "{count} pane",
  "space.overview.paneCount.other": "{count} panes",
  "space.strip.back": "Back",
  "space.strip.title": "Spaces",
  "space.strip.all": "All",
  "space.view.tabCount.one": "{count} tab",
  "space.view.tabCount.other": "{count} tabs",
  "space.view.paneCount.one": "{count} pane",
  "space.view.paneCount.other": "{count} panes",
  "space.view.emptyTab": "(empty tab)",
  "space.view.noPanesInTab": "This tab has no panes.",
  "space.view.noPanesInSpace": "This space has no panes.",
  "space.tabStrip.title": "Tabs",
  "space.tabStrip.all": "All",
  "space.tabStrip.new.aria": "New tab",
  "space.paneStrip.title": "Panes",
  "space.new.title": "New space",
  "space.new.dir.label": "Directory (optional)",
  "space.new.dir.placeholder": "~ (home dir)",
  "space.new.label.label": "Label (optional)",
  "space.new.label.placeholder": "name this space",
  "space.new.create": "Create space & open shell",
  "space.tab.titleFallback": "Tab",
  "space.tab.titleWithLabel": "Tab {label}",
  "space.tab.readOnly": "Read-only — this device isn't authorised to rename or close tabs.",
  "space.tab.hostBlockSuffix": "{hostBlock} — rename and close are unavailable until it answers.",
  "space.tab.rename": "Rename",
  "space.tab.close": "Close tab",
  "space.tab.closing": "Closing…",
  "space.tab.closeConfirm.one": "Tap again to close {count} pane",
  "space.tab.closeConfirm.other": "Tap again to close {count} panes",
  "space.tab.closeConfirmPlain": "Tap again to close",
  "space.tab.empty.fallback": "This multiplexer offers no actions for a tab.",
  "space.tab.placeholder": "name this tab",
  "space.tab.renamed": "Renamed",
  "space.tab.renameFailed": "Rename failed",
  "space.tab.closeFailed": "Close failed",
  "space.tab.closed": "Tab closed",
  "space.readOnly.notPaired": "Not paired — pair this device in Settings",
  "space.readOnly.deviceUnauthorised": "Read-only — device not authorised",
  "space.create.ready": "New {what} ready — launch your agent",
  "space.noun.tab": "tab",
  "space.noun.space": "space",

  // --- actionSheet (shared rename/back/save rows behind pane + tab long-press sheets) ---
  "actionSheet.back": "Back",
  "actionSheet.label": "Label",
  "actionSheet.save": "Save",

  // --- commands (agent command palette) ---
  "commands.title": "Agent commands",
  "commands.search.placeholder": "Search {count} commands…",
  "commands.common.hint": "Common · type to search all {count}",
  "commands.empty": "No commands match “{query}”.",
  "commands.confirm": "Confirm?",

  // --- harnessBar (the row of the running agent's own commands, above the keys) ---
  // Slash commands are NEVER translated — they are wire text the harness parses — and neither is an
  // operator's own `bar_label`. Only these labels are.
  "harnessBar.label": "Harness shortcuts",
  "harnessBar.model": "Model",
  "harnessBar.effort": "Effort",
  "harnessBar.compact": "Compact",
  "harnessBar.resume": "Resume",
  "harnessBar.tree": "Tree",
  "harnessBar.confirmAria": "Tap again to confirm {command}",

  // --- quickActions (one-tap reply dock) ---
  "quickActions.group.confirm": "confirm",
  "quickActions.group.common": "common",

  // --- find (the in-mirror / in-history find bar) ---
  "find.placeholder": "Find in {subject}…",
  "find.aria": "Find in {subject}",
  "find.prevAria": "Previous match",
  "find.nextAria": "Next match",
  "find.closeAria": "Close find",
  "find.subject.output": "output",
  "find.subject.history": "history",

  // --- connection (banner, read-only strip, host chip/stale banner, session/server switchers) ---
  "connection.auth.message": "Access refused. This is not a connection problem.",
  "connection.auth.signIn": "Sign in",
  "connection.reload.aria": "Reload",
  "connection.retry": "Retry",
  "common.closeAria": "Close",
  "common.scrollToLatestAria": "Scroll to latest",
  "connection.connected": "Connected",
  "connection.reconnecting": "Reconnecting…",
  "connection.herdrDown": "Herdr is down on the host",
  "connection.offlineCantReach": "Offline — can't reach Collie",
  "connection.cantReach": "Can't reach Collie",
  "connection.withLastSeen": "{cause} — last seen {time}",
  "connection.readOnly.notPaired": "Not paired — pair this device in Settings to type into agents.",
  "connection.readOnly.device": "Read-only — this device isn’t authorised to type into agents{deviceSuffix}.",
  "connection.host.lastSeen": "last seen {time}",
  "connection.host.neverSeen": "never seen",
  "connection.host.unreachablePlain": "unreachable",
  "connection.host.unreachableSuffix": "unreachable · {label}",
  "connection.host.incompatible": "incompatible",
  "connection.host.lead": "lead",
  "connection.host.onPrefix": "on",
  "connection.host.ariaSends": "Sends to host: {name}{unreachable}",
  "connection.host.ariaHost": "Host: {name}{unreachable}",
  "connection.host.ariaUnreachableSuffix": " (unreachable)",
  // The parenthesis form is the LOCALE's, not this file's: a Chinese bundle writes full-width
  // brackets and no leading space. So the punctuation is one key and the word inside it is the same
  // word the eye reads, rather than a second translation of it that could drift.
  "connection.host.ariaSuffix": " ({word})",
  // ── §10.2's PRESENTATION SPLIT, IN WORDS (M22/05) ─────────────────────────
  // Two situations used to share the word above. "reconnecting" is the lead still trying, inside its
  // budget, and it asks nothing of the operator; "needs attention" is the lead unable to fix it by
  // trying again. The pair only earns its keep if the two never read as the same thing, so the
  // action sentences say the difference out loud rather than leaving it to a colour.
  "connection.host.reconnecting": "reconnecting",
  "connection.host.attention": "needs attention",
  "connection.host.reconnectingSuffix": "reconnecting · {label}",
  "connection.host.attentionSuffix": "needs attention · {label}",
  "connection.host.reconnectingAction": "The lead is still trying. Nothing to do.",
  "connection.host.attentionAction": "Trying again will not fix this. Check this machine.",
  "connection.stale.incompatible": "{name} is running an incompatible Collie",
  "connection.stale.unreachable": "{name} is unreachable · {label}",
  "connection.stale.nothingCached": "Nothing cached for this machine yet.",
  "connection.stale.showingLastKnown":
    "Showing the last known screen — replies and keys are refused until it answers.",
  "connection.stale.waitingFirst": "Nothing from {name} yet — waiting for its first answer.",
  "connection.stale.messageTemplate": "{reason}. {detail}",
  "connection.session.title": "Sessions",
  "connection.session.aria": "Session: {name}. Switch session",
  "connection.session.primary": "primary",
  "connection.session.unreachable": "unreachable",
  "connection.session.ariaIn": "In session: {name}",
  "connection.session.all": "All sessions",
  "connection.session.allDescription": "Every session on this machine, in one list",
  "connection.session.allAria": "Showing every session. Switch session",
  "connection.server.title": "Machines",
  "connection.server.aria": "Host: {name}. Switch host",


  // --- error (boot splash, route-level error recovery) ---
  "error.boot.connecting": "Connecting to the herd…",
  "error.boot.title": "Not connected",
  "error.boot.body": "Can’t reach Collie — check your connection to the host, then try again.",
  "error.boot.retry": "Retry",
  "error.root.title": "Something went wrong",
  "error.root.unknown": "Unknown error",
  "error.root.reload": "Reload",

  // --- idle (the idle-pause cover) ---
  "idle.dialogAria": "Collie paused",
  "idle.catchingUp.title": "Catching up",
  "idle.catchingUp.body": "Fetching the herd's current state.",
  "idle.paused.title": "Paused",
  "idle.paused.body":
    "Live updates stopped while this screen sat idle — what's behind this is frozen. Resuming picks up right where you left off.",
  "idle.resume": "Tap to resume",

  // --- pwa (self-update banner) ---
  "pwa.updateAvailable": "New version — tap to update",
  // The band while a new bundle is downloading into the precache (2026-09-12). The other six
  // dictionaries carry this English sentence until it is translated.
  "pwa.updateInstalling": "Downloading the new version…",

  // --- history (pane transcript route) ---
  "history.unavailable.disabled": "Transcript history is switched off on this bridge (COLLIE_TRANSCRIPT).",
  "history.unavailable.noSession": "This pane has no agent session, so there's no transcript to read.",
  "history.unavailable.noLog": "No transcript file was found for this pane's session yet.",
  "history.unavailable.error": "Couldn't read the transcript. Pull back and try again.",
  "history.findAria": "Find in history",
  "history.closeAria": "Close history",
  "history.title": "History",
  "history.loadOlder": "Load older",
  "history.loading": "Loading…",
  "history.startClipped": "Start of the readable transcript (the log was clipped at the read cap)",
  "history.startOfConversation": "Start of the conversation",
  "history.prevMessageAria": "Previous message you sent",
  "history.nextMessageAria": "Next message you sent",
  "history.loadOlderFailed": "Couldn't load older history",

  // --- transcript (transcript-view turn rendering) ---
  "transcript.summaryLabel": "Context compacted",
  "transcript.systemLabel": "System",
  "transcript.youLabel": "You",
  "transcript.agentFallback": "agent",
  "transcript.outputTruncated": "… output truncated",
  "transcript.truncated": "… truncated",
  "transcript.toolImageAlt": "Tool output",
  "transcript.attachmentAlt": "Attachment",

  // --- mirror (terminal graphics in the pane mirror) ---
  "mirror.blankLines": "[{n} blank lines]",
  "mirror.imageAlt": "Terminal graphics",
  "mirror.imageBadge": "[Image]",
  "mirror.imageMatchedByOrder": "matched by order, open History to check",

  // --- time (relative/clock formatting) ---
  "time.justNow": "just now",
  "time.compact.now": "now",


  // --- dialog (menu / multi-select / wizard / preview-select block renderers) ---
  "dialog.sendingAria": "Sending",
  // ADR 0056: every lifted card's own way back to the terminal rows it replaced.
  "dialog.terminalControl": "Terminal",
  "dialog.terminalControlAria": "Show the terminal instead of this card",
  "dialog.backToCard": "Back to the card",
  // ADR 0056 counsel fix: the generic-menu and unread-dialog cards already show the mirror by
  // default, so their own Terminal control only hides their buttons — it needs its own words.
  "dialog.putAwayControl": "Put away",
  "dialog.putAwayControlAria": "Hide this card's buttons, keep the terminal",
  "dialog.showButtons": "Show the buttons",
  "dialog.previousStepAria": "Previous step",
  "dialog.nextStepAria": "Next step",
  "dialog.answeredAria": "Answered",
  "dialog.submitChip": "Submit",
  "dialog.stepPosition.step": "Step {index} of {total}, {label}",
  "dialog.stepPosition.submit": "Step {index} of {total}, Submit",
  "dialog.chooseOption": "Choose an option",
  "dialog.questionsAria": "Questions",
  "dialog.reviewAnswers": "Review your answers",
  "dialog.readySubmit": "Ready to submit your answers?",
  "dialog.incomplete": "You have not answered all questions",
  "dialog.submitAnswers": "Submit answers",
  "dialog.cancel": "Cancel",
  "dialog.endsQuestionsSuffix": "— ends the questions",
  "dialog.autocomplete.title": "Slash commands",
  "dialog.menu.moveUp": "Move up",
  "dialog.menu.moveDown": "Move down",
  "dialog.menu.leftAria": "Left — {verb} ({label})",
  "dialog.menu.rightAria": "Right — {verb} ({label})",
  // The printed scale's chips (.adr/0054): one per value the screen listed. The chip's own text is
  // the level, so the aria name adds what a tap DOES to it.
  "dialog.menu.levelAria": "{verb} to {label}",
  "dialog.menu.levelCurrentAria": "{label}, current",
  "unreadDialog.caption": "Collie cannot read this dialog",
  "dialog.preview.currentAnswerAria": "Current answer",
  "dialog.preview.previewedBelowAria": "Previewed below",
  "dialog.preview.previewLabel": "Preview · {label}",
  "dialog.preview.editingBanner": "Note is being edited in the terminal — controls resume when it closes.",
  "dialog.preview.noteForQuestion": "Note for this question",
  "dialog.preview.noteTextAria": "Note text",
  "dialog.preview.notePlaceholder": "Add context for your answer…",
  "dialog.preview.saveNote": "Save note",
  "dialog.preview.editNoteAria": "Edit note",
  "dialog.preview.removeNoteAria": "Remove note",
  "dialog.preview.noteAria": "Note",
  "dialog.preview.addNote": "Add a note to this answer",

  // --- reply (the free-text reply race guard, lib/reply-action.ts) ---
  "reply.blocked.noBox":
    "The agent's input box isn't on screen — a menu or dialog is probably up. Nothing was typed.",
  "reply.blocked.noEcho":
    "That's a password prompt — it shows nothing as you type, so Send can never confirm the text arrived. Nothing was typed.",
  "reply.blocked.composerLeft":
    "The agent's input box left the screen while its input line was being cleared — a menu or dialog is probably up. Your message wasn't typed.",
  "reply.stalled.noEcho":
    "That's a password prompt — it shows nothing as you type, so the text can't be confirmed and nothing was submitted. What you typed is already in the pane.",
  "reply.stalled.generic":
    "Message didn't reach the input box — a dialog may be waiting, and if you were answering it by key that key likely landed. Nothing was submitted.",

  // --- previewAction (the preview-select dialog's note flow, lib/preview-action.ts) ---
  "previewAction.note.notOpened": "Note input didn't open — check the pane",
  "previewAction.note.clearFailed": "Couldn't clear the existing note — check the pane",
  "previewAction.note.textFailed": "Note text didn't arrive — check the pane",
  "previewAction.note.closeFailed": "Note input didn't close — check the pane",

  // --- promptAction (the plan-feedback flow, lib/prompt-action.ts) ---
  "promptAction.feedback.freeTextUnsupported":
    "This dialog's free-text row is not typed from the phone",
  "promptAction.feedback.empty": "Nothing to send",
  "promptAction.feedback.boxNotOpened": "The feedback box didn't open — check the pane",
  "promptAction.feedback.notArrived": "The feedback didn't arrive — nothing was submitted",


  // --- directTyping (the composer's "Type into terminal" mode, hooks/use-direct-typing.ts) ---
  "directTyping.status.draftPending": "Send or clear the draft before typing into the terminal.",
  "directTyping.status.armed": "Typing into the terminal — keys send as you type.",
  "directTyping.status.disarmed": "Back to sending replies",
  "directTyping.status.interrupted":
    "Stopped typing into the terminal — the pane view was interrupted.",
  "directTyping.status.backgrounded":
    "Stopped typing into the terminal — the app was backgrounded.",

  // --- apiError (the bridge's refusals, keyed by the code on the wire) ---
  //
  // ONE KEY PER CODE in `lib/api-error-codes.ts`, spelled `apiError.<code>` — the dots inside a code
  // are part of the key, not a nesting. `lib/api-error-message.ts` builds the key from the code, so
  // a code with no key here is a COMPILE error, and a code a newer bridge invents falls back to the
  // English sentence that body already carries.
  //
  // `{reason}` is NEVER Collie's text: it is the multiplexer's own refusal, passed through byte for
  // byte (bridge/error-codes.ts). Those messages are a translated FRAME around a raw remainder —
  // translate the frame, leave the slot where the sentence reads naturally in your language.
  "apiError.unknown": "Something went wrong. Try again.",
  "apiError.reply.not_submitted":
    "Your message was typed into the pane but not sent — check the pane before sending it again.",
  "apiError.reply.send_failed": "The message couldn't be sent: {reason}",
  "apiError.keys.send_failed": "Those keys couldn't be sent: {reason}",
  "apiError.prompt_changed": "The screen changed before that could be sent — check the pane.",
  "apiError.prompt.read_failed": "The pane couldn't be read before sending — {mux} said: {detail}",
  "apiError.pane.close_failed": "The pane couldn't be closed: {reason}",
  "apiError.pane.rename_failed": "The pane couldn't be renamed: {reason}",
  "apiError.pane.focus_failed": "The pane couldn't be shown in the terminal: {reason}",
  "apiError.tab.create_failed": "The tab couldn't be created: {reason}",
  "apiError.tab.rename_failed": "The tab couldn't be renamed: {reason}",
  "apiError.tab.close_failed": "The tab couldn't be closed: {reason}",
  "apiError.tab.workspace_required": "No space was named for the new tab.",
  "apiError.launch.not_allowlisted": "That command isn't one of your launchers",
  "apiError.launch.pane_unknown": "That pane is gone, nothing was launched",
  "apiError.workspace.create_failed": "The space couldn't be created: {reason}",
  "apiError.upload.too_large": "That file is too large, {maxMb} MB is the limit.",
  "apiError.upload.no_file": "No file was sent.",
  "apiError.upload.bad_type": "Collie can't send that kind of file: {type}",
  "apiError.upload.write_failed": "The file couldn't be saved on the host: {reason}",
  "apiError.stt.unconfigured": "Speech-to-text isn't set up on this collie.",
  "apiError.stt.too_large": "That recording is too long — record a shorter one.",
  "apiError.stt.bad_format": "This browser recorded a format Collie can't send on.",
  "apiError.stt.busy": "Two recordings are already being transcribed — try again in a moment.",
  "apiError.stt.unreadable": "That recording couldn't be read.",
  "apiError.stt.empty": "That recording is empty.",
  "apiError.stt.provider_failed": "The transcription failed: {reason}",
  "apiError.pairing.bad_request": "The code or the name wasn't usable. A name is 1–48 characters.",
  "apiError.pairing.no_pending": "No pairing code is waiting on the host.",
  "apiError.pairing.expired": "That pairing code has expired.",
  "apiError.pairing.exhausted": "Too many wrong codes — that pairing was destroyed.",
  "apiError.pairing.bad_code": "That code doesn't match.",
  "apiError.pairing.duplicate_label": "A device is already using that name.",
  "apiError.device.unknown": "No paired device has that name.",
  "apiError.cache.pane_unknown": "That pane is gone, nothing was changed.",
  "apiError.cache.no_session": "That pane's agent names no session, so it can't be watched.",
  "apiError.session.unknown": "There is no session called {session} on this collie.",
  // The key mirrors the wire code `crew.not_lead` (`bridge/error-codes.ts`). Both say crew from 1.8.0.
  // --- worktrees (ADR 0032) ---
  "apiError.worktree.list_failed": "The worktrees couldn't be listed: {reason}",
  "apiError.worktree.create_failed": "The worktree couldn't be created: {reason}",
  "apiError.worktree.created_not_opened": "The branch was created, but nothing could be opened on it: {reason}",
  "apiError.worktree.open_failed": "The worktree couldn't be opened: {reason}",
  "apiError.worktree.busy": "Another worktree operation is still running — try again in a moment.",
  "apiError.worktree.ambiguous_branch": "That branch name matches more than one thing: {reason}",
  "apiError.worktree.branch_required": "Type a branch name first.",
  "apiError.worktree.not_a_repo": "This space isn't in a Git repository.",
  "worktree.section": "Worktrees",
  "worktree.new": "New worktree",
  "worktree.branchLabel": "Branch name",
  "worktree.branchPlaceholder": "feature/my-change",
  "worktree.branchesFrom": "Branches from {branch}",
  "worktree.create": "Create",
  "worktree.creating": "Creating…",
  "worktree.open": "Open",
  "worktree.opening": "Opening…",
  "worktree.mainCheckout": "the repo itself",
  "worktree.empty": "No worktrees yet.",
  "worktree.detached": "detached",
  "worktree.recoverOpen": "Open the branch that was created",
  "space.new.tab.plain": "Space",
  "space.new.tab.worktree": "Worktree",
  "space.new.repo.label": "Repository",
  "space.new.host.label": "Host",
  "worktree.orOpenExisting": "Or open one that already exists",
  // --- apiError.update (POST /api/update refusals, M15/05) ---
  // --- settings.updateCard (the update card, M15/05) ---
  // THE SENTENCE ABOUT THE CREW LINK (M27/06), whole. It lives in the CARD's namespace because the
  // card is where it is read: above the confirm, with room for both halves of it — what changes,
  // and what to do about it. The band prints `updateRibbon.linkChangeShort` instead, held to the
  // row's forty characters like every other band string. The digest push carries this same English
  // from `LINK_CHANGE_SENTENCE` in `bridge/update.ts`, which has no locale to read.
  //
  // Generic on purpose: it is printed off a wire-version DIFFERENCE, never off a release name, so
  // the release after the next one carries it with no string edited.
  // THE URGENT LABEL (ADR 0046). A label and nothing more: the sentence beside it is the release's
  // own English, read from its `collie-release.json`, so it is printed as it was written and is
  // never translated. An urgent release keeps the DAILY digest cadence even when the delta is
  // patches only; the label is how the operator sees that on the card.
  // THE SAME LABEL WHEN THE URGENT RELEASE IS NOT THE ONE ON OFFER (ADR 0046). An urgent 1.9.1 with
  // a quiet 1.9.2 above it offers 1.9.2, and a bare "Urgent" would read as a claim about that
  // release. Naming the version says what is true: the fix is in the pile, and taking the offer
  // takes it.

  // --- settings.updateCard, the crew half (M16/01) ---
  // THE BUTTON OPENS UPDATE MODE (ADR 0064). It names the whole of what happens, all machines and the
  // version, and it no longer grows a confirm inside the card: "Start update" on the first screen of
  // update mode is the confirm.


  // --- updateRibbon (the ONE top-of-app update band), M16/02 ---
  // Every string in this block is held to a 40-CHARACTER BUDGET in all six locales, enforced by
  // `update-ribbon-i18n.test.ts`. One truncating row on a phone is about forty characters wide, and
  // a line that overflows it in German or Japanese is a line nobody can read. The budget is measured
  // with the slots filled: a version, a peer name, a count. `{reason}` is a peer's own prose of
  // unbounded length, so it is cut on a word boundary before it ever reaches a string here and the
  // Updates page carries it whole.
  // THE BAND'S OWN CUT OF IT. One truncating row is about forty characters wide, which the whole
  // sentence is not, so the band states WHAT changes and the tap lands on the card, where the rest
  // of it sits above the confirm. Held to the budget like every other band string.
  // THE BAND'S HALF OF IT (ADR 0046). The label alone, because the release's sentence is prose of
  // unbounded length and this row is forty characters. The tap lands on the card, which prints it.
  // A packaged host cannot take the tap — its updates come from its package manager (ADR 0035) — so
  // the band STATES the fact and names the manager. It does not instruct: the phone cannot run
  // pacman, and a line that told the operator to would be telling them to go somewhere else.
  // The same host under a prefix Collie does not recognise: there is no manager to name, so the band
  // states the version and points at the page that carries the boundary sentence.
  // The band's own control in the states that can also be PUT DOWN. `ui/notice.tsx` forbids a
  // whole-row tap beside a dismiss X (a button may not hold a button), so those states name the
  // tap instead of being one. It opens /settings/updates, where the confirm lives; it starts nothing.
  // The close on the two QUIET crew states. Not "dismiss this version": what is put down there is a
  // notice about another machine, and this host's own offer is untouched by it.
  // ── The prompt-cache chip and its sheet (M28/02) ──────────────────────────
  // A rule's `label`, its source title and its publisher are NOT here: those are another vendor's
  // words about their own product, the same carve-out ADR 0030 makes for slash-command descriptions.
  // The countdown itself is a number and a unit letter, which is the compact convention `timeAgoShort`
  // already follows across every locale.
  "cache.warm": "Prompt cache warm",
  "cache.expiring": "Prompt cache expiring",
  "cache.cold": "cold",
  "cache.unknown": "Prompt cache not known",
  "cache.under1m": "<1m",
  "cache.overridden": "TTL set in cache-rules.toml",
  "cache.sheet.title": "Prompt cache",
  "cache.sheet.rule": "Rule",
  "cache.sheet.ttl": "Stays warm for",
  "cache.sheet.ttlMinutes": "{minutes} min",
  "cache.sheet.confidence": "Confidence",
  "cache.sheet.source": "Read on",
  "cache.sheet.retrieved": "Checked",
  "cache.sheet.measured": "Measured on this machine",
  "cache.sheet.lastRead": "last read {age}",
  "cache.sheet.overridden": "Moved by cache-rules.toml",
  "cache.sheet.thisMachine": "This machine",
  "cache.sheet.onPeer": "Read on {host}. Its rule catalog is not forwarded, so the source is not quoted here.",
  "cache.sheet.reset.pending": "{action} after the last turn, so the next turn rebuilds the cache.",
  "cache.sheet.reset.cause": "{action} before the last turn, so that turn rebuilt the cache.",
  "cache.sheet.state": "State",
  "cache.sheet.state.warm": "Warm",
  "cache.sheet.state.expiring": "Expiring",
  "cache.sheet.state.cold": "Cold",
  "cache.confidence.documented": "documented",
  "cache.confidence.reported": "reported",
  "cache.confidence.inferred": "inferred",
  "cache.confidence.observed": "measured",
  "updateRibbon.hideNotice": "Hide this notice",

  // --- tour (the first-run screen, web/src/components/tour-sheet.tsx) ---
  // ONE scrolling screen, shown once per device and then only when the operator asks in Settings.
  // The English here is the source of truth; the six other catalogs carry it verbatim until it is
  // translated. Raise TOUR_VERSION (lib/tour.ts) when a CLAIM below changes, never for polish.
  "tour.skip": "Skip",
  "tour.title": "Collie shows the agents in your terminal.",
  // The claim's second sentence, in the three forms the facts can support. {mux} is the
  // multiplexer's display name, {host} the lead machine's crew label; a clause whose fact is missing
  // is dropped rather than filled with a placeholder.
  "tour.lead":
    "It mirrors the panes running under {mux} on {host}. It shows what is on those screens, and it never runs a terminal of its own.",
  "tour.leadNoHost":
    "It mirrors the panes running under {mux}. It shows what is on those screens, and it never runs a terminal of its own.",
  "tour.leadNoMux":
    "It mirrors the panes running in your terminal multiplexer. It shows what is on those screens, and it never runs a terminal of its own.",

  // Your setup. Every row is a fact this snapshot carries, or the row is absent.
  "tour.setup": "Your setup",
  "tour.setup.panes.one": "{count} pane",
  "tour.setup.panes.other": "{count} panes",
  "tour.setup.needsYou.one": "{count} needs you",
  "tour.setup.needsYou.other": "{count} need you",
  "tour.setup.noPanes": "No panes yet",
  "tour.setup.machines.one": "{count} machine in your crew",
  "tour.setup.machines.other": "{count} machines in your crew",
  "tour.setup.canType": "This device can type",
  "tour.setup.readOnly": "This device can read only",
  "tour.setup.pushOff": "Notifications are off on this phone",

  // Do this next. At most two cards, first match wins, in this order.
  "tour.doNext": "Do this next",
  "tour.pair.title": "Pair this phone",
  "tour.pair.body": "Run collie pair on the host, then type the code in Settings.",
  "tour.pair.button": "Pair",
  "tour.space.title": "Nothing is running yet",
  "tour.space.body": "Start an agent in your terminal, or make a space here.",
  "tour.space.button": "New space",
  "tour.pushCard.title": "Be told when a pane needs you",
  "tour.pushCard.body": "Collie notifies you when an agent is blocked, or done.",
  "tour.install.title": "Keep Collie on your home screen",
  "tour.install.body": "It opens full screen and remembers where you were.",
  "tour.install.button": "Add",
  "tour.push.enable": "Turn on",
  "tour.push.enabled": "Notifications are on for this device.",

  // What you can do here. The six lines the site sells and the app never said.
  "tour.can": "What you can do here",
  "tour.can.mirror": "Read the live pane, colour and all.",
  "tour.can.answer": "Answer a prompt by tapping its card.",
  "tour.can.type": "Type a reply, or send Esc, Tab and Ctrl keys.",
  "tour.can.harness": "Set model and effort from the actions row.",
  "tour.can.session": "Read the whole session, past the scrollback.",
  "tour.can.crew": "Watch every machine in your crew from one URL.",

  // The footer's one button. The first spelling opens the blocked pane; the second closes the sheet.
  "tour.done.pane": "Open the pane that needs you",
  "tour.done.dashboard": "Show the dashboard",

  // --- settings.tour ---
  "settings.tour.title": "Show the first screen again",
  "settings.tour.description": "What Collie does, and what this install looks like.",
  "settings.tour.button": "Show",

  // --- updateScreen (M28/01) ---
  // The sheet a running update takes the screen with: one row per machine, one for this device's own
  // download, and a way out of every state that can stall. `components/update-screen.tsx` renders it;
  // `lib/update-screen.ts` decides every state it can be in. Short words — these rows are read on a
  // phone while a machine is being rebuilt underneath them.
  // The one sentence of truth, small and last: the run is on the machines, and this screen only shows
  // it. An operator who thinks closing the phone stops the update will not close the phone.
  // The badge, on a device that did not start the run. One line, so it truncates rather than wraps.
  // A row's state, in the fewest words that are still true. The lead's four in-flight states say what
  // the machine is DOING; a peer reports `updating` for all four, because the lead cannot see inside.
  // The run ended and it did not arrive. The sentence names what happened and the reason the host gave.
  // The lead has held one state longer than a whole build, restart and verify takes. Keep waiting, with
  // the app back in your hands — never a cancel, and never a forced reload.
  // THIS device, which is not a machine in the crew: it is the phone fetching the bundle the machines
  // now serve. Counted in FILES, because per-file is the only thing the service worker reports.
  // The end, through the status channel every other confirmation uses. A solo install names the MACHINE,
  // because there is no crew to name.

  // --- updateScreen, update mode (ADR 0064) ---
  // The docked panel a running update puts the phone under: a band with the step and a clock, the app
  // behind a veil, and seven steps. Plain words, short sentences: these are read on a phone while a
  // machine is rebuilt underneath them. `{lead}` is the machine that leads the crew.
  // Ready to start: the confirm, as the first screen of update mode.
  // The seven steps.
  // A member that needs you, on step 5.
  // One row's words, after the machine's name.

  // --- changes (ADR 0065) ---
  "chat.changes.label": "Changes",
  "changes.title": "Changes",
  "changes.backAria.dashboard": "Back to the dashboard",
  "changes.backAria.workspace": "Back to the workspace",
  "changes.backAria.pane": "Back to the pane",
  "changes.listBackAria": "Back to the list",
  "changes.refreshAria": "Refresh changes",
  "changes.loading": "Reading changes…",
  "changes.empty": "No changes since the last commit.",
  "changes.unavailable.noFolder": "Collie can't find a folder for this workspace, so there are no changes to show.",
  "changes.unavailable.noGit": "Git is not installed on this machine.",
  "changes.unavailable.noPane": "This pane is gone.",
  "changes.unavailable.noWorkspace": "This workspace is gone.",
  "changes.error": "Couldn't read the changes. Tap refresh to try again.",
  "changes.stale": "Not updating",
  "changes.truncated": "The list hit a limit, so some repos or files may be missing.",
  "changes.bound.depth.one": "Stopped at {count} level, with repos further down.",
  "changes.bound.depth.other": "Stopped at {count} levels, with repos further down.",
  "changes.bound.settings": "Look deeper in Settings",
  "changes.thisPane": "This pane",
  "changes.repoFiles.one": "{name} · {count} file",
  "changes.repoFiles.other": "{name} · {count} files",
  "changes.status.M": "Modified",
  "changes.status.A": "Added",
  "changes.status.D": "Deleted",
  "changes.status.R": "Renamed",
  "changes.status.untracked": "Untracked",
  "changes.binaryShort": "binary",
  "changes.file.binary": "Binary file, not shown.",
  "changes.file.directory": "New folder. Its files are not listed one by one.",
  "changes.file.truncated": "The diff stops here. It is too long to show in full.",
  "changes.file.unknown": "This file is no longer in the list of changes. Go back and refresh.",
  "changes.file.gone": "No longer changed",
  "changes.file.error": "Couldn't read this diff.",
  "changes.file.noLines": "No line changes.",
  "changes.file.renamedFrom": "Renamed from {path}",
  "changes.file.prev": "Previous file",
  "changes.file.next": "Next file",
  "changes.layout.aria": "Layout",
  "changes.layout.list": "List",
  "changes.layout.tree": "Tree",
  "changes.tree.folderAria.one": "{name}, {count} file",
  "changes.tree.folderAria.other": "{name}, {count} files",
  "changes.filter.button": "Filter files",
  "changes.filter.buttonActive": "Filter files, {shown} of {total} shown",
  "changes.filter.placeholder": "Filter by path",
  "changes.filter.clearText": "Clear text",
  "changes.filter.statusAria": "Filter by status",
  "changes.filter.shown": "{shown} of {total} files",
  "changes.filter.none": "No files match.",
  "changes.filter.clear": "Clear filter",
  "changes.commit.show": "Show last commit",
  "changes.commit.showFor": "Show last commit of {name}",
  "changes.commit.cleanHeading": "No uncommitted changes",
  "changes.commit.title": "Last commit",
  "changes.commit.backAria": "Back to the commit",
  "changes.commit.loading": "Reading the commit…",
  "changes.commit.error": "Couldn't read the commit. Tap refresh to try again.",
  "changes.commit.noCommit": "This repo has no commits yet.",
  "changes.commit.unknown": "Collie can't find this repo any more. Go back and refresh.",
  "changes.commit.empty": "This commit changes no files.",
  "changes.commit.newer": "A newer commit exists",
  "changes.commit.uncommitted": "New uncommitted changes",
  "changes.commit.fileNewer": "The repo has a newer commit. Go back and load it to read this file.",
  "settings.changes.title": "Changes",
  "settings.changes.description": "How a pane's Changes view finds git repos.",
  "settings.changes.nested.label": "Look for repos inside this folder",
  "settings.changes.nested.hint": "Also show repos in folders below the pane's folder, even ones the parent repo ignores.",
  "settings.changes.depth.label": "How deep to look",
  "settings.changes.depth.hint": "Folder levels below the pane's folder.",
  "settings.changes.depth.levels.one": "{count} level",
  "settings.changes.depth.levels.other": "{count} levels",
} as const;

/** Every key that exists, as a union of string literals. The completeness contract. */
export type MessageKey = keyof typeof en;

/** The English bundle's exact shape (literal values). Other locales are `Dictionary`, not this. */
export type Messages = typeof en;

/** What a translated bundle must be: every key, any string. `Record` over a finite union of
 *  literals is complete in BOTH directions — a missing key fails the assignment, an extra one is
 *  caught as an excess property. That is the entire enforcement mechanism; don't loosen it. */
export type Dictionary = Record<MessageKey, string>;
