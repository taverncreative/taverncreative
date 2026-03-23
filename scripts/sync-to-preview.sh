#!/bin/bash
# Sync Sites (active dev) → iCloud (preview tool reads from here)
SITES="/Users/taverncreative030322/Sites/taverncreativewebsite/"
ICLOUD="/Users/taverncreative030322/Library/Mobile Documents/com~apple~CloudDocs/TavernCreative iCloud/Clients/Business Customers/Business Sorted Kent/taverncreativewebsite/"

rsync -av --delete --exclude='node_modules' --exclude='.next' --exclude='.git' "$SITES" "$ICLOUD"
echo "Synced Sites → iCloud"
