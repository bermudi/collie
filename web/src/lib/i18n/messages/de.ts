import type { Dictionary } from "./en";

// German. Typed `Dictionary`, so a key English has and this file does not is a compile error, and a
// key this file invents that English does not have is one too. Keep the `{slot}` names byte-exact.

export const de: Dictionary = {
  "settings.updateBanner.restart": "Bridge-Neustart erforderlich",
  "settings.updateBanner.releaseAvailable": "Collie {version} verfügbar",
  "settings.updateBanner.majorAvailable": "Collie {version} (Major-Release)",
  "settings.updateBanner.copyAria": "Befehl kopieren: {command}",
  "settings.language.title": "Sprache",
  "settings.language.description": "Der Terminal-Spiegel wird nie übersetzt.",

  // --- settings (page chrome) ---
  "settings.title": "Einstellungen",
  "settings.nav.back": "Zurück",

  // --- settings.theme ---
  "settings.theme.title": "Erscheinungsbild",
  "settings.theme.description": "Systemeinstellung übernehmen oder festlegen.",
  "settings.theme.option.system": "System",
  "settings.theme.option.light": "Hell",
  "settings.theme.option.dark": "Dunkel",

  // --- settings.haptics ---
  "settings.haptics.title": "Haptik",
  "settings.haptics.description": "Kurze Vibration bei Tastendruck und Schnellantworten.",


  // --- settings.zen ---
  // Availability only: the toggle decides whether the pane menu offers zen at all.
  "settings.install.title": "App installieren",
  "settings.install.description": "Collie zum Startbildschirm hinzufügen: Vollbild und eigenes App-Icon.",
  "settings.install.button": "Installieren",
  "settings.install.iosHint": "Unter iOS und iPadOS über das Teilen-Menü des Browsers installieren: Teilen antippen, dann „Zum Home-Bildschirm“.",
  "settings.harnessBar.title": "Harness-Tastenkürzel",
  "settings.harnessBar.description": "Eine Leiste mit den eigenen Befehlen des laufenden Agenten über den Tasten.",
  "settings.beltSize.title": "Größe der Aktionsleiste",
  "settings.beltSize.description": "Wie hoch die Zeile mit Aktionen über der Eingabe ist und wie groß deren Symbole und Wörter sind.",
  "settings.beltSize.option.default": "Standard",
  "settings.beltSize.option.large": "Groß",
  "settings.beltSize.option.larger": "Größer",
  "settings.zen.title": "Zen-Modus",
  "settings.zen.description": "Fügt dem Menü einen Eintrag hinzu, der alle Elemente außer dem Terminal ausblendet.",
  "settings.zen.auto.label": "Bei Querformat aktivieren",
  "settings.zen.auto.hint": "Beim seitlichen Drehen öffnet sich der Zen-Modus automatisch; beim Zurückdrehen schließt er sich wieder.",

  // --- settings.handsFree ---
  "settings.handsFree.title": "Freisprechen",
  "settings.handsFree.description":
    "Transkript sofort senden, statt es im Eingabefeld abzulegen. Standardmäßig deaktiviert, um Eingaben vor dem Senden an das Terminal prüfen zu können.",
  "settings.handsFree.ariaLabel": "Freisprechen: Transkript sofort senden",

  // --- settings.push ---
  "settings.push.title": "Push-Benachrichtigungen",
  "settings.push.description": "Benachrichtigung empfangen, wenn ein Agent Eingaben erfordert.",
  "settings.push.reason.insecure": "Push erfordert eine HTTPS-Verbindung.",
  "settings.push.reason.serverOff": "Push ist auf der Bridge nicht konfiguriert (keine VAPID-Schlüssel).",
  "settings.push.reason.denied":
    "Benachrichtigungen sind blockiert. In den Browsereinstellungen aktivieren.",
  "settings.push.reason.unsupported": "Dieser Browser unterstützt keine Push-Benachrichtigungen.",
  "settings.push.reason.default": "Push-Benachrichtigungen konnten nicht aktiviert werden.",
  "settings.push.reason.timeout": "Zeitüberschreitung beim Einrichten der Benachrichtigungen. Prüfe, ob dieses Gerät den Push-Dienst erreichen kann, und versuche es erneut.",
  "settings.push.availability.unavailable": "Die Benachrichtigungseinstellungen konnten nicht geprüft werden. Prüfe deine Verbindung oder melde dich erneut an und versuche es noch einmal.",
  "settings.push.availability.insecure":
    "Über HTTP nicht verfügbar. Collie über HTTPS bereitstellen, um Push zu nutzen.",
  "settings.push.availability.serverOff":
    "Auf der Bridge sind keine VAPID-Schlüssel hinterlegt. Push ist serverseitig deaktiviert.",
  "settings.push.availability.denied":
    "Benachrichtigungen für diese Seite sind blockiert. In den Browsereinstellungen freigeben.",
  "settings.push.availability.unsupported":
    "Dieser Browser unterstützt keine Push-Benachrichtigungen.",

  // --- settings.notify ---
  "settings.notify.title": "Benachrichtigen bei",
  "settings.notify.description": "Gilt für alle Geräte.",
  "settings.notify.blocked.label": "Eingabe erforderlich",
  "settings.notify.blocked.hint": "ein Agent wartet auf Rückmeldung",
  "settings.notify.done.label": "Fertiggestellt",
  "settings.notify.done.hint": "ein Agent schließt seine Aufgabe ab",
  "settings.notify.updates.label": "App-Updates",
  "settings.notify.updates.hint": "eine neue Collie-Version ist verfügbar",
  "settings.notify.cache.label": "Cache wird bald inaktiv",
  "settings.notify.cache.hint":
    "Der Prompt-Cache eines Panes läuft in wenigen Minuten ab; deckt auch Panes ab, die Sie einzeln beobachten",
  "settings.notify.watched.title": "Beobachtete Panes",
  "settings.notify.watched.empty": "Noch keine: Öffnen Sie die Einstellungen eines Panes, um es zu beobachten.",
  "settings.notify.watched.remove": "Entfernen",
  "settings.notify.watched.removeAria": "{label} nicht mehr beobachten",

  // --- settings.snooze ---
  "settings.snooze.title": "Nicht stören",
  "settings.snooze.description.idle": "Push-Benachrichtigungen vorübergehend pausieren.",
  "settings.snooze.description.active": "Pausiert bis {time}. Bis dahin werden keine Benachrichtigungen zugestellt.",
  "settings.snooze.resume": "Jetzt fortsetzen",
  "settings.snooze.preset.min30": "30m",
  "settings.snooze.preset.hour1": "1h",
  "settings.snooze.preset.hour4": "4h",

  // --- settings.devices ---
  "settings.devices.title": "Gekoppelte Geräte",
  "settings.devices.description.enforced":
    "Schreibzugriffe erfordern ein gekoppeltes Gerät. Lesezugriff bleibt offen.",
  "settings.devices.description.open":
    "Keine Geräte gekoppelt, Schreibzugriffe sind ungesichert. Ein Gerät koppeln, um Authentifizierung zu erzwingen.",
  "settings.devices.pairedAs": "Dieses Gerät ist gekoppelt als {device}.",
  "settings.devices.loadError": "Gekoppelte Geräte konnten nicht von der Bridge geladen werden.",
  "settings.devices.thisDevice": "Dieses Gerät",
  "settings.devices.row.meta": "Gekoppelt {paired} · Zuletzt aktiv {lastSeen}",
  "settings.devices.revokeError": "Gerät konnte nicht widerrufen werden.",
  "settings.devices.cancel": "Abbrechen",
  "settings.devices.unpairSelf": "Dieses Gerät entkoppeln",
  "settings.devices.revoke": "Widerrufen",
  "settings.devices.revokeAria": "{label} widerrufen",
  "settings.devices.pair.title": "Dieses Gerät koppeln",
  "settings.devices.pair.hint":
    "Führe {command} auf dem Host aus. Scanne dann den ausgegebenen Code oder gib ihn hier ein.",
  "settings.devices.pair.codeLabel": "Kopplungscode",
  "settings.devices.pair.codePlaceholder": "8 Zeichen",
  "settings.devices.pair.nameLabel": "Gerätename",
  "settings.devices.pair.namePlaceholder": "z. B. Smartphone",
  "settings.devices.pair.networkError":
    "Bridge nicht erreichbar. Verbindung prüfen und erneut versuchen.",
  "settings.devices.pair.failure.noPending":
    "Kein offener Kopplungscode vorhanden. `bin/collie pair` auf dem Host ausführen, um einen zu generieren.",
  "settings.devices.pair.failure.expired":
    "Dieser Code ist abgelaufen. `bin/collie pair` auf dem Host ausführen, um einen neuen zu erzeugen.",
  "settings.devices.pair.failure.exhausted":
    "Zu viele Fehlversuche. Die Kopplung wurde verworfen. `bin/collie pair` auf dem Host ausführen, um neu zu starten.",
  "settings.devices.pair.failure.badCode":
    "Code stimmt nicht überein. Eingabe prüfen. Nach weiteren Fehlversuchen verfällt der Code.",
  "settings.devices.pair.failure.duplicateLabel":
    "Dieser Name wird bereits verwendet. Anderen Namen wählen, der Code bleibt gültig.",
  "settings.devices.pair.failure.badRequest":
    "Code oder Name ungültig. Namen müssen 1–48 Zeichen lang sein.",

  // --- settings.connection ---
  "settings.connection.title": "Verbindung",
  "settings.connection.description": "Diagnosedaten für dieses Gerät.",
  "settings.connection.row.endpoint": "Endpunkt",
  "settings.connection.row.secure": "Sicherer Kontext",
  "settings.connection.row.bridge": "Bridge",
  "settings.connection.row.deviceAccess": "Gerätezugriff",
  "settings.connection.row.serverBuild": "Server-Build",
  "settings.connection.secure.yes": "Ja",
  "settings.connection.secure.no": "Nein (HTTP)",
  "settings.connection.bridge.connected": "Verbunden",
  "settings.connection.bridge.offline": "Herdr offline",
  "settings.connection.bridge.connecting": "Verbindung wird hergestellt…",
  "settings.connection.device.notEnforced": "Nicht erzwungen",
  "settings.connection.device.fullAccessNamed": "Vollzugriff · {device}",
  "settings.connection.device.fullAccessLocal": "Vollzugriff (lokal)",
  "settings.connection.device.readOnlyNamed": "Schreibgeschützt · {device}",
  "settings.connection.device.readOnly": "Schreibgeschützt",

  // --- settings.update (update-check-control + footer update banner) ---
  "settings.update.title": "Aktualisierungen",
  "settings.update.check.prompt": "Auf neue Collie-Versionen prüfen.",
  "settings.update.check.running": "Version v{current}",
  "settings.update.check.runningChecked": "Version v{current} · Geprüft {checked}",
  "settings.update.action": "Nach Updates suchen",
  "settings.update.checking": "Wird geprüft…",
  "settings.update.error": "Prüfung fehlgeschlagen.",
  "settings.update.upToDate": "Aktuell",

  // --- settings.typeface ---
  "settings.typeface.title": "Schriftart",
  "settings.typeface.description": "Oberflächenschrift auf diesem Gerät.",
  "settings.typeface.family": "Schriftfamilie",
  "settings.typeface.system": "Systemstandard",
  "settings.typeface.note.system": "Systemschrift des Geräts. Kein zusätzlicher Download.",
  "settings.typeface.note.grotesk": "Eigene Collie-Schrift, abgestimmt auf das Logo.",
  "settings.typeface.note.aldrich": "Nur eine Schriftstärke: Fetter Text wird wie normaler Text dargestellt.",
  "settings.typeface.note.operator": "Vom Betreiber dieser Collie-Instanz hinterlegt.",

  // --- settings.fonts ---
  "settings.fonts.title": "Terminal-Schrift",
  "settings.fonts.description": "Schrift für Terminal-Spiegel und Eingabefeld auf diesem Gerät.",
  "settings.fonts.family": "Schriftfamilie",
  "settings.fonts.size": "Terminal-Text",
  "settings.fonts.draftSize": "Eingabe-Text",
  "settings.fonts.draftSize.hint":
    "Unter iOS fest auf 16 px gesetzt, da Safari bei kleineren Schriftgrößen automatisch heranzoomt und nicht zurücksetzt.",
  "settings.fonts.draftSize.decrease": "Schriftgröße der Eingabe verringern",
  "settings.fonts.draftSize.increase": "Schriftgröße der Eingabe erhöhen",
  "settings.fonts.system": "Systemstandard",

  // --- settings.display (mirror display prefs, behind the composer's ⚙ dock) ---
  "settings.display.wrap.label": "Zeilenumbruch",
  "settings.display.wrap.hint":
    "Deaktiviert: Das ganze Pane bleibt spaltentreu und wird horizontal gescrollt. Für eine Tabelle ist das nicht mehr nötig: Bei aktivem Zeilenumbruch scrollt eine Tabelle für sich.",
  "settings.display.tapToType.label": "Tippen zum Schreiben",
  "settings.display.tapToType.hint":
    "Aktiv: Antippen des Spiegels öffnet überall die Tastatur. Deaktiviert: Spiegel bleibt Textanzeige, Tastatur öffnet nur im Eingabefeld.",
  "settings.display.fullReply.label": "Vollständige letzte Antwort",
  "settings.display.fullReply.hint":
    "Das Terminal eines Agenten hat keinen Verlaufspuffer, daher fehlt bei langen Antworten der Anfang. Aktiv: Die Antwort erscheint vollständig aus dem Protokoll des Agenten und ersetzt die abgeschnittenen Zeilen.",
  "settings.display.rawTerminal.label": "Rohes Terminal",
  "settings.display.rawTerminal.hint":
    "Zeigt den reinen Terminal-Puffer ohne Buttons, Rahmen oder Statusleisten. Gedacht für falsch dargestellte TUI-Dialoge zur manuellen Tastensteuerung.",
  "settings.display.noInvert.label": "Dieses Pane nativ darstellen",
  "settings.display.noInvert.hint":
    "Überspringt die Invertierung im hellen Theme nur für dieses Pane. Aktiviere es, wenn ein Agent ein HELLES Theme nutzt und der Spiegel ihn dunkel darstellt; lass es aus, wenn das Pane richtig aussieht.",
  "settings.display.textSize.label": "Textgröße",
  "settings.display.textSize.decrease": "Schriftgröße verringern",
  "settings.display.textSize.increase": "Schriftgröße erhöhen",

  // --- settings.buildStamp ---
  "settings.buildStamp.tapToUpdate": "Neuer Build verfügbar, zum Aktualisieren antippen",
  "settings.buildStamp.updating": "Wird aktualisiert…",

  // --- composer (the reply box + its Keys/Quick/Display docks) ---
  "composer.dock.closeAria": "{title} schließen",
  "composer.controls.label": "Steuerung",
  "composer.controls.keys": "Tasten",
  "composer.controls.typeAria": "Ins Terminal schreiben",
  "composer.controls.type": "Tippen",
  "composer.controls.quick": "Schnell",
  "composer.controls.agent": "Agent",
  "composer.controls.displayAria": "Anzeigeeinstellungen",
  "composer.controls.display": "Anzeige",
  "composer.sentPreview.label": "Gesendet:",
  "composer.placeholder.gone": "Pane existiert nicht mehr",
  "composer.placeholder.readOnly": "Schreibgeschützt: Gerät nicht autorisiert",
  "composer.placeholder.noMuxSend": "Eingabe in dieses Terminal nicht möglich",
  "composer.placeholder.direct": "Ins Terminal eingeben…",
  "composer.placeholder.shell": "Shell-Befehl eingeben…",
  "composer.placeholder.reply": "Antwort eingeben…",
  "composer.mic.unavailable": "Spracheingabe nicht verfügbar",
  "composer.mic.stopAria": "Aufnahme beenden",
  "composer.mic.recordAria": "Sprachnachricht aufnehmen",
  "composer.mic.transcribing": "Transkription läuft…",
  "composer.mic.recording": "Aufnahme: {elapsed}",
  "composer.mic.handsFreeHint": "Wird beim Beenden gesendet",
  "composer.mic.manualHint": "Wird in das Eingabefeld eingefügt",
  "composer.mic.stop": "Stopp",
  "composer.mic.discardAria": "Aufnahme verwerfen",
  "composer.attach.aria": "Datei anhängen",
  "composer.attach.title": "Anhängen",
  "composer.attach.photos": "Fotos",
  "composer.attach.files": "Dateien",
  "composer.attach.listAria": "Anhänge",
  "composer.attach.removeAria": "{name} entfernen",
  "composer.attach.inFront": "Seine Markierung fehlt in Ihrem Text, daher setzt Senden {name} voran.",
  "composer.send.typeAnyway": "Trotzdem tippen",
  "composer.send.reallySend": "Senden bestätigen",
  "composer.send.stopTypingAria": "Eingabe ins Terminal abbrechen",
  "composer.send.sendAria": "Senden",
  "composer.draft.tooLong":
    "Zu lang für einen dauerhaften Entwurf. Bleibt beim Pane-Wechsel erhalten, geht aber beim Beenden der App verloren.",
  "composer.status.dialogWaiting": "Ein Dialog ist geöffnet. Erst antworten, dann senden.",
  "composer.status.unreadDialog":
    "Collie kann diesen Dialog nicht lesen. {key} steht auf der Karte. Zum Tippen erneut auf Senden tippen.", // wordsmith
  "composer.status.paneNotWritable": "Pane ist nicht mehr beschreibbar. Nichts gesendet.",
  "composer.status.inputChanged":
    "Eingabefeld hat sich beim Leeren geändert. Es wurde nichts getippt. Pane prüfen.",
  "composer.status.clearFailed": "Terminal-Eingabe konnte nicht geleert werden",
  "composer.status.sent": "Gesendet ✓",
  "composer.status.tapAgainToType": "{error} Erneut tippen, um die Eingabe trotzdem zu senden.",
  "composer.discard.confirmKeys.one": "Erneut tippen, um {count} wartende Taste zu verwerfen",
  "composer.discard.confirmKeys.other": "Erneut tippen, um {count} wartende Tasten zu verwerfen",
  "composer.destructive.confirm": "Destruktiv: {reason}. Erneut tippen zum Bestätigen.",
  "composer.destructive.confirmOnHost":
    "Destruktiv: {reason} auf {host}. Erneut tippen zum Bestätigen.",
  "composer.upload.success": "Datei angehängt",
  "composer.upload.tooLarge": "Die Datei ist größer als {max} MB, das Limit für diesen Collie.",
  "composer.upload.badType": "Collie kann {name} nicht anhängen.",
  "composer.noEcho.title": "Passwortabfrage ohne Echo",
  "composer.noEcho.noLiveTyped":
    "Der Text steht unbestätigt im Pane. Da diese Ansicht nicht live ist, kann von hier aus nichts gesendet werden. Die Eingabe direkt im Terminal beantworten.",
  "composer.noEcho.noLiveUntyped":
    "Es wurde nichts getippt. Diese Ansicht ist nicht live, passende Tasten können von hier aus nicht übermittelt werden.",
  "composer.noEcho.liveTyped":
    "Der Text steht bereits im Pane. Da er nicht bestätigt werden konnte, wurde er nicht abgeschickt. Im Tippen-Modus Enter drücken und nicht erneut senden.",
  "composer.noEcho.liveUntyped":
    "Senden bestätigt eingegebenen Text, aber diese Abfrage liefert kein Echo. Der Tippen-Modus leitet Tasten direkt weiter, inklusive Enter.",
  "composer.noEcho.useType": "Tippen-Modus nutzen",
  "composer.noEcho.dismissAria": "Passworthinweis verwerfen",
  "composer.draftPreview.title": "Entwurf im Terminal",
  "composer.draftPreview.takeOver": "Übernehmen",
  "composer.draftPreview.dismissAria": "Hinweis zum Terminal-Entwurf schließen",

  // --- sendMode (the armed "typing straight through" indicator) ---
  "sendMode.armed.title": "Eingabe ins Terminal",
  "sendMode.armed.hint": "Tastatureingaben werden direkt weitergeleitet",
  "sendMode.armed.stop": "Stopp",

  // --- chat (the pane view shell: header, mirror, switcher) ---
  "chat.zen.label": "Zen-Modus",
  // The floating pill is the ONE way out of zen, and it carries no words — only the glyph.
  "chat.zen.exitAria": "Zen-Modus beenden",
  "chat.strips.hide.both": "Tabs und Panes ausblenden",
  "chat.strips.hide.tabs": "Tabs ausblenden",
  "chat.strips.hide.panes": "Panes ausblenden",
  "chat.strips.show.both": "Tabs und Panes anzeigen. {tabs}, {panes} ausgeblendet.",
  "chat.strips.show.tabs": "Tabs anzeigen. {tabs} ausgeblendet.",
  "chat.strips.show.panes": "Panes anzeigen. {panes} ausgeblendet.",
  "chat.find.label": "In Ausgabe suchen",
  "chat.history.label": "Verlauf",
  "chat.paneMenu.aria": "Pane-Aktionen",
  "chat.header.openOverviewAria": "Übersicht für {workspace} öffnen{status}",
  "chat.header.statusAria": ", {label}",
  "chat.header.agentGone": "(Agent nicht erreichbar)",
  "chat.scrollback.showHistory": "Gesamten Verlauf anzeigen",
  "chat.scrollback.loadOlder": "Ältere Einträge laden",
  "chat.scrollback.loading": "Wird geladen…",
  "chat.scrollback.noSessionReported":
    "{agent} hat keine Sitzung an Herdr gemeldet. Herdr-Integration installieren oder aktualisieren und den Agenten in diesem Pane neu starten.",
  "chat.fullReply.title": "Vollständige Antwort",
  "chat.fullReply.fromTranscript": "aus dem Protokoll",
  "chat.fullReply.showingTerminal": "Terminal wird gezeigt",
  "chat.output.empty": "(keine neue Ausgabe)",
  "chat.switcher.aria": "Pane wechseln",
  "chat.switcher.ariaNeedsYou": "Pane wechseln, ein anderes Pane braucht dich",
  "chat.switcher.title": "Pane wechseln",
  "chat.switcher.launch.here": "hier",
  "chat.status.feedbackSent": "Feedback gesendet",
  "chat.status.sent": "Gesendet",
  "chat.status.menuChanged": "Menü geändert, Aktualisierung läuft",
  "chat.status.sendFailed": "Senden fehlgeschlagen",
  "chat.status.wizardChanged": "Assistent geändert, Aktualisierung läuft",
  "chat.status.noteSaved": "Notiz gespeichert",
  "chat.status.noteRemoved": "Notiz entfernt",
  "chat.status.dialogChanged": "Dialog geändert, Aktualisierung läuft",
  "chat.status.selectionChanged": "Auswahl geändert, Aktualisierung läuft",
  "chat.status.screenChanged": "Bildschirm geändert, Aktualisierung läuft",
  "chat.status.readOnly": "Schreibgeschützt: Gerät nicht autorisiert",

  // --- prompt (the native prompt-select / plan-feedback block) ---
  "prompt.family.select": "Option wählen",
  "prompt.family.permission": "Berechtigung erforderlich",
  "prompt.family.trust": "Diesem Ordner vertrauen",
  "prompt.family.plan": "Plan prüfen",
  "prompt.sendingAria": "Wird gesendet",
  "prompt.feedback.cancel": "Abbrechen",
  "prompt.feedback.typedAria": "Feedback im Terminal",
  "prompt.feedback.planChange.offer": "Änderungen an Claude übermitteln",
  "prompt.feedback.planChange.editorLabel": "Gewünschte Änderungen",
  "prompt.feedback.planChange.textAria": "Feedbacktext",
  "prompt.feedback.planChange.placeholder": "Gewünschte Anpassungen beschreiben…",
  "prompt.feedback.planChange.help":
    "Sendet den Plan mit Anmerkungen zurück. Claude plant weiter, anstatt mit der Ausführung zu beginnen.",
  "prompt.feedback.planChange.send": "Feedback senden",
  "prompt.feedback.planChange.sending": "Feedback wird gesendet…",
  "prompt.feedback.planChange.focused":
    "Das Feedback-Feld hat den Fokus im Terminal. Tastatureingaben schreiben in das Feld, anstatt Aktionen auszulösen. Nach dem Schließen sind die Schaltflächen wieder aktiv.",
  "prompt.feedback.planChange.typedPrefix": "Feedback-Eingabe im Terminal: ",
  "prompt.feedback.freeText.focused":
    "Die Freitextzeile hat den Fokus im Terminal. Tastatureingaben schreiben in das Feld, anstatt Aktionen auszulösen. Nach dem Schließen sind die Schaltflächen wieder aktiv.",
  "prompt.feedback.freeText.typedPrefix": "Eigene Eingabe im Terminal: ",

  // --- paneSettings (one pane's own preferences; today the prompt-cache warning, ADR 0042) ---
  "paneSettings.title": "Pane-Einstellungen",
  "paneSettings.cacheWatch.label": "Warnen, bevor der Cache dieses Panes inaktiv wird",
  "paneSettings.cacheWatch.hint": "etwa {minutes} Minuten vor dem Ablauf",
  "paneSettings.cacheWatch.pushOff": "Aktivieren Sie zuerst Benachrichtigungen für dieses Gerät in den Einstellungen.",
  "paneSettings.cacheWatch.globalOn": "Die Einstellungen warnen vor jedem Pane, dieses ist also abgedeckt.",
  "paneSettings.cacheWatch.noSession": "Der Agent dieses Panes benennt keine Sitzung, es gibt also nichts zu beobachten.",

  // --- paneActions (long-press sheet: rename / close a pane) ---
  "paneActions.title.fallback": "Pane",
  "paneActions.settings.label": "Pane-Einstellungen",
  "paneActions.readOnly": "Nur Lesezugriff: Dieses Gerät darf Panes weder umbenennen noch schließen.",
  "paneActions.rename.label": "Umbenennen",
  "paneActions.rename.placeholder": "Pane-Name",
  "paneActions.close.label": "Pane schließen",
  "paneActions.close.confirm": "Zum Schließen erneut tippen",
  "paneActions.close.closing": "Wird geschlossen…",
  // TODO(translation): English changed from "Show in terminal" to "Focus in {mux}" — needs a
  // translator's call on the verb ("focus") and where a multiplexer name sits in a German
  // sentence. Kept the old "show" wording for now rather than guess; `{mux}` is unused here.
  "paneActions.focus.labelWithMux": "Im Terminal anzeigen",
  "paneActions.focus.labelFallback": "Im Terminal fokussieren",
  "paneActions.focus.done": "Im Terminal fokussiert",
  "paneActions.focus.failed": "Fokussieren im Terminal fehlgeschlagen",
  "paneActions.empty.fallback": "Dieser Multiplexer unterstützt keine Pane-Aktionen.",
  "paneActions.status.renamed": "Umbenannt",
  "paneActions.status.labelCleared": "Label entfernt",
  "paneActions.status.renameFailed": "Umbenennen fehlgeschlagen",
  "paneActions.status.closeFailed": "Schließen fehlgeschlagen",

  // --- keys (the inline Keys tray + its staging strip) ---
  "keys.presets.label": "Voreinstellungen",
  "keys.fkeys.label": "F-Tasten",
  "keys.confirm.label": "Bestätigen",
  "keys.queue.removeAria": "{label} entfernen",
  "keys.queue.charPlaceholder": "Taste",
  "keys.queue.charAria": "Taste für Kombination eingeben",
  "keys.queue.send": "Senden",
  "keys.queue.clearAria": "Warteschlange leeren",

  // --- nav (app header, Collie mark, settings gear) ---
  "nav.settings.aria": "Einstellungen",
  "nav.home.aria.default": "Collie-Startseite",
  "nav.home.aria.lost": "Collie-Startseite: nicht verbunden",
  "nav.home.aria.reconnecting": "Collie-Startseite: verbindet neu",
  "nav.mux.onPrefix": "auf",
  "nav.prereleaseTitle": "Vorabversion: {version}",

  // --- home (dashboard herd list) ---
  "home.empty.disconnected": "Nicht verbunden",
  "home.empty.disconnectedAt": "Nicht verbunden, zuletzt aktiv: {time}",
  "home.empty.noAgents": "Keine aktiven Agenten.",
  "home.empty.waiting": "Warten auf Herdr...",
  "home.empty.panesHint": "Panes befinden sich unter Spaces.",
  "home.allClear": "Kein Handlungsbedarf",
  "home.workspace.paneCount.one": "{count} Pane",
  "home.workspace.paneCount.other": "{count} Panes",
  "home.workspace.hidden": "ausgeblendet",
  "home.sidebar.shells": "Shells",
  "home.sidebar.paneActionsTitle": "Pane-Aktionen anzeigen",
  "home.row.tabPosition": "Tab {n}",
  "home.row.unseen": "ungesehen",
  "home.tabs.aria": "Dashboard-Ansichten",
  "home.tabs.panes": "Bereiche",
  "home.tabs.focus": "Fokus",
  "home.tabs.blocked.one": "{count} blockiert",
  "home.tabs.blocked.other": "{count} blockiert",
  "home.tabs.unseen": "Beendete Bereiche ungesehen",
  "home.changes.listAria": "Änderungen nach Arbeitsbereich",
  "home.changes.loading": "Wird gelesen…",
  "home.changes.clean": "Keine Änderungen",
  "home.changes.noFolder": "Kein Ordner",
  "home.changes.unavailable": "Änderungen können nicht gelesen werden",
  "home.changes.files.one": "{count} Datei",
  "home.changes.files.other": "{count} Dateien",

  // --- status (triage sections, status labels, counts) ---
  "status.section.needsYou": "Eingabe erforderlich",
  "status.section.readyUnseen": "Bereit · Ungesehen",
  "status.section.working": "In Arbeit",
  "status.section.recent": "Zuletzt",
  "status.label.blocked": "wartet auf Eingabe",
  "status.label.working": "läuft",
  "status.label.idle": "inaktiv",
  "status.label.done": "abgeschlossen",
  "status.label.unknown": "unbekannt",
  "status.count.needsYou.one": "{count} wartet auf Eingabe",
  "status.count.needsYou.other": "{count} warten auf Eingabe",
  "status.count.working.one": "{count} läuft",
  "status.count.working.other": "{count} laufen",
  "status.shellBadge": "Shell",
  "status.dismissAria": "Verwerfen",
  "status.detailAria": "Vollständige Nachricht anzeigen",
  "status.detail.title": "Was schiefgelaufen ist",
  "status.detail.copy": "Kopieren",
  "status.detail.copied": "Kopiert",
  "status.detail.dismiss": "Schließen",

  // --- space (spaces overview/strip/view, tabs, panes, new-space) ---
  "space.overview.title": "Spaces",
  "space.overview.new.aria": "Neuer Space",
  "space.overview.filter.placeholder": "Spaces filtern…",
  "space.overview.filter.aria": "Spaces filtern",
  "space.overview.empty.none": "Keine Spaces vorhanden.",
  "space.overview.empty.noMatch": "Kein Space entspricht „{query}“.",
  "space.overview.needsYou.one": "{count} Space erfordert Aufmerksamkeit",
  "space.overview.needsYou.other": "{count} Spaces erfordern Aufmerksamkeit",
  "space.overview.paneCount.one": "{count} Pane",
  "space.overview.paneCount.other": "{count} Panes",
  "space.strip.back": "Zurück",
  "space.strip.title": "Spaces",
  "space.strip.all": "Alle",
  "space.view.tabCount.one": "{count} Tab",
  "space.view.tabCount.other": "{count} Tabs",
  "space.view.paneCount.one": "{count} Pane",
  "space.view.paneCount.other": "{count} Panes",
  "space.view.emptyTab": "(leerer Tab)",
  "space.view.noPanesInTab": "Dieser Tab enthält keine Panes.",
  "space.view.noPanesInSpace": "Dieser Space enthält keine Panes.",
  "space.tabStrip.title": "Tabs",
  "space.tabStrip.all": "Alle",
  "space.tabStrip.new.aria": "Neuer Tab",
  "space.paneStrip.title": "Panes",
  "space.new.title": "Neuer Space",
  "space.new.dir.label": "Verzeichnis (optional)",
  "space.new.dir.placeholder": "~ (Home-Verzeichnis)",
  "space.new.label.label": "Beschriftung (optional)",
  "space.new.label.placeholder": "Space benennen",
  "space.new.create": "Space erstellen und Shell öffnen",
  "space.tab.titleFallback": "Tab",
  "space.tab.titleWithLabel": "Tab {label}",
  "space.tab.readOnly": "Schreibgeschützt. Dieses Gerät darf Tabs nicht umbenennen oder schließen.",
  "space.tab.hostBlockSuffix": "{hostBlock}: Umbenennen und Schließen erst nach Antwort möglich.",
  "space.tab.rename": "Umbenennen",
  "space.tab.close": "Tab schließen",
  "space.tab.closing": "Wird geschlossen…",
  "space.tab.closeConfirm.one": "Erneut tippen, um {count} Pane zu schließen",
  "space.tab.closeConfirm.other": "Erneut tippen, um {count} Panes zu schließen",
  "space.tab.closeConfirmPlain": "Erneut tippen zum Schließen",
  "space.tab.empty.fallback": "Dieser Multiplexer unterstützt keine Tab-Aktionen.",
  "space.tab.placeholder": "Tab benennen",
  "space.tab.renamed": "Umbenannt",
  "space.tab.renameFailed": "Umbenennen fehlgeschlagen",
  "space.tab.closeFailed": "Schließen fehlgeschlagen",
  "space.tab.closed": "Tab geschlossen",
  "space.readOnly.notPaired": "Nicht gekoppelt. Dieses Gerät in den Einstellungen koppeln.",
  "space.readOnly.deviceUnauthorised": "Schreibgeschützt: Gerät nicht autorisiert",
  "space.create.ready": "Neuer {what} bereit. Agent starten.",
  "space.noun.tab": "Tab",
  "space.noun.space": "Space",

  // --- actionSheet (shared rename/back/save rows behind pane + tab long-press sheets) ---
  "actionSheet.back": "Zurück",
  "actionSheet.label": "Bezeichnung",
  "actionSheet.save": "Speichern",

  // --- commands (agent command palette) ---
  "commands.title": "Agent-Befehle",
  "commands.search.placeholder": "{count} Befehle durchsuchen…",
  "commands.common.hint": "Häufig · Tippen, um alle {count} zu durchsuchen",
  "commands.empty": "Keine Befehle für „{query}“ gefunden.",
  "commands.confirm": "Bestätigen",

  // --- harnessBar (the row of the running agent's own commands, above the keys) ---
  // Slash commands are NEVER translated — they are wire text the harness parses — and neither is an
  // operator's own `bar_label`. Only these labels are.
  "harnessBar.label": "Harness-Tastenkürzel",
  "harnessBar.model": "Modell",
  "harnessBar.effort": "Aufwand",
  "harnessBar.compact": "Kompakt",
  "harnessBar.resume": "Fortsetzen",
  "harnessBar.tree": "Baum",
  "harnessBar.confirmAria": "Erneut tippen, um {command} zu bestätigen",

  // --- quickActions (one-tap reply dock) ---
  "quickActions.group.confirm": "Bestätigen",
  "quickActions.group.common": "Häufig",

  // --- find (the in-mirror / in-history find bar) ---
  "find.placeholder": "In {subject} suchen…",
  "find.aria": "In {subject} suchen",
  "find.prevAria": "Vorheriger Treffer",
  "find.nextAria": "Nächster Treffer",
  "find.closeAria": "Suche schließen",
  "find.subject.output": "Ausgabe",
  "find.subject.history": "Verlauf",

  // --- connection (banner, read-only strip, host chip/stale banner, session/server switchers) ---
  "connection.auth.message": "Zugriff verweigert. Es liegt kein Verbindungsproblem vor.",
  "connection.auth.signIn": "Anmelden",
  "connection.reload.aria": "Neu laden",
  "connection.retry": "Erneut versuchen",
  "common.closeAria": "Schließen",
  "common.scrollToLatestAria": "Zum Neuesten scrollen",
  "connection.connected": "Verbunden",
  "connection.reconnecting": "Verbindung wird wiederhergestellt…",
  "connection.herdrDown": "Herdr läuft auf dem Host nicht",
  "connection.offlineCantReach": "Offline: Collie ist nicht erreichbar",
  "connection.cantReach": "Collie ist nicht erreichbar",
  "connection.withLastSeen": "{cause}, zuletzt gesehen {time}",
  "connection.readOnly.notPaired": "Nicht gekoppelt. Gerät in den Einstellungen koppeln, um Eingaben an Agenten zu senden.",
  "connection.readOnly.device": "Schreibgeschützt: Dieses Gerät darf keine Eingaben an Agenten senden{deviceSuffix}.",
  "connection.host.lastSeen": "zuletzt gesehen {time}",
  "connection.host.neverSeen": "nie gesehen",
  "connection.host.unreachablePlain": "nicht erreichbar",
  "connection.host.unreachableSuffix": "nicht erreichbar · {label}",
  "connection.host.incompatible": "inkompatibel",
  "connection.host.lead": "Lead",
  "connection.host.onPrefix": "auf",
  "connection.host.ariaSends": "Sendet an Host: {name}{unreachable}",
  "connection.host.ariaHost": "Host: {name}{unreachable}",
  "connection.host.ariaUnreachableSuffix": " (nicht erreichbar)",
  "connection.host.ariaSuffix": " ({word})",
  "connection.host.reconnecting": "verbindet neu",
  "connection.host.attention": "erfordert Aufmerksamkeit",
  "connection.host.reconnectingSuffix": "verbindet neu · {label}",
  "connection.host.attentionSuffix": "erfordert Aufmerksamkeit · {label}",
  "connection.host.reconnectingAction": "Der Lead versucht es noch. Nichts zu tun.",
  "connection.host.attentionAction": "Erneutes Versuchen hilft hier nicht. Diese Maschine prüfen.",
  "connection.stale.incompatible": "{name} verwendet eine inkompatible Collie-Version",
  "connection.stale.unreachable": "{name} ist nicht erreichbar · {label}",
  "connection.stale.nothingCached": "Für diesen Rechner sind noch keine Daten zwischengespeichert.",
  "connection.stale.showingLastKnown":
    "Zeigt den letzten bekannten Stand. Eingaben werden abgewiesen, bis der Rechner antwortet.",
  "connection.stale.waitingFirst": "Noch keine Daten von {name}. Warte auf erste Antwort.",
  "connection.stale.messageTemplate": "{reason}. {detail}",
  "connection.session.title": "Sitzungen",
  "connection.session.aria": "Sitzung: {name}. Sitzung wechseln",
  "connection.session.primary": "primär",
  "connection.session.unreachable": "nicht erreichbar",
  "connection.session.ariaIn": "In Sitzung: {name}",
  "connection.session.all": "Alle Sitzungen",
  "connection.session.allDescription": "Alle Sitzungen dieses Rechners in einer Liste",
  "connection.session.allAria": "Alle Sitzungen werden angezeigt. Sitzung wechseln",
  "connection.server.title": "Rechner",
  "connection.server.aria": "Host: {name}. Host wechseln",


  // --- error (boot splash, route-level error recovery) ---
  "error.boot.connecting": "Verbindung zur Herde wird aufgebaut…",
  "error.boot.title": "Keine Verbindung",
  "error.boot.body": "Collie ist nicht erreichbar. Verbindung zum Host prüfen und erneut versuchen.",
  "error.boot.retry": "Erneut versuchen",
  "error.root.title": "Fehler aufgetreten",
  "error.root.unknown": "Unbekannter Fehler",
  "error.root.reload": "Neu laden",

  // --- idle (the idle-pause cover) ---
  "idle.dialogAria": "Collie pausiert",
  "idle.catchingUp.title": "Synchronisierung",
  "idle.catchingUp.body": "Ruft den aktuellen Zustand der Herde ab.",
  "idle.paused.title": "Pausiert",
  "idle.paused.body":
    "Live-Updates wurden während der Inaktivität gestoppt. Die Ansicht im Hintergrund ist eingefroren. Beim Fortsetzen wird der letzte Stand geladen.",
  "idle.resume": "Zum Fortsetzen tippen",

  // --- pwa (self-update banner) ---
  "pwa.updateAvailable": "Neue Version verfügbar. Zum Aktualisieren tippen.",
  "pwa.updateInstalling": "Neue Version wird heruntergeladen…",

  // --- history (pane transcript route) ---
  "history.unavailable.disabled": "Transkriptverlauf ist auf dieser Bridge deaktiviert (COLLIE_TRANSCRIPT).",
  "history.unavailable.noSession": "Dieses Pane hat keine Agentensitzung, daher gibt es kein Transkript.",
  "history.unavailable.noLog": "Bisher wurde keine Transkriptdatei für die Sitzung dieses Panes gefunden.",
  "history.unavailable.error": "Transkript konnte nicht gelesen werden. Zurückgehen und erneut versuchen.",
  "history.findAria": "Im Verlauf suchen",
  "history.closeAria": "Verlauf schließen",
  "history.title": "Verlauf",
  "history.loadOlder": "Ältere laden",
  "history.loading": "Wird geladen…",
  "history.startClipped": "Beginn des lesbaren Transkripts (Log am Leselimit abgeschnitten)",
  "history.startOfConversation": "Beginn der Konversation",
  "history.prevMessageAria": "Vorherige gesendete Nachricht",
  "history.nextMessageAria": "Nächste gesendete Nachricht",
  "history.loadOlderFailed": "Älterer Verlauf konnte nicht geladen werden",

  // --- transcript (transcript-view turn rendering) ---
  "transcript.summaryLabel": "Kontext komprimiert",
  "transcript.systemLabel": "System",
  "transcript.youLabel": "Du",
  "transcript.agentFallback": "Agent",
  "transcript.outputTruncated": "… Ausgabe gekürzt",
  "transcript.truncated": "… gekürzt",
  "transcript.toolImageAlt": "Werkzeugausgabe",
  "transcript.attachmentAlt": "Anhang",

  // --- mirror (terminal graphics in the pane mirror) ---
  "mirror.blankLines": "[{n} Leerzeilen]",
  "mirror.imageAlt": "Terminal-Grafik",
  "mirror.imageBadge": "[Bild]",
  "mirror.imageMatchedByOrder": "nach Reihenfolge zugeordnet, zum Prüfen den Verlauf öffnen",

  // --- time (relative/clock formatting) ---
  "time.justNow": "gerade eben",
  "time.compact.now": "jetzt",


  // --- dialog (menu / multi-select / wizard / preview-select block renderers) ---
  "dialog.sendingAria": "Wird gesendet",
  // TODO wordsmith
  "dialog.terminalControl": "Terminal",
  // TODO wordsmith
  "dialog.terminalControlAria": "Terminal anstelle dieser Karte anzeigen",
  // TODO wordsmith
  "dialog.backToCard": "Zurück zur Karte",
  // TODO wordsmith
  "dialog.putAwayControl": "Ablegen",
  // TODO wordsmith
  "dialog.putAwayControlAria": "Schaltflächen dieser Karte ausblenden, Terminal behalten",
  // TODO wordsmith
  "dialog.showButtons": "Schaltflächen anzeigen",
  "dialog.previousStepAria": "Vorheriger Schritt",
  "dialog.nextStepAria": "Nächster Schritt",
  "dialog.answeredAria": "Beantwortet",
  "dialog.submitChip": "Absenden",
  "dialog.stepPosition.step": "Schritt {index} von {total}, {label}",
  "dialog.stepPosition.submit": "Schritt {index} von {total}, Absenden",
  "dialog.chooseOption": "Option auswählen",
  "dialog.questionsAria": "Fragen",
  "dialog.reviewAnswers": "Antworten überprüfen",
  "dialog.readySubmit": "Antworten jetzt übermitteln.",
  "dialog.incomplete": "Nicht alle Fragen wurden beantwortet.",
  "dialog.submitAnswers": "Antworten absenden",
  "dialog.cancel": "Abbrechen",
  "dialog.endsQuestionsSuffix": "- beendet den Fragenteil",
  "dialog.autocomplete.title": "Slash-Befehle",
  "dialog.menu.moveUp": "Nach oben",
  "dialog.menu.moveDown": "Nach unten",
  "dialog.menu.leftAria": "Links: {verb} ({label})",
  "dialog.menu.rightAria": "Rechts: {verb} ({label})",
  // TODO wordsmith
  "dialog.menu.levelAria": "{verb} zu {label}",
  // TODO wordsmith
  "dialog.menu.levelCurrentAria": "{label}, aktuell",
  "unreadDialog.caption": "Collie kann diesen Dialog nicht lesen", // wordsmith
  "dialog.preview.currentAnswerAria": "Aktuelle Antwort",
  "dialog.preview.previewedBelowAria": "Vorschau unten",
  "dialog.preview.previewLabel": "Vorschau: {label}",
  "dialog.preview.editingBanner": "Notiz wird im Terminal bearbeitet. Bedienelemente sind nach dem Schließen wieder aktiv.",
  "dialog.preview.noteForQuestion": "Notiz zu dieser Frage",
  "dialog.preview.noteTextAria": "Notiztext",
  "dialog.preview.notePlaceholder": "Kontext zur Antwort hinzufügen...",
  "dialog.preview.saveNote": "Notiz speichern",
  "dialog.preview.editNoteAria": "Notiz bearbeiten",
  "dialog.preview.removeNoteAria": "Notiz entfernen",
  "dialog.preview.noteAria": "Notiz",
  "dialog.preview.addNote": "Notiz zur Antwort hinzufügen",

  // --- reply (the free-text reply race guard, lib/reply-action.ts) ---
  "reply.blocked.noBox":
    "Das Eingabefeld des Agenten ist nicht sichtbar. Vermutlich ist ein Menü oder Dialog geöffnet. Es wurde nichts eingegeben.",
  "reply.blocked.noEcho":
    "Dies ist eine Passwortabfrage. Da keine Zeichenausgabe erfolgt, kann das Senden den Empfang nicht bestätigen. Es wurde nichts eingegeben.",
  "reply.blocked.composerLeft":
    "Das Eingabefeld des Agenten wurde während des Löschens der Zeile geschlossen. Vermutlich ist ein Menü oder Dialog aktiv. Die Nachricht wurde nicht eingegeben.",
  "reply.stalled.noEcho":
    "Dies ist eine Passwortabfrage ohne Zeichenecho. Der Text konnte nicht bestätigt und daher nicht übermittelt werden. Die Eingabe steht bereits im Pane.",
  "reply.stalled.generic":
    "Die Nachricht hat das Eingabefeld nicht erreicht. Vermutlich wartet ein Dialog. Einzelne Tastendrücke zur Bestätigung wurden eventuell verarbeitet. Es wurde nichts gesendet.",

  // --- previewAction (the preview-select dialog's note flow, lib/preview-action.ts) ---
  "previewAction.note.notOpened": "Notizfeld konnte nicht geöffnet werden. Pane prüfen.",
  "previewAction.note.clearFailed": "Bestehende Notiz konnte nicht gelöscht werden. Pane prüfen.",
  "previewAction.note.textFailed": "Notiztext wurde nicht übertragen. Pane prüfen.",
  "previewAction.note.closeFailed": "Notizfeld konnte nicht geschlossen werden. Pane prüfen.",

  // --- promptAction (the plan-feedback flow, lib/prompt-action.ts) ---
  "promptAction.feedback.freeTextUnsupported":
    "Das Freitextfeld dieses Dialogs unterstützt keine Eingabe über Mobilgeräte.",
  "promptAction.feedback.empty": "Keine Daten zum Senden.",
  "promptAction.feedback.boxNotOpened": "Das Feedback-Feld hat sich nicht geöffnet. Pane prüfen.",
  "promptAction.feedback.notArrived": "Das Feedback ist nicht angekommen. Es wurde nichts gesendet.",


  // --- directTyping (the composer's "Type into terminal" mode, hooks/use-direct-typing.ts) ---
  "directTyping.status.draftPending":
    "Entwurf vor der Eingabe ins Terminal senden oder verwerfen.",
  "directTyping.status.armed": "Direkteingabe im Terminal aktiv. Tastenanschläge werden direkt gesendet.",
  "directTyping.status.disarmed": "Zurück zur regulären Eingabe von Antworten.",
  "directTyping.status.interrupted":
    "Direkteingabe im Terminal beendet, da die Pane-Ansicht unterbrochen wurde.",
  "directTyping.status.backgrounded":
    "Direkteingabe im Terminal beendet, da die App in den Hintergrund wechselte.",

  // --- apiError (the bridge's refusals, keyed by the code on the wire) ---
  "apiError.unknown": "Ein Fehler ist aufgetreten. Bitte erneut versuchen.",
  "apiError.reply.not_submitted":
    "Nachricht wurde in das Pane eingefügt, aber nicht gesendet. Bitte Pane vor erneutem Senden prüfen.",
  "apiError.reply.send_failed": "Nachricht konnte nicht gesendet werden: {reason}",
  "apiError.keys.send_failed": "Tasteneingaben konnten nicht gesendet werden: {reason}",
  "apiError.prompt_changed":
    "Terminalinhalt hat sich vor dem Senden geändert. Bitte Pane prüfen.",
  "apiError.prompt.read_failed":
    "Pane konnte vor dem Senden nicht gelesen werden. {mux} meldet: {detail}",
  "apiError.pane.close_failed": "Pane konnte nicht geschlossen werden: {reason}",
  "apiError.pane.rename_failed": "Pane konnte nicht umbenannt werden: {reason}",
  "apiError.pane.focus_failed": "Pane konnte im Terminal nicht fokussiert werden: {reason}",
  "apiError.tab.create_failed": "Tab konnte nicht erstellt werden: {reason}",
  "apiError.tab.rename_failed": "Tab konnte nicht umbenannt werden: {reason}",
  "apiError.tab.close_failed": "Tab konnte nicht geschlossen werden: {reason}",
  "apiError.tab.workspace_required": "Für den neuen Tab wurde kein Space angegeben.",
  "apiError.launch.not_allowlisted": "Dieser Befehl ist kein definierter Launcher",
  "apiError.launch.pane_unknown": "Dieses Pane ist nicht mehr da, nichts wurde gestartet",
  "apiError.workspace.create_failed": "Space konnte nicht erstellt werden: {reason}",
  "apiError.upload.too_large": "Die Datei ist zu groß, maximal sind {maxMb} MB erlaubt.",
  "apiError.upload.no_file": "Es wurde keine Datei übermittelt.",
  "apiError.upload.bad_type": "Collie unterstützt diesen Dateityp nicht: {type}",
  "apiError.upload.write_failed":
    "Datei konnte nicht auf dem Host gespeichert werden: {reason}",
  "apiError.stt.unconfigured": "Spracherkennung ist auf dieser collie-Instanz nicht eingerichtet.",
  "apiError.stt.too_large": "Aufnahme ist zu lang. Bitte eine kürzere Aufnahme wählen.",
  "apiError.stt.bad_format":
    "Audioformat des Browsers wird von Collie nicht unterstützt.",
  "apiError.stt.busy":
    "Zwei Aufnahmen werden bereits verarbeitet. Bitte gleich erneut versuchen.",
  "apiError.stt.unreadable": "Aufnahme konnte nicht gelesen werden.",
  "apiError.stt.empty": "Aufnahme enthält keine Audiodaten.",
  "apiError.stt.provider_failed": "Transkription fehlgeschlagen: {reason}",
  "apiError.pairing.bad_request":
    "Code oder Name ungültig. Namen müssen 1 bis 48 Zeichen lang sein.",
  "apiError.pairing.no_pending": "Kein ausstehender Kopplungscode auf dem Host vorhanden.",
  "apiError.pairing.expired": "Dieser Kopplungscode ist abgelaufen.",
  "apiError.pairing.exhausted": "Zu viele Fehlversuche. Der Kopplungsvorgang wurde abgebrochen.",
  "apiError.pairing.bad_code": "Ungültiger Kopplungscode.",
  "apiError.pairing.duplicate_label": "Ein Gerät mit diesem Namen existiert bereits.",
  "apiError.device.unknown": "Kein gekoppeltes Gerät mit diesem Namen vorhanden.",
  "apiError.cache.pane_unknown": "Dieser Pane ist nicht mehr vorhanden, es wurde nichts geändert.",
  "apiError.cache.no_session": "Der Agent dieses Panes benennt keine Sitzung, daher kann er nicht beobachtet werden.",
  "apiError.session.unknown": "Keine Sitzung namens {session} auf diesem collie vorhanden.",
  // --- worktrees (ADR 0032) ---
  "apiError.worktree.list_failed": "Worktrees konnten nicht aufgelistet werden: {reason}",
  "apiError.worktree.create_failed": "Worktree konnte nicht erstellt werden: {reason}",
  "apiError.worktree.created_not_opened": "Branch wurde erstellt, konnte jedoch nicht geöffnet werden: {reason}",
  "apiError.worktree.open_failed": "Worktree konnte nicht geöffnet werden: {reason}",
  "apiError.worktree.busy": "Ein anderer Worktree-Vorgang läuft noch. Bitte kurz warten.",
  "apiError.worktree.ambiguous_branch": "Branch-Name ist mehrdeutig: {reason}",
  "apiError.worktree.branch_required": "Bitte zuerst einen Branch-Namen angeben.",
  "apiError.worktree.not_a_repo": "Dieser Space liegt in keinem Git-Repository.",
  "worktree.section": "Worktrees",
  "worktree.new": "Neuer Worktree",
  "worktree.branchLabel": "Branch-Name",
  "worktree.branchPlaceholder": "feature/meine-aenderung",
  "worktree.branchesFrom": "Basiert auf {branch}",
  "worktree.create": "Erstellen",
  "worktree.creating": "Wird erstellt…",
  "worktree.open": "Öffnen",
  "worktree.opening": "Wird geöffnet…",
  "worktree.mainCheckout": "Haupt-Repository",
  "worktree.empty": "Keine Worktrees vorhanden.",
  "worktree.detached": "losgelöst",
  "worktree.recoverOpen": "Erstellten Branch öffnen",
  "space.new.tab.plain": "Leertaste",
  "space.new.tab.worktree": "Worktree",
  "space.new.repo.label": "Repository",
  "space.new.host.label": "Host",
  "worktree.orOpenExisting": "Oder bestehenden öffnen",
  // --- apiError.update (POST /api/update refusals, M15/05) ---


  // --- M16/01: the updates page, its crew lines and the Settings row ---
  // The prompt-cache chip and its sheet (M28/02). Mirrored from English verbatim: these are new
  // keys, and a translation is a separate `wordsmith --translate` pass over this file.
  "cache.warm": "Prompt-Cache warm",
  "cache.expiring": "Prompt-Cache läuft ab",
  "cache.cold": "kalt",
  "cache.unknown": "Prompt-Cache nicht bekannt",
  "cache.under1m": "<1m",
  "cache.overridden": "TTL festgelegt in cache-rules.toml",
  "cache.sheet.title": "Prompt-Cache",
  "cache.sheet.rule": "Regel",
  "cache.sheet.ttl": "Bleibt warm für",
  "cache.sheet.ttlMinutes": "{minutes} Min.",
  "cache.sheet.confidence": "Konfidenz",
  "cache.sheet.source": "Gelesen am",
  "cache.sheet.retrieved": "Geprüft",
  "cache.sheet.measured": "Auf dieser Maschine gemessen",
  "cache.sheet.lastRead": "zuletzt gelesen vor {age}",
  "cache.sheet.overridden": "Verschoben durch cache-rules.toml",
  "cache.sheet.thisMachine": "Diese Maschine",
  "cache.sheet.onPeer": "Gelesen auf {host}. Dessen Regelkatalog wird nicht weitergeleitet, daher wird die Quelle hier nicht zitiert.",
  "cache.sheet.reset.pending": "Nach dem letzten Durchgang: {action}. Der nächste Durchgang baut den Cache neu auf.",
  "cache.sheet.reset.cause": "Vor dem letzten Durchgang: {action}. Dieser Durchgang hat den Cache neu aufgebaut.",
  "cache.sheet.state": "Status",
  "cache.sheet.state.warm": "Warm",
  "cache.sheet.state.expiring": "Läuft ab",
  "cache.sheet.state.cold": "Kalt",
  "cache.confidence.documented": "dokumentiert",
  "cache.confidence.reported": "gemeldet",
  "cache.confidence.inferred": "abgeleitet",
  "cache.confidence.observed": "gemessen",
  "updateRibbon.hideNotice": "Hinweis ausblenden",

  // --- tour (the first-run screen) --- ENGLISH, not yet translated.
  "tour.skip": "Überspringen",
  "tour.title": "Collie zeigt die Agents in Ihrem Terminal.",
  // The claim's second sentence, in the three forms the facts can support. {mux} is the
  // multiplexer's display name, {host} the lead machine's crew label; a clause whose fact is missing
  // is dropped rather than filled with a placeholder.
  "tour.lead":
    "Es spiegelt die Panes, die unter {mux} auf {host} laufen. Es zeigt, was auf diesen Bildschirmen zu sehen ist, und führt niemals ein eigenes Terminal aus.",
  "tour.leadNoHost":
    "Es spiegelt die Panes, die unter {mux} laufen. Es zeigt, was auf diesen Bildschirmen zu sehen ist, und führt niemals ein eigenes Terminal aus.",
  "tour.leadNoMux":
    "Es spiegelt die Panes, die in Ihrem Terminal-Multiplexer laufen. Es zeigt, was auf diesen Bildschirmen zu sehen ist, und führt niemals ein eigenes Terminal aus.",

  // Your setup. Every row is a fact this snapshot carries, or the row is absent.
  "tour.setup": "Ihr Setup",
  "tour.setup.panes.one": "{count} Pane",
  "tour.setup.panes.other": "{count} Panes",
  "tour.setup.needsYou.one": "{count} braucht Sie",
  "tour.setup.needsYou.other": "{count} brauchen Sie",
  "tour.setup.noPanes": "Noch keine Panes",
  "tour.setup.machines.one": "{count} Maschine in Ihrer Crew",
  "tour.setup.machines.other": "{count} Maschinen in Ihrer Crew",
  "tour.setup.canType": "Dieses Gerät kann tippen",
  "tour.setup.readOnly": "Dieses Gerät kann nur lesen",
  "tour.setup.pushOff": "Benachrichtigungen sind auf diesem Telefon deaktiviert",

  // Do this next. At most two cards, first match wins, in this order.
  "tour.doNext": "Als Nächstes tun",
  "tour.pair.title": "Dieses Telefon koppeln",
  "tour.pair.body": "Führen Sie collie pair auf dem Host aus und geben Sie den Code dann in den Einstellungen ein.",
  "tour.pair.button": "Koppeln",
  "tour.space.title": "Es läuft noch nichts",
  "tour.space.body": "Starten Sie einen Agent in Ihrem Terminal oder erstellen Sie hier einen Bereich.",
  "tour.space.button": "Neuer Bereich",
  "tour.pushCard.title": "Benachrichtigt werden, wenn ein Pane Sie braucht",
  "tour.pushCard.body": "Collie benachrichtigt Sie, wenn ein Agent blockiert oder fertig ist.",
  "tour.install.title": "Collie auf Ihrem Startbildschirm behalten",
  "tour.install.body": "Es öffnet sich im Vollbildmodus und merkt sich, wo Sie waren.",
  "tour.install.button": "Hinzufügen",
  "tour.push.enable": "Einschalten",
  "tour.push.enabled": "Benachrichtigungen sind für dieses Gerät aktiviert.",

  // What you can do here. The six lines the site sells and the app never said.
  "tour.can": "Was Sie hier tun können",
  "tour.can.mirror": "Lesen Sie den Live-Pane, inklusive Farben.",
  "tour.can.answer": "Beantworten Sie eine Eingabeaufforderung, indem Sie auf deren Karte tippen.",
  "tour.can.type": "Tippen Sie eine Antwort ein oder senden Sie die Tasten Esc, Tab und Ctrl.",
  "tour.can.harness": "Legen Sie Modell und Aufwand über die Aktionsleiste fest.",
  "tour.can.session": "Lesen Sie die gesamte Sitzung, auch über den Scrollback hinaus.",
  "tour.can.crew": "Beobachten Sie jede Maschine in Ihrer Crew über eine einzige URL.",

  // The footer's one button. The first spelling opens the blocked pane; the second closes the sheet.
  "tour.done.pane": "Öffnen Sie den Pane, der Ihre Aufmerksamkeit erfordert",
  "tour.done.dashboard": "Dashboard anzeigen",

  // --- settings.tour ---
  "settings.tour.title": "Den ersten Bildschirm wieder anzeigen",
  "settings.tour.description": "Was Collie tut und wie diese Installation aussieht.",
  "settings.tour.button": "Anzeigen",



  // --- changes (ADR 0065) ---
  "chat.changes.label": "Änderungen",
  "changes.title": "Änderungen",
  "changes.backAria.dashboard": "Zurück zum Dashboard",
  "changes.backAria.workspace": "Zurück zum Arbeitsbereich",
  "changes.backAria.pane": "Zurück zum Bereich",
  "changes.listBackAria": "Zurück zur Liste",
  "changes.refreshAria": "Änderungen aktualisieren",
  "changes.loading": "Änderungen werden gelesen…",
  "changes.empty": "Keine Änderungen seit dem letzten Commit.",
  "changes.unavailable.noFolder": "Collie kann keinen Ordner für diesen Arbeitsbereich finden, daher gibt es keine Änderungen anzuzeigen.",
  "changes.unavailable.noGit": "Git ist auf diesem Rechner nicht installiert.",
  "changes.unavailable.noPane": "Dieser Bereich existiert nicht mehr.",
  "changes.unavailable.noWorkspace": "Dieser Arbeitsbereich existiert nicht mehr.",
  "changes.error": "Die Änderungen konnten nicht gelesen werden. Tippen Sie auf Aktualisieren, um es erneut zu versuchen.",
  "changes.stale": "Wird nicht aktualisiert",
  "changes.truncated": "Die Liste hat ein Limit erreicht, daher fehlen möglicherweise einige Repositories oder Dateien.",
  "changes.bound.depth.one": "Bei {count} Ebene gestoppt, mit Repositories weiter unten.",
  "changes.bound.depth.other": "Bei {count} Ebenen gestoppt, mit Repositories weiter unten.",
  "changes.bound.settings": "Tiefer in den Einstellungen suchen",
  "changes.thisPane": "Dieser Bereich",
  "changes.repoFiles.one": "{name} · {count} Datei",
  "changes.repoFiles.other": "{name} · {count} Dateien",
  "changes.status.M": "Geändert",
  "changes.status.A": "Hinzugefügt",
  "changes.status.D": "Gelöscht",
  "changes.status.R": "Umbenannt",
  "changes.status.untracked": "Unversioniert",
  "changes.binaryShort": "binär",
  "changes.file.binary": "Binärdatei, nicht angezeigt.",
  "changes.file.directory": "Neuer Ordner. Seine Dateien werden nicht einzeln aufgeführt.",
  "changes.file.truncated": "Das Diff endet hier. Es ist zu lang, um vollständig angezeigt zu werden.",
  "changes.file.unknown": "Diese Datei befindet sich nicht mehr in der Liste der Änderungen. Gehen Sie zurück und aktualisieren Sie.",
  "changes.file.gone": "Nicht mehr geändert",
  "changes.file.error": "Dieses Diff konnte nicht gelesen werden.",
  "changes.file.noLines": "Keine Zeilenänderungen.",
  "changes.file.renamedFrom": "Umbenannt von {path}",
  "changes.file.prev": "Vorherige Datei",
  "changes.file.next": "Nächste Datei",
  "changes.layout.aria": "Layout",
  "changes.layout.list": "Liste",
  "changes.layout.tree": "Baum",
  "changes.tree.folderAria.one": "{name}, {count} Datei",
  "changes.tree.folderAria.other": "{name}, {count} Dateien",
  "changes.filter.button": "Dateien filtern",
  "changes.filter.buttonActive": "Dateien filtern, {shown} von {total} angezeigt",
  "changes.filter.placeholder": "Nach Pfad filtern",
  "changes.filter.clearText": "Text löschen",
  "changes.filter.statusAria": "Nach Status filtern",
  "changes.filter.shown": "{shown} von {total} Dateien",
  "changes.filter.none": "Keine passenden Dateien.",
  "changes.filter.clear": "Filter zurücksetzen",
  "changes.commit.show": "Letzten Commit anzeigen",
  "changes.commit.showFor": "Letzten Commit von {name} anzeigen",
  "changes.commit.cleanHeading": "Keine uncommitteten Änderungen",
  "changes.commit.title": "Letzter Commit",
  "changes.commit.backAria": "Zurück zum Commit",
  "changes.commit.loading": "Commit wird gelesen…",
  "changes.commit.error": "Der Commit konnte nicht gelesen werden. Tippen Sie auf Aktualisieren, um es erneut zu versuchen.",
  "changes.commit.noCommit": "Dieses Repository enthält noch keine Commits.",
  "changes.commit.unknown": "Collie kann dieses Repository nicht mehr finden. Gehen Sie zurück und aktualisieren Sie.",
  "changes.commit.empty": "Dieser Commit ändert keine Dateien.",
  "changes.commit.newer": "Ein neuerer Commit ist vorhanden",
  "changes.commit.uncommitted": "Neue nicht committete Änderungen",
  "changes.commit.fileNewer": "Das Repository hat einen neueren Commit. Gehen Sie zurück und laden Sie ihn, um diese Datei zu lesen.",
  "settings.changes.title": "Änderungen",
  "settings.changes.description": "Wie die Änderungsansicht eines Bereichs git-Repositorys findet.",
  "settings.changes.nested.label": "In diesem Ordner nach Repositorys suchen",
  "settings.changes.nested.hint": "Auch Repositorys in Unterordnern des Bereichsordners anzeigen, selbst wenn das übergeordnete Repository sie ignoriert.",
  "settings.changes.depth.label": "Suchtiefe",
  "settings.changes.depth.hint": "Ordnerebenen unterhalb des Bereichsordners.",
  "settings.changes.depth.levels.one": "{count} Ebene",
  "settings.changes.depth.levels.other": "{count} Ebenen",
};
