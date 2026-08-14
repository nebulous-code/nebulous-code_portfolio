#!/usr/bin/env bash
#
# Start the site locally for development.
#
#   ./run.sh
#
# Hot-reloads on every save and binds all interfaces, so a phone or another
# machine on the LAN can load it. Host and port come from `server` in
# astro.config.mjs — this script only reads the port to print the URLs and to
# warn when something is already listening.
#
# This runs the DEV server. It re-renders each page per request, which means
# the home page re-fetches GitHub on every load, and build-time behaviour —
# scheduled-post gating, the sitemap, Open Graph tags — does not exist here.
# Use `npm run serve` to build and preview the real static output.

set -euo pipefail

cd "$(dirname "$0")"

PORT=7574

if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "Port ${PORT} is already in use — a dev server is probably running." >&2
  echo "Stop it with:  pkill -f 'astro dev'" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "node_modules missing — installing dependencies first."
  npm install
fi

# First global IPv4 that isn't a container bridge, VPN, or tailnet address.
LAN_IP=$(
  ip -4 -o addr show scope global 2>/dev/null |
    awk '$2 !~ /^(docker|br-|veth|wg|tailscale|virbr)/ {print $4}' |
    cut -d/ -f1 | head -1
)

echo
echo "  Local     http://localhost:${PORT}/"
if [ -n "${LAN_IP}" ]; then
  echo "  Network   http://${LAN_IP}:${PORT}/    <- phone and other devices"
else
  echo "  Network   (no LAN address found — check you're on the network)"
fi
echo
echo "  Hot reload is on. Ctrl-C to stop."
echo "  If a device can't connect, the firewall is the usual cause:"
echo "      sudo ufw allow ${PORT}/tcp"
echo

exec npm run dev
