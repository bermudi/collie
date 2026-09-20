import type { Dictionary } from "./en";

// Spanish. See de.ts for the typing contract.

export const es: Dictionary = {
  "settings.language.title": "Idioma",
  "settings.language.description": "La salida del terminal nunca se traduce.",

  // --- settings (page chrome) ---
  "settings.title": "Ajustes",
  "settings.nav.back": "Atrás",

  // --- settings.theme ---
  "settings.theme.title": "Tema",
  "settings.theme.description": "Seguir la preferencia del sistema o fijar una.",
  "settings.theme.option.system": "Sistema",
  "settings.theme.option.light": "Claro",
  "settings.theme.option.dark": "Oscuro",

  // --- settings.haptics ---
  "settings.haptics.title": "Respuesta háptica",
  "settings.haptics.description": "Vibración breve al presionar teclas o respuestas rápidas.",


  // --- settings.zen ---
  // Availability only: the toggle decides whether the pane menu offers zen at all.
  "settings.install.title": "Instalar aplicación",
  "settings.install.description": "Añade Collie a la pantalla de inicio con ventana dedicada e icono propio.",
  "settings.install.button": "Instalar",
  "settings.install.iosHint": "En iOS o iPadOS, selecciona Compartir y luego «Añadir a pantalla de inicio».",
  "settings.harnessBar.title": "Harness shortcuts",
  "settings.harnessBar.description": "A row of the running agent's own commands above the keys.",
  "settings.zen.title": "Modo zen",
  "settings.zen.description": "Añade una opción al menú de paneles para ocultar todo excepto el terminal.",
  "settings.zen.auto.label": "Activar en horizontal",
  "settings.zen.auto.hint": "Gira el teléfono de lado para abrir el modo zen automáticamente; gíralo de vuelta para cerrarlo.",

  // --- settings.handsFree ---
  "settings.push.title": "Notificaciones push",
  "settings.push.description": "Recibe alertas cuando un agente requiera interacción.",
  "settings.push.reason.insecure": "Push requiere una conexión HTTPS.",
  "settings.push.reason.serverOff": "Push no está configurado en el bridge (faltan claves VAPID).",
  "settings.push.reason.denied":
    "Notificaciones bloqueadas en los permisos del navegador.",
  "settings.push.reason.unsupported": "Este navegador no soporta Web Push.",
  "settings.push.reason.default": "No se pudieron activar las notificaciones push.",
  "settings.push.reason.timeout": "Se agotó el tiempo para configurar las notificaciones. Comprueba que este dispositivo pueda conectarse al servicio push y vuelve a intentarlo.",
  "settings.push.availability.unavailable": "No se pudo comprobar la configuración de notificaciones. Revisa la conexión o inicia sesión de nuevo y vuelve a intentarlo.",
  "settings.push.availability.insecure":
    "No disponible en HTTP. Sirve Collie sobre HTTPS para habilitar push.",
  "settings.push.availability.serverOff":
    "El bridge no tiene claves VAPID configuradas. Push está deshabilitado en el servidor.",
  "settings.push.availability.denied":
    "Notificaciones bloqueadas para este origen. Modifícalo en los ajustes del navegador.",
  "settings.push.availability.unsupported": "Este navegador no soporta notificaciones push.",

  // --- settings.notify ---
  "settings.notify.title": "Reglas de notificación",
  "settings.notify.description": "Aplica a todos los dispositivos vinculados.",
  "settings.notify.blocked.label": "Requiere entrada",
  "settings.notify.blocked.hint": "un agente espera intervención del usuario",
  "settings.notify.done.label": "Finalizado",
  "settings.notify.done.hint": "un agente completa su tarea",
  "settings.notify.updates.label": "Actualizaciones",
  "settings.notify.updates.hint": "hay una nueva versión de Collie disponible",
  "settings.notify.cache.label": "Cache about to go cold",
  "settings.notify.cache.hint":
    "a pane's prompt cache expires in a few minutes; also covers panes you watched one by one",
  "settings.notify.watched.title": "Watched panes",
  "settings.notify.watched.empty": "None yet — open a pane's settings to watch it.",
  "settings.notify.watched.remove": "Remove",
  "settings.notify.watched.removeAria": "Stop watching {label}",

  // --- settings.snooze ---
  "settings.snooze.title": "Pausar avisos",
  "settings.snooze.description.idle": "Suspende todas las notificaciones push temporalmente.",
  "settings.snooze.description.active": "Pausado hasta {time}. Notificaciones silenciadas.",
  "settings.snooze.resume": "Reanudar",
  "settings.snooze.preset.min30": "30m",
  "settings.snooze.preset.hour1": "1h",
  "settings.snooze.preset.hour4": "4h",

  // --- settings.devices ---
  "settings.devices.title": "Dispositivos vinculados",
  "settings.devices.description.enforced":
    "Las operaciones de escritura requieren autenticación. La lectura permanece abierta.",
  "settings.devices.description.open":
    "Sin dispositivos vinculados. Las escrituras no requieren autenticación previa.",
  "settings.devices.pairedAs": "Este dispositivo está vinculado como {device}.",
  "settings.devices.loadError": "Error al consultar los dispositivos vinculados al bridge.",
  "settings.devices.thisDevice": "Este dispositivo",
  "settings.devices.row.meta": "Vinculado {paired} · Última actividad {lastSeen}",
  "settings.devices.revokeError": "No se pudo revocar el dispositivo.",
  "settings.devices.cancel": "Cancelar",
  "settings.devices.unpairSelf": "Desvincular este dispositivo",
  "settings.devices.revoke": "Revocar",
  "settings.devices.revokeAria": "Revocar {label}",
  "settings.devices.pair.title": "Vincular dispositivo",
  "settings.devices.pair.hint":
    "Ejecuta {command} en el host, luego escanea el código que muestra o escríbelo aquí.",
  "settings.devices.pair.codeLabel": "Código de vinculación",
  "settings.devices.pair.codePlaceholder": "8 caracteres",
  "settings.devices.pair.nameLabel": "Nombre del dispositivo",
  "settings.devices.pair.namePlaceholder": "p. ej. mi teléfono",
  "settings.devices.pair.networkError":
    "No se pudo conectar con el bridge. Comprueba la red y vuelve a intentarlo.",
  "settings.devices.pair.failure.noPending":
    "No hay códigos pendientes. Ejecuta `bin/collie pair` en el host para generar uno.",
  "settings.devices.pair.failure.expired":
    "El código ha caducado. Ejecuta `bin/collie pair` en el host para obtener uno nuevo.",
  "settings.devices.pair.failure.exhausted":
    "Demasiados intentos fallidos. La vinculación fue invalidada. Ejecuta `bin/collie pair` en el host para generar otra.",
  "settings.devices.pair.failure.badCode":
    "El código no coincide. Compruébalo e inténtalo de nuevo; unos pocos fallos más y quedará invalidado.",
  "settings.devices.pair.failure.duplicateLabel":
    "Otro dispositivo ya usa ese nombre. Elige otro. El código sigue siendo válido.",
  "settings.devices.pair.failure.badRequest":
    "Código o nombre no válidos. El nombre debe tener entre 1 y 48 caracteres.",

  // --- settings.connection ---
  "settings.connection.title": "Conexión",
  "settings.connection.description": "Diagnóstico de este dispositivo.",
  "settings.connection.row.endpoint": "Punto de conexión",
  "settings.connection.row.secure": "Contexto seguro",
  "settings.connection.row.bridge": "Bridge",
  "settings.connection.row.deviceAccess": "Acceso del dispositivo",
  "settings.connection.row.serverBuild": "Build del servidor",
  "settings.connection.secure.yes": "Sí",
  "settings.connection.secure.no": "No (HTTP sin cifrar)",
  "settings.connection.bridge.connected": "Conectado",
  "settings.connection.bridge.offline": "Herdr desconectado",
  "settings.connection.bridge.connecting": "Conectando…",
  "settings.connection.device.notEnforced": "Sin restricciones",
  "settings.connection.device.fullAccessNamed": "Acceso total · {device}",
  "settings.connection.device.fullAccessLocal": "Acceso total (local)",
  "settings.connection.device.readOnlyNamed": "Solo lectura · {device}",
  "settings.connection.device.readOnly": "Solo lectura",

  // --- settings.update (update-check-control + footer update banner) ---
  "settings.update.title": "Actualizaciones",
  "settings.update.check.prompt": "Comprobar si hay versiones nuevas de Collie.",
  "settings.update.check.running": "Ejecutando v{current}",
  "settings.update.check.runningChecked": "Ejecutando v{current} · comprobado {checked}",
  "settings.update.action": "Buscar actualizaciones",
  "settings.update.checking": "Comprobando…",
  "settings.update.error": "Error al comprobar.",
  "settings.update.upToDate": "Actualizado",
  "settings.updateBanner.restart": "Reinicio del bridge requerido",
  "settings.updateBanner.releaseAvailable": "Collie {version} disponible",
  "settings.updateBanner.majorAvailable": "Collie {version}, nueva versión mayor",
  "settings.updateBanner.copyAria": "Copiar comando: {command}",

  // --- settings.typeface ---
  "settings.typeface.title": "Tipografía",
  "settings.typeface.description": "Fuente de la interfaz en este dispositivo.",
  "settings.typeface.family": "Familia",
  "settings.typeface.system": "Predeterminada del sistema",
  "settings.typeface.note.system": "Fuente del sistema del dispositivo. Sin descargas de red.",
  "settings.typeface.note.grotesk": "Tipografía propia de Collie, diseñada a juego con el logotipo.",
  "settings.typeface.note.aldrich": "Solo incluye un grosor, por lo que el texto en negrita se muestra igual que el normal.",
  "settings.typeface.note.operator": "Añadida por el operador de este collie.",

  // --- settings.fonts ---
  "settings.fonts.title": "Fuente del terminal",
  "settings.fonts.description": "Espejo del terminal y campo de entrada en este dispositivo.",
  "settings.fonts.family": "Familia",
  "settings.fonts.size": "Texto del espejo",
  "settings.fonts.draftSize": "Texto de entrada",
  "settings.fonts.draftSize.hint":
    "iOS fija este valor en 16: Safari amplía la pantalla en campos menores y no restablece el zoom.",
  "settings.fonts.draftSize.decrease": "Reducir tamaño del texto de entrada",
  "settings.fonts.draftSize.increase": "Aumentar tamaño del texto de entrada",
  "settings.fonts.system": "Predeterminada del sistema",

  // --- settings.display (mirror display prefs, behind the composer's ⚙ dock) ---
  "settings.display.wrap.label": "Ajuste de línea",
  "settings.display.wrap.hint":
    "Desactivado desplaza todo el panel manteniendo las columnas. Ya no hace falta para una tabla: con el ajuste activo, una tabla se desplaza por su cuenta.",
  "settings.display.tapToType.label": "Tocar para escribir",
  "settings.display.tapToType.hint":
    "Si esta activo, pulsar en cualquier parte abre el teclado. Si no, funciona como documento de texto y solo el editor abre el teclado.",
  "settings.display.fullReply.label": "Respuesta completa",
  "settings.display.fullReply.hint":
    "La terminal de un agente no guarda historial, así que una respuesta larga pierde su inicio. Si esta activo, se muestra completa desde el registro del agente, en lugar de las lineas que cubre.",
  "settings.display.rawTerminal.label": "Terminal sin formato",
  "settings.display.rawTerminal.hint":
    "Muestra la sesion directa sin botones de interfaz ni barras. Util si un dialogo falla y requiere control manual mediante Teclas.",
  "settings.display.textSize.label": "Tamano del texto",
  "settings.display.textSize.decrease": "Reducir fuente",
  "settings.display.textSize.increase": "Aumentar fuente",

  // --- settings.buildStamp ---
  "settings.buildStamp.tapToUpdate": "Nueva compilacion disponible. Pulsa para actualizar",
  "settings.buildStamp.updating": "Actualizando...",

  // --- composer (the reply box + its Keys/Quick/Display docks) ---
  "composer.dock.closeAria": "Cerrar {title}",
  "composer.controls.label": "Controles",
  "composer.controls.keys": "Teclas",
  "composer.controls.typeAria": "Escribir en la terminal",
  "composer.controls.type": "Escribir",
  "composer.controls.quick": "Rápido",
  "composer.controls.agent": "Agente",
  "composer.controls.displayAria": "Ajustes de pantalla",
  "composer.controls.display": "Pantalla",
  "composer.sentPreview.label": "Enviado:",
  "composer.placeholder.gone": "El panel ya no existe",
  "composer.placeholder.readOnly": "Solo lectura: dispositivo no autorizado",
  "composer.placeholder.noMuxSend": "No es posible escribir en esta terminal",
  "composer.placeholder.direct": "Escribir en la terminal...",
  "composer.placeholder.shell": "Escribir un comando de shell...",
  "composer.placeholder.reply": "Escribir una respuesta...",
  "composer.attach.aria": "Adjuntar archivo",
  "composer.attach.title": "Adjuntar",
  "composer.attach.photos": "Fotos",
  "composer.attach.files": "Archivos",
  "composer.send.typeAnyway": "¿Escribir de todos modos?",
  "composer.send.reallySend": "¿Confirmar envío?",
  "composer.send.stopTypingAria": "Detener escritura en la terminal",
  "composer.send.sendAria": "Enviar",
  "composer.draft.tooLong":
    "Texto demasiado largo para persistir como borrador. Se conserva al cambiar de panel, pero no al cerrar la app.",
  "composer.status.dialogWaiting": "Hay un diálogo pendiente. Respóndelo antes de enviar.",
  "composer.status.paneNotWritable": "El panel ya no admite escritura. No se envió nada.",
  "composer.status.inputChanged":
    "La entrada cambió durante la limpieza y no se escribió nada. Revisa el panel.",
  "composer.status.clearFailed": "No se pudo limpiar la entrada de la terminal",
  "composer.status.sent": "Enviado ✓",
  "composer.status.tapAgainToType": "{error} Pulsa Enviar de nuevo para forzar la escritura.",
  "composer.discard.confirmKeys.one": "Pulsa de nuevo para descartar {count} tecla en cola",
  "composer.discard.confirmKeys.other": "Pulsa de nuevo para descartar {count} teclas en cola",
  "composer.destructive.confirm": "Acción destructiva: {reason}. Pulsa Enviar de nuevo para confirmar.",
  "composer.upload.success": "Archivo añadido, ruta en el mensaje",
  "composer.upload.tooLarge": "El archivo supera los {max} MB, el límite en este collie.",
  "composer.upload.badType": "Collie no puede adjuntar {name}.",
  "composer.upload.successBatch": "{n} archivos añadidos, rutas en el mensaje",
  "composer.upload.mixed": "Añadidos {attached} de {total} — {detail}",
  "composer.upload.nothing": "Nada añadido — {detail}",
  "composer.noEcho.title": "Solicitud de contraseña: sin eco en terminal",
  "composer.noEcho.noLiveTyped":
    "El texto introducido está en el panel sin enviar. Esta vista no está en vivo y no permite enviar datos; responde directamente en la terminal.",
  "composer.noEcho.noLiveUntyped":
    "No se escribió nada. Esta vista no está en vivo y no puede enviar las pulsaciones de teclado correspondientes.",
  "composer.noEcho.liveTyped":
    "El texto introducido ya está en el panel pero no pudo confirmarse, por lo que no se envió. Pulsa Intro en Escribir en lugar de reenviarlo.",
  "composer.noEcho.liveUntyped":
    "Enviar valida la entrada en pantalla, pero este prompt no devuelve eco. Escribir transmite las teclas de forma directa, incluido Intro.",
  "composer.noEcho.useType": "Usar Escribir",
  "composer.noEcho.dismissAria": "Descartar aviso de contraseña",
  "composer.draftPreview.title": "Borrador en la terminal",
  "composer.draftPreview.takeOver": "Retomar",

  // --- sendMode (the armed "typing straight through" indicator) ---
  "sendMode.armed.title": "Escribiendo en la terminal",
  "sendMode.armed.hint": "las teclas se envían directamente",
  "sendMode.armed.stop": "Detener",

  // --- chat (the pane view shell: header, mirror, switcher) ---
  "chat.zen.label": "Modo zen",
  // The floating pill is the ONE way out of zen, and it carries no words — only the glyph.
  "chat.zen.exitAria": "Salir del modo zen",
  "chat.strips.hide.both": "Ocultar pestañas y paneles",
  "chat.strips.hide.tabs": "Ocultar pestañas",
  "chat.strips.hide.panes": "Ocultar paneles",
  "chat.strips.show.both": "Mostrar pestañas y paneles. {tabs}, {panes} ocultos.",
  "chat.strips.show.tabs": "Mostrar pestañas. {tabs} ocultas.",
  "chat.strips.show.panes": "Mostrar paneles. {panes} ocultos.",
  "chat.find.label": "Buscar en la salida",
  "chat.history.label": "Historial de conversación",
  "chat.paneMenu.aria": "Acciones del panel",
  "chat.header.openOverviewAria": "Abrir vista general de {workspace}{status}",
  "chat.header.statusAria": ": {label}",
  "chat.header.agentGone": "(agente desconectado)",
  "chat.scrollback.showHistory": "Mostrar historial completo",
  "chat.scrollback.loadOlder": "Cargar anteriores",
  "chat.scrollback.loading": "Cargando…",
  "chat.fullReply.title": "Respuesta completa",
  "chat.fullReply.fromTranscript": "desde el registro",
  "chat.fullReply.showingTerminal": "mostrando la terminal",
  "chat.output.empty": "(sin salida reciente)",
  "chat.switcher.aria": "Cambiar panel",
  "chat.switcher.ariaNeedsYou": "Cambiar panel, otro panel te necesita",
  "chat.switcher.title": "Cambiar panel",
  "chat.switcher.launch.here": "aquí",
  "chat.status.feedbackSent": "Comentarios enviados",
  "chat.status.sent": "Enviado",
  "chat.status.menuChanged": "Menú modificado: recargando",
  "chat.status.sendFailed": "Error de envío",
  "chat.status.wizardChanged": "Asistente modificado: recargando",
  "chat.status.noteSaved": "Nota guardada",
  "chat.status.noteRemoved": "Nota eliminada",
  "chat.status.dialogChanged": "Diálogo modificado: recargando",
  "chat.status.selectionChanged": "Selección modificada: recargando",
  "chat.status.screenChanged": "Pantalla modificada: recargando",
  "chat.status.readOnly": "Solo lectura: dispositivo no autorizado",

  // --- prompt (the native prompt-select / plan-feedback block) ---
  "prompt.family.select": "Seleccionar una opción",
  "prompt.family.permission": "Permiso requerido",
  "prompt.family.trust": "Confiar en este directorio",
  "prompt.family.plan": "Revisar el plan",
  "prompt.sendingAria": "Enviando",
  "prompt.feedback.cancel": "Cancelar",
  "prompt.feedback.typedAria": "Entrada en la terminal",
  "prompt.feedback.planChange.offer": "Indicar cambios a Claude",
  "prompt.feedback.planChange.editorLabel": "Cambios requeridos para Claude",
  "prompt.feedback.planChange.textAria": "Texto de comentarios",
  "prompt.feedback.planChange.placeholder": "Describe los cambios necesarios...",
  "prompt.feedback.planChange.help":
    "Devuelve el plan con notas. Claude continúa la fase de planificación en lugar de iniciar la ejecución.",
  "prompt.feedback.planChange.send": "Enviar comentarios",
  "prompt.feedback.planChange.sending": "Enviando comentarios...",
  "prompt.feedback.planChange.focused":
    "El foco de entrada está en el campo de la terminal. Los botones no procesan acciones mientras el cuadro siga abierto.",
  "prompt.feedback.planChange.typedPrefix": "Texto de comentario en la terminal: ",
  "prompt.feedback.freeText.focused":
    "El foco de entrada está en la línea de texto de la terminal. Los botones se reactivan al cerrar el campo.",
  "prompt.feedback.freeText.typedPrefix":
    "Respuesta personalizada en la terminal: ",

  // --- paneSettings (one pane's own preferences; today the prompt-cache warning, ADR 0042) ---
  "paneSettings.title": "Pane settings",
  "paneSettings.cacheWatch.label": "Warn me before this pane's cache goes cold",
  "paneSettings.cacheWatch.hint": "about {minutes} minutes before it expires",
  "paneSettings.cacheWatch.pushOff": "Turn notifications on for this device in Settings first.",
  "paneSettings.cacheWatch.globalOn": "Settings warns about every pane, so this one is covered.",
  "paneSettings.cacheWatch.noSession": "This pane's agent names no session, so there is nothing to watch.",

  // --- paneActions (long-press sheet: rename / close a pane) ---
  "paneActions.title.fallback": "Panel",
  "paneActions.settings.label": "Pane settings",
  "paneActions.readOnly": "Solo lectura: este dispositivo no tiene permisos para renombrar o cerrar paneles.",
  "paneActions.rename.label": "Renombrar",
  "paneActions.rename.placeholder": "nombre del panel",
  "paneActions.close.label": "Cerrar panel",
  "paneActions.close.confirm": "Pulsa de nuevo para cerrar",
  "paneActions.close.closing": "Cerrando…",
  // TODO(translation): English changed from "Show in terminal" to "Focus in {mux}" — needs a
  // translator's call on the verb ("focus") and where a multiplexer name sits in a Spanish
  // sentence. Kept the old "show" wording for now rather than guess; `{mux}` is unused here.
  "paneActions.focus.labelWithMux": "Mostrar en la terminal",
  "paneActions.focus.labelFallback": "Enfocar en el terminal",
  "paneActions.focus.done": "Enfocado en el terminal",
  "paneActions.focus.failed": "No se pudo enfocar en el terminal",
  "paneActions.empty.fallback": "Este multiplexor no admite acciones sobre paneles.",
  "paneActions.status.renamed": "Renombrado",
  "paneActions.status.labelCleared": "Etiqueta eliminada",
  "paneActions.status.renameFailed": "Error al renombrar",
  "paneActions.status.closeFailed": "Error al cerrar",

  // --- keys (the inline Keys tray + its staging strip) ---
  "keys.presets.label": "Preajustes",
  "keys.fkeys.label": "Teclas de función",
  "keys.confirm.label": "Confirmar",
  "keys.queue.removeAria": "Eliminar {label}",
  "keys.queue.charPlaceholder": "tecla",
  "keys.queue.charAria": "Introduce una tecla para combinar",
  "keys.queue.send": "Enviar",
  "keys.queue.clearAria": "Vaciar teclas en cola",

  // --- nav (app header, Collie mark, settings gear) ---
  "nav.settings.aria": "Configuración",
  "nav.home.aria.default": "Inicio de Collie",
  "nav.home.aria.lost": "Inicio de Collie (sin conexión)",
  "nav.home.aria.reconnecting": "Inicio de Collie (reconectando)",
  "nav.mux.onPrefix": "en",
  "nav.prereleaseTitle": "Compilación preliminar: {version}",

  // --- home (dashboard herd list) ---
  "home.empty.disconnected": "Desconectado",
  "home.empty.disconnectedAt": "Desconectado. Última conexión: {time}",
  "home.empty.noAgents": "No hay agentes en ejecución.",
  "home.empty.waiting": "Esperando a Herdr...",
  "home.empty.panesHint": "Los paneles están en Espacios.",
  "home.allClear": "Sin tareas pendientes",
  "home.workspace.paneCount.one": "{count} panel",
  "home.workspace.paneCount.other": "{count} paneles",
  "home.workspace.hidden": "oculto",
  "home.sidebar.shells": "Shells",
  "home.sidebar.paneActionsTitle": "Ver acciones del panel",
  "home.row.tabPosition": "pestaña {n}",
  "home.row.unseen": "sin ver",

  // --- status (triage sections, status labels, counts) ---
  "status.section.needsYou": "Requiere atención",
  "status.section.readyUnseen": "Listo · sin revisar",
  "status.section.working": "En ejecución",
  "status.section.recent": "Recientes",
  "status.label.blocked": "requiere atención",
  "status.label.working": "en ejecución",
  "status.label.idle": "inactivo",
  "status.label.done": "completado",
  "status.label.unknown": "desconocido",
  "status.count.needsYou.one": "{count} requiere atención",
  "status.count.needsYou.other": "{count} requieren atención",
  "status.count.working.one": "{count} en ejecución",
  "status.count.working.other": "{count} en ejecución",
  "status.shellBadge": "shell",
  "status.dismissAria": "Descartar",
  "status.detailAria": "Mostrar el mensaje completo",
  "status.detail.title": "Qué salió mal",
  "status.detail.copy": "Copiar",
  "status.detail.copied": "Copiado",
  "status.detail.dismiss": "Cerrar",

  // --- space (spaces overview/strip/view, tabs, panes, new-space) ---
  "space.overview.title": "Espacios",
  "space.overview.new.aria": "Nuevo espacio",
  "space.overview.filter.placeholder": "Filtrar espacios...",
  "space.overview.filter.aria": "Filtrar espacios",
  "space.overview.empty.none": "No hay espacios creados.",
  "space.overview.empty.noMatch": "Sin coincidencias para \"{query}\".",
  "space.overview.needsYou.one": "{count} espacio requiere atencion",
  "space.overview.needsYou.other": "{count} espacios requieren atencion",
  "space.overview.paneCount.one": "{count} panel",
  "space.overview.paneCount.other": "{count} paneles",
  "space.strip.back": "Volver",
  "space.strip.title": "Espacios",
  "space.strip.all": "Todos",
  "space.view.tabCount.one": "{count} pestana",
  "space.view.tabCount.other": "{count} pestanas",
  "space.view.paneCount.one": "{count} panel",
  "space.view.paneCount.other": "{count} paneles",
  "space.view.emptyTab": "(pestana vacia)",
  "space.view.noPanesInTab": "Pestana sin paneles.",
  "space.view.noPanesInSpace": "Espacio sin paneles.",
  "space.tabStrip.title": "Pestanas",
  "space.tabStrip.all": "Todas",
  "space.tabStrip.new.aria": "Nueva pestana",
  "space.paneStrip.title": "Paneles",
  "space.new.title": "Nuevo espacio",
  "space.new.dir.label": "Directorio (opcional)",
  "space.new.dir.placeholder": "~ (directorio personal)",
  "space.new.label.label": "Etiqueta (opcional)",
  "space.new.label.placeholder": "Nombre del espacio",
  "space.new.create": "Crear espacio e iniciar shell",
  "space.tab.titleFallback": "Pestana",
  "space.tab.titleWithLabel": "Pestana {label}",
  "space.tab.readOnly": "Modo lectura. Este dispositivo no tiene permisos para renombrar o cerrar pestanas.",
  "space.tab.rename": "Renombrar",
  "space.tab.close": "Cerrar pestana",
  "space.tab.closing": "Cerrando...",
  "space.tab.closeConfirm.one": "Pulsa de nuevo para cerrar {count} panel",
  "space.tab.closeConfirm.other": "Pulsa de nuevo para cerrar {count} paneles",
  "space.tab.closeConfirmPlain": "Pulsa de nuevo para confirmar el cierre",
  "space.tab.empty.fallback": "El multiplexor no admite acciones en esta pestana.",
  "space.tab.placeholder": "Nombre de la pestana",
  "space.tab.renamed": "Renombrada",
  "space.tab.renameFailed": "Fallo al renombrar",
  "space.tab.closeFailed": "Fallo al cerrar",
  "space.tab.closed": "Pestana cerrada",
  "space.readOnly.notPaired": "Sin emparejar. Vincula este dispositivo en Ajustes",
  "space.readOnly.deviceUnauthorised": "Modo lectura. Dispositivo no autorizado",
  "space.create.ready": "{what} disponible. Inicia el agente",
  "space.noun.tab": "pestana",
  "space.noun.space": "espacio",

  // --- actionSheet (shared rename/back/save rows behind pane + tab long-press sheets) ---
  "actionSheet.back": "Atrás",
  "actionSheet.label": "Etiqueta",
  "actionSheet.save": "Guardar",

  // --- commands (agent command palette) ---
  "commands.title": "Comandos del agente",
  "commands.search.placeholder": "Buscar en {count} comandos...",
  "commands.common.hint": "Comunes. Escriba para buscar los {count}",
  "commands.empty": "Ningún comando coincide con “{query}”.",
  "commands.confirm": "Confirmar",

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
  "quickActions.group.confirm": "confirmar",
  "quickActions.group.common": "comunes",

  // --- find (the in-mirror / in-history find bar) ---
  "find.placeholder": "Buscar en {subject}…",
  "find.aria": "Buscar en {subject}",
  "find.prevAria": "Coincidencia anterior",
  "find.nextAria": "Siguiente coincidencia",
  "find.closeAria": "Cerrar búsqueda",
  "find.subject.output": "la salida",
  "find.subject.history": "el historial",

  // --- connection (banner, read-only strip, host chip/stale banner, session/server switchers) ---
  "connection.auth.message": "Acceso denegado. No es un error de conexión.",
  "connection.auth.signIn": "Iniciar sesión",
  "connection.reload.aria": "Recargar",
  "connection.retry": "Reintentar",
  "common.closeAria": "Cerrar",
  "common.scrollToLatestAria": "Desplazarse a lo más reciente",
  "connection.connected": "Conectado",
  "connection.reconnecting": "Reconectando…",
  "connection.herdrDown": "Herdr no responde en el host",
  "connection.offlineCantReach": "Sin conexión: no se puede conectar con Collie",
  "connection.cantReach": "No se puede conectar con Collie",
  "connection.withLastSeen": "{cause}. Última conexión: {time}",
  "connection.readOnly.notPaired": "Sin vincular. Enlaza este dispositivo en Ajustes para enviar comandos a los agentes.",
  "connection.readOnly.device": "Solo lectura: este dispositivo no tiene permisos para escribir a los agentes{deviceSuffix}.",
  "connection.stale.incompatible": "{name} ejecuta una versión incompatible de Collie",
  "connection.stale.unreachable": "{name} inaccesible · {label}",
  "connection.stale.nothingCached": "No hay datos en caché para esta máquina.",
  "connection.stale.showingLastKnown":
    "Mostrando la última pantalla conocida. Se rechaza cualquier entrada hasta que el host responda.",
  "connection.stale.waitingFirst": "Sin datos de {name}. Esperando su primera respuesta.",
  "connection.stale.messageTemplate": "{reason}. {detail}",
  "connection.session.title": "Sesiones",
  "connection.session.aria": "Sesión: {name}. Cambiar sesión",
  "connection.session.primary": "principal",
  "connection.session.unreachable": "inaccesible",
  "connection.session.all": "Todas las sesiones",
  "connection.session.allDescription": "Lista con todas las sesiones de esta máquina",
  "connection.session.allAria": "Mostrando todas las sesiones. Cambiar sesión",
  "connection.server.title": "Máquinas",
  "connection.server.aria": "Host: {name}. Cambiar host",

  // --- crew ---
  "error.boot.connecting": "Estableciendo conexión...",
  "error.boot.title": "Sin conexión",
  "error.boot.body": "No se puede conectar con Collie. Comprueba la conexión con el host e inténtalo de nuevo.",
  "error.boot.retry": "Reintentar",
  "error.root.title": "Error en la aplicación",
  "error.root.unknown": "Error desconocido",
  "error.root.reload": "Recargar",

  // --- idle (the idle-pause cover) ---
  "idle.dialogAria": "Collie en pausa",
  "idle.catchingUp.title": "Sincronizando",
  "idle.catchingUp.body": "Obteniendo el estado actual de la manada.",
  "idle.paused.title": "En pausa",
  "idle.paused.body":
    "Las actualizaciones en tiempo real se detuvieron por inactividad en la pantalla. La vista de fondo está congelada. Reanuda para continuar donde lo dejaste.",
  "idle.resume": "Pulsa para reanudar",

  // --- pwa (self-update banner) ---
  "pwa.updateAvailable": "Nueva versión. Toca para actualizar.",
  "pwa.updateInstalling": "Downloading the new version…",

  // --- history (pane transcript route) ---
  "history.unavailable.disabled": "El historial de transcripciones está deshabilitado en este bridge (COLLIE_TRANSCRIPT).",
  "history.unavailable.noSession": "Este panel no tiene una sesión de agente. No hay transcripción disponible.",
  "history.unavailable.noLog": "No se encontró el archivo de transcripción para la sesión de este panel.",
  "history.unavailable.error": "No se pudo leer la transcripción. Retroceda e inténtelo de nuevo.",
  "history.findAria": "Buscar en el historial",
  "history.closeAria": "Cerrar historial",
  "history.title": "Historial",
  "history.loadOlder": "Cargar mensajes anteriores",
  "history.loading": "Cargando…",
  "history.startClipped": "Inicio de la transcripción legible (registro truncado por el límite de lectura)",
  "history.startOfConversation": "Inicio de la conversación",
  "history.prevMessageAria": "Mensaje anterior enviado",
  "history.nextMessageAria": "Siguiente mensaje enviado",
  "history.loadOlderFailed": "Error al cargar el historial anterior",

  // --- transcript (transcript-view turn rendering) ---
  "transcript.summaryLabel": "Contexto resumido",
  "transcript.systemLabel": "Sistema",
  "transcript.youLabel": "Usuario",
  "transcript.agentFallback": "agente",
  "transcript.outputTruncated": "[salida truncada]",
  "transcript.truncated": "[truncado]",
  "transcript.toolImageAlt": "Salida de herramienta",
  "transcript.attachmentAlt": "Archivo adjunto",

  // --- mirror (terminal graphics in the pane mirror) ---
  "mirror.blankLines": "[{n} líneas en blanco]",

  // --- time (relative/clock formatting) ---
  "time.justNow": "ahora mismo",
  "time.compact.now": "ahora",

  // --- sync (how fresh the herd on screen is, and asking for a fresher one) ---

  // --- dialog (menu / multi-select / wizard / preview-select block renderers) ---
  "dialog.sendingAria": "Enviando",
  "dialog.previousStepAria": "Paso anterior",
  "dialog.nextStepAria": "Paso siguiente",
  "dialog.answeredAria": "Respondida",
  "dialog.submitChip": "Enviar",
  "dialog.stepPosition.step": "Paso {index} de {total}, {label}",
  "dialog.stepPosition.submit": "Paso {index} de {total}, Enviar",
  "dialog.chooseOption": "Seleccionar una opción",
  "dialog.questionsAria": "Preguntas",
  "dialog.reviewAnswers": "Revisar respuestas",
  "dialog.readySubmit": "Confirmar el envío de respuestas.",
  "dialog.incomplete": "Quedan preguntas sin responder.",
  "dialog.submitAnswers": "Enviar respuestas",
  "dialog.cancel": "Cancelar",
  "dialog.endsQuestionsSuffix": ": finaliza el cuestionario",
  "dialog.autocomplete.title": "Comandos de barra",
  "dialog.menu.moveUp": "Subir",
  "dialog.menu.moveDown": "Bajar",
  "dialog.menu.leftAria": "Izquierda: {verb} ({label})",
  "dialog.menu.rightAria": "Derecha: {verb} ({label})",
  "dialog.preview.currentAnswerAria": "Respuesta actual",
  "dialog.preview.previewedBelowAria": "Vista previa a continuación",
  "dialog.preview.previewLabel": "Vista previa · {label}",
  "dialog.preview.editingBanner": "Edición de nota activa en la terminal. Los controles se reactivarán al cerrarla.",
  "dialog.preview.noteForQuestion": "Nota para esta pregunta",
  "dialog.preview.noteTextAria": "Texto de la nota",
  "dialog.preview.notePlaceholder": "Añadir contexto a la respuesta...",
  "dialog.preview.saveNote": "Guardar nota",
  "dialog.preview.editNoteAria": "Editar nota",
  "dialog.preview.removeNoteAria": "Eliminar nota",
  "dialog.preview.noteAria": "Nota",
  "dialog.preview.addNote": "Añadir nota a esta respuesta",

  // --- reply (the free-text reply race guard, lib/reply-action.ts) ---
  "reply.blocked.noBox":
    "El campo de entrada del agente no está en pantalla. Probablemente hay un menú o diálogo abierto. No se introdujo texto.",
  "reply.blocked.noEcho":
    "Es una solicitud de contraseña. Al no mostrar caracteres al escribir, Enviar no puede confirmar la recepción del texto. No se introdujo nada.",
  "reply.blocked.composerLeft":
    "El campo de entrada del agente desapareció al limpiar la línea. Probablemente hay un menú o diálogo abierto. No se introdujo el mensaje.",
  "reply.stalled.noEcho":
    "Es una solicitud de contraseña. No muestra salida al escribir, por lo que el texto no se pudo confirmar ni enviar. El contenido introducido permanece en el panel.",
  "reply.stalled.generic":
    "El mensaje no llegó al campo de entrada. Puede haber un diálogo activo y, si se pulsó una tecla para responderlo, es probable que se haya registrado. No se envió nada.",

  // --- previewAction (the preview-select dialog's note flow, lib/preview-action.ts) ---
  "previewAction.note.notOpened": "El campo de nota no se abrió. Revisa el panel.",
  "previewAction.note.clearFailed": "No se pudo borrar la nota existente. Revisa el panel.",
  "previewAction.note.textFailed": "No se recibió el texto de la nota. Revisa el panel.",
  "previewAction.note.closeFailed": "El campo de nota no se cerró. Revisa el panel.",

  // --- promptAction (the plan-feedback flow, lib/prompt-action.ts) ---
  "promptAction.feedback.freeTextUnsupported":
    "El campo de texto libre de este diálogo no se edita desde el teléfono.",
  "promptAction.feedback.empty": "No hay nada para enviar.",
  "promptAction.feedback.boxNotOpened": "El cuadro de comentarios no se abrió. Revisa el panel.",
  "promptAction.feedback.notArrived": "El comentario no llegó. No se envió nada.",

  // --- stt (speech-to-text errors, lib/stt.ts + hooks/use-stt-recorder.ts) ---
  "directTyping.status.draftPending":
    "Envía o descarta el borrador antes de escribir en la terminal.",
  "directTyping.status.armed": "Escribiendo en la terminal. Las pulsaciones se envían al instante.",
  "directTyping.status.disarmed": "Restablecido el envío de respuestas.",
  "directTyping.status.interrupted":
    "Escritura en terminal detenida. Se interrumpió la vista del panel.",
  "directTyping.status.backgrounded":
    "Escritura en terminal detenida. La aplicación pasó a segundo plano.",

  // --- apiError (the bridge's refusals, keyed by the code on the wire) ---
  "apiError.unknown": "Error desconocido. Reintente más tarde.",
  "apiError.reply.not_submitted":
    "El mensaje se escribió en el panel pero no se envió. Revise el panel antes de reintentar.",
  "apiError.reply.send_failed": "Error al enviar el mensaje: {reason}",
  "apiError.keys.send_failed": "Error al enviar las pulsaciones de teclado: {reason}",
  "apiError.prompt_changed": "El estado del terminal cambió antes de enviar. Revise el panel.",
  "apiError.prompt.read_failed":
    "No se pudo leer el panel antes de enviar. Respuesta de {mux}: {detail}",
  "apiError.pane.close_failed": "Error al cerrar el panel: {reason}",
  "apiError.pane.rename_failed": "Error al renombrar el panel: {reason}",
  "apiError.pane.focus_failed": "Error al enfocar el panel en la terminal: {reason}",
  "apiError.tab.create_failed": "Error al crear la pestaña: {reason}",
  "apiError.tab.rename_failed": "Error al renombrar la pestaña: {reason}",
  "apiError.tab.close_failed": "Error al cerrar la pestaña: {reason}",
  "apiError.tab.workspace_required": "No se especificó un espacio para la nueva pestaña.",
  "apiError.launch.not_allowlisted": "Ese comando no está en tus lanzadores",
  "apiError.launch.pane_unknown": "Ese panel ya no existe, no se inició nada",
  "apiError.workspace.create_failed": "Error al crear el espacio: {reason}",
  "apiError.upload.too_large": "El archivo es demasiado grande, el límite es {maxMb} MB.",
  "apiError.upload.no_file": "No se especificó ningún archivo.",
  "apiError.upload.bad_type": "Formato de archivo no admitido por Collie: {type}",
  "apiError.upload.write_failed": "No se pudo guardar el archivo en el host: {reason}",
  "apiError.stt.unconfigured": "El servicio de dictado por voz no está configurado en este collie.",
  "apiError.stt.too_large": "La grabación excede la duración permitida. Use un audio más corto.",
  "apiError.stt.bad_format": "El navegador generó un formato de audio incompatible con Collie.",
  "apiError.stt.busy":
    "Hay dos transcripciones en proceso. Reintente en un momento.",
  "apiError.stt.unreadable": "No se pudo procesar el archivo de audio.",
  "apiError.stt.empty": "La grabación no contiene datos.",
  "apiError.stt.provider_failed": "Fallo en el servicio de transcripción: {reason}",
  "apiError.pairing.bad_request":
    "Código o nombre no válido. El nombre debe tener entre 1 y 48 caracteres.",
  "apiError.pairing.no_pending": "No hay solicitudes de vinculación pendientes en el host.",
  "apiError.pairing.expired": "El código de vinculación ha caducado.",
  "apiError.pairing.exhausted":
    "Límite de intentos superado. La vinculación fue descartada.",
  "apiError.pairing.bad_code": "El código de vinculación no coincide.",
  "apiError.pairing.duplicate_label": "Ya existe un dispositivo registrado con ese nombre.",
  "apiError.device.unknown": "No existe ningún dispositivo vinculado con ese nombre.",
  "apiError.cache.pane_unknown": "That pane is gone, nothing was changed.",
  "apiError.cache.no_session": "That pane's agent names no session, so it can't be watched.",
  "apiError.session.unknown": "No existe la sesión {session} en este collie.",
  "apiError.host.unknown": "No existe el collie {host} en este equipo.",
  "apiError.crew.not_lead": "Este collie no lidera ningún equipo. No hay datos para mostrar.",
  // --- worktrees (ADR 0032) ---
  "apiError.worktree.list_failed": "Error al listar los worktrees: {reason}",
  "apiError.worktree.create_failed": "Error al crear el worktree: {reason}",
  "apiError.worktree.created_not_opened": "La rama fue creada, pero falló la apertura del espacio: {reason}",
  "apiError.worktree.open_failed": "Error al abrir el worktree: {reason}",
  "apiError.worktree.busy": "Hay otra operación de worktree en ejecución. Reintente en un momento.",
  "apiError.worktree.ambiguous_branch": "El nombre de rama es ambiguo: {reason}",
  "apiError.worktree.branch_required": "Indique un nombre de rama.",
  "apiError.worktree.not_a_repo": "Este espacio no se encuentra dentro de un repositorio Git.",
  "worktree.section": "Worktrees",
  "worktree.new": "Nuevo worktree",
  "worktree.branchLabel": "Rama",
  "worktree.branchPlaceholder": "feature/mi-cambio",
  "worktree.branchesFrom": "Bifurca desde {branch}",
  "worktree.create": "Crear",
  "worktree.creating": "Creando...",
  "worktree.open": "Abrir",
  "worktree.opening": "Abriendo...",
  "worktree.mainCheckout": "directorio raíz del repositorio",
  "worktree.empty": "Sin worktrees configurados.",
  "worktree.detached": "separado",
  "worktree.recoverOpen": "Abrir la rama creada",
  "space.new.tab.plain": "Espacio",
  "space.new.tab.worktree": "Worktree",
  "space.new.repo.label": "Repositorio",
  "worktree.orOpenExisting": "Abrir worktree existente",
  // --- apiError.update (POST /api/update refusals, M15/05) ---
  "apiError.update.confirm_required": "La actualización requería confirmación; no se inició nada.",
  "apiError.update.in_progress": "Ya hay una actualización en curso ({state}). No se inició nada.",
  "apiError.update.preflight_unavailable": "No se pudo ejecutar la comprobación previa en este equipo; se rechazó la actualización.",
  "apiError.update.preflight_red": "Falló la comprobación previa en {check}: {reason}",
  "apiError.update.major_confirm_required": "{version} pasa a una versión mayor y requiere confirmación explícita.",
  "apiError.update.target_mismatch": "Esta pantalla ofreció {asked}, pero este collie instalaría {would}. Recargue y vuelva a revisar.",
  "apiError.update.none_available": "No hay ninguna versión más reciente disponible.",
  "apiError.update.peers_packaged": "{name} es una instalación por paquete. Sus actualizaciones vienen de su propio gestor de paquetes.",
  "apiError.update.packaged": "Las actualizaciones se gestionan con tu gestor de paquetes. Collie no reemplazará los archivos de esta instalación.",
  "apiError.update.start_failed": "No se pudo iniciar la actualización: {reason}",
  // --- settings.updateCard (the update card, M15/05) ---
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
  "cache.sheet.reset.pending": "Después del último turno: {action}. El siguiente turno reconstruye la caché.",
  "cache.sheet.reset.cause": "Antes del último turno: {action}. Ese turno reconstruyó la caché.",
  "cache.sheet.state": "State",
  "cache.sheet.state.warm": "Warm",
  "cache.sheet.state.expiring": "Expiring",
  "cache.sheet.state.cold": "Cold",
  "cache.confidence.documented": "documented",
  "cache.confidence.reported": "reported",
  "cache.confidence.inferred": "inferred",
  "cache.confidence.observed": "measured",
  "tour.skip": "Skip",
  "tour.title": "Collie shows the agents in your terminal.",
  // The claim's second sentence, in the three forms the facts can support. {mux} is the
  // multiplexer's display name, {host} the lead machine's crew label; a clause whose fact is missing
  // is dropped rather than filled with a placeholder.
  "tour.lead":
    "It mirrors the panes running under {mux} on {host}. It shows what is on those screens, and it never runs a terminal of its own.",
  "tour.leadNoMux":
    "It mirrors the panes running in your terminal multiplexer. It shows what is on those screens, and it never runs a terminal of its own.",

  // Your setup. Every row is a fact this snapshot carries, or the row is absent.
  "tour.setup": "Your setup",
  "tour.setup.panes.one": "{count} pane",
  "tour.setup.panes.other": "{count} panes",
  "tour.setup.needsYou.one": "{count} needs you",
  "tour.setup.needsYou.other": "{count} need you",
  "tour.setup.noPanes": "No panes yet",
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
  "tour.done.pane": "Open the pane that needs you",
  "tour.done.dashboard": "Show the dashboard",

  // --- settings.tour ---
  "settings.tour.title": "Show the first screen again",
  "settings.tour.description": "What Collie does, and what this install looks like.",
  "settings.tour.button": "Show",

  // --- updateScreen (M28/01): English until translated. ---
};
