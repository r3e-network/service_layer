#!/bin/bash
# Setup complete uni-app project structure for all MiniApps
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/../apps"
SHARED_DIR="$SCRIPT_DIR/../shared"

# App definitions: name|title|category|appId
APPS=(
  "lottery|Neo Lottery|gaming|miniapp-lottery"
  "coin-flip|Coin Flip|gaming|miniapp-coinflip"
  "dice-game|Dice Game|gaming|miniapp-dicegame"
  "scratch-card|Scratch Card|gaming|miniapp-scratchcard"
  "secret-poker|Secret Poker|gaming|miniapp-secretpoker"
  "neo-crash|Neo Crash|gaming|miniapp-neo-crash"
  "fog-chess|Fog Chess|gaming|miniapp-fogchess"
  "fog-puzzle|Fog Puzzle|gaming|miniapp-fogpuzzle"
  "crypto-riddle|Crypto Riddle|gaming|miniapp-cryptoriddle"
  "million-piece-map|Million Piece Map|gaming|miniapp-millionpiecemap"
  "puzzle-mining|Puzzle Mining|gaming|miniapp-puzzlemining"
  "flashloan|Flash Loan|defi|miniapp-flashloan"
  "gas-circle|Gas Circle|defi|miniapp-gascircle"
  "compound-capsule|Compound Capsule|defi|miniapp-compound-capsule"
  "self-loan|Self Loan|defi|miniapp-self-loan"
  "red-envelope|Red Envelope|social|miniapp-redenvelope"
  "dev-tipping|Dev Tipping|social|miniapp-dev-tipping"
  "breakup-contract|Breakup Contract|social|miniapp-breakupcontract"
  "ex-files|Ex Files|social|miniapp-exfiles"
  "canvas|Canvas|nft|miniapp-canvas"
  "on-chain-tarot|On-Chain Tarot|nft|miniapp-onchaintarot"
  "time-capsule|Time Capsule|nft|miniapp-time-capsule"
  "heritage-trust|Heritage Trust|nft|miniapp-heritage-trust"
  "garden-of-neo|Garden of Neo|nft|miniapp-garden-of-neo"
  "graveyard|Graveyard|nft|miniapp-graveyard"
  "gov-booster|Gov Booster|governance|miniapp-govbooster"
  "burn-league|Burn League|governance|miniapp-burn-league"
  "doomsday-clock|Doomsday Clock|governance|miniapp-doomsday-clock"
  "masquerade-dao|Masquerade DAO|governance|miniapp-masqueradedao"
  "gov-merc|Gov Merc|governance|miniapp-gov-merc"
  "guardian-policy|Guardian Policy|utility|miniapp-guardianpolicy"
  "unbreakable-vault|Unbreakable Vault|utility|miniapp-unbreakablevault"
)

echo "Setting up ${#APPS[@]} uni-app projects..."

for entry in "${APPS[@]}"; do
  IFS='|' read -r name title category appId <<< "$entry"
  APP_DIR="$APPS_DIR/$name"

  if [ ! -d "$APP_DIR/src/pages/index" ]; then
    echo "Skipping $name - no Vue component found"
    continue
  fi

  echo "[$name] Setting up..."

  # Create directories
  mkdir -p "$APP_DIR/src/static"

  # Copy shared folder if not exists
  if [ ! -d "$APP_DIR/src/shared" ]; then
    cp -r "$SHARED_DIR" "$APP_DIR/src/shared"
  fi
done

echo "Done! Run node scripts/generate-templates.js to create config files."
