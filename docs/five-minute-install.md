# Install in five minutes

This guide sets up Collie on your phone. Install three tools on your computer, start Collie,
and pair your phone.

It uses the recommended setup: Tailscale as the front door, Herdr as the multiplexer, and the
install script.

The steps below are for [Linux](#linux).

Other ways to install (Arch, Nix, Herdr plugin, from source): [Install](install.md#install).

On herdr-app and the Herdr core, with no Herdr TUI, skip the Herdr steps and follow
[herdr-app and the Herdr core](install.md#herdr-app-and-the-herdr-core).

> **Note.** Collie gives remote shell access to your machine by design. Read
> [Security](security.md) before you install it.

## What you need

A computer to host Collie, a phone and a Tailscale account. Tailscale links the host and your
phone on one private network, your tailnet. Collie is reachable only on that network.

- A Linux computer (the host).
- An iPhone or an Android phone.
- A Tailscale account.

## Linux

Install Tailscale and Herdr, install Collie, and start it. Run the commands in a terminal.

1. Install Tailscale and sign in.

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up --operator=$USER
   ```

2. Install the Tailscale app on your phone and sign in with the same account.
3. Open the [admin console](https://login.tailscale.com/admin/dns) and select **Enable HTTPS**.
4. Install Herdr.

   ```bash
   curl -fsSL https://herdr.dev/install.sh | sh
   ```

5. Start Herdr. It opens a pane, so start your agent there, for example `claude`.

   ```bash
   herdr
   ```

6. In a second terminal, install Collie.

   ```bash
   curl -fsSL https://colliepwa.dev/install.sh | sh
   ```

7. Run `collie version`. If it prints a version, skip this step. Otherwise add `~/.local/bin` to
   your PATH and open a new terminal.

   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   ```

8. Start Collie.

   ```bash
   COLLIE_MUX=herdr collie start
   ```

`--operator=$USER` lets your user run `tailscale serve`, which Collie needs. On a host that is
already up, run `sudo tailscale set --operator=$USER` to change only that setting. Leave Herdr
running: it keeps your panes and agents alive when you disconnect.

The install script saves `collie` to `~/.local/bin` and does not use `sudo`. `start` runs Collie in
the background, runs `tailscale serve`, and saves `herdr` as the multiplexer, so later runs need
only `collie start`. It prints **Collie is running** and your URL on the `tailnet` line.

Collie stops when you log out. To keep it running after logout and reboots, for example on a host
you reach by SSH, run this once:

```bash
loginctl enable-linger $USER
```

Next, go to [Put Collie on your phone and pair it](#put-collie-on-your-phone-and-pair-it).

## Put Collie on your phone and pair it

This part is the same on every system: open Collie on the phone, add it to the home screen, then
pair it.

```bash
collie qr
```

1. Scan the QR code with your phone camera to open Collie in the browser.
2. Add Collie to your home screen so it opens full screen like an app.
   - **iPhone:** in Safari, tap **Share**, tap **Add to Home Screen**, and tap **Add**.
   - **Android:** in Chrome, open Collie **Settings** and tap **Install** on the top card.
3. Open Collie from the new icon.

> **Note.** Pair inside the home screen app, not in the browser tab. On an iPhone, the home screen
> app keeps its own storage, separate from Safari, so a pairing made in Safari does not carry over.

1. On the host, print an 8-character code, valid for 10 minutes.

   ```bash
   collie pair
   ```

2. In Collie, open **Settings → System → Paired devices**.
3. Enter the code and a name, for example `my phone`, and tap **Pair this device**.

Collie answers no device until it is paired: before step 3, the dashboard shows **Pair this
device** and no panes. Only paired devices can read or type into your panes. On a tailnet shared
with other people, also set `COLLIE_TRUSTED_USER` ([Configure](configure.md#configure)).

The dashboard lists your Herdr panes. Panes waiting for input appear first. Tap a pane to
view output and reply.

If the phone shows nothing or cannot connect, run `collie doctor` on the host: it names what is
missing.

## Next steps

- [Claude Code in tmux or Herdr, on your phone](claude-code-on-your-phone.md) walks through a full
  day of use with Claude Code.
- [Web Push](voice-and-push.md#web-push-optional) adds notifications when an agent needs input.
- [Configure](configure.md#configure) documents how to restrict Collie to your tailnet user with
  `COLLIE_TRUSTED_USER`.
- [Troubleshooting](troubleshooting.md#troubleshooting) covers common errors.

---

[← back to the README](../README.md)
