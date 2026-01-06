#!/usr/bin/env node
/**
 * Generate uni-app project template files for all MiniApps
 */
const fs = require("fs");
const path = require("path");

const APPS_DIR = path.join(__dirname, "../apps");

// All app definitions
const APPS = [
  { name: "lottery", title: "Neo Lottery", category: "gaming", appId: "miniapp-lottery" },
  { name: "coin-flip", title: "Coin Flip", category: "gaming", appId: "miniapp-coinflip" },
  { name: "dice-game", title: "Dice Game", category: "gaming", appId: "miniapp-dicegame" },
  { name: "scratch-card", title: "Scratch Card", category: "gaming", appId: "miniapp-scratchcard" },
  { name: "secret-poker", title: "Secret Poker", category: "gaming", appId: "miniapp-secretpoker" },
  { name: "neo-crash", title: "Neo Crash", category: "gaming", appId: "miniapp-neo-crash" },
  { name: "fog-puzzle", title: "Fog Puzzle", category: "gaming", appId: "miniapp-fogpuzzle" },
  { name: "crypto-riddle", title: "Crypto Riddle", category: "gaming", appId: "miniapp-cryptoriddle" },
  { name: "million-piece-map", title: "Million Piece Map", category: "gaming", appId: "miniapp-millionpiecemap" },
  { name: "puzzle-mining", title: "Puzzle Mining", category: "gaming", appId: "miniapp-puzzlemining" },
  { name: "flashloan", title: "Flash Loan", category: "defi", appId: "miniapp-flashloan" },
  { name: "gas-circle", title: "Gas Circle", category: "defi", appId: "miniapp-gascircle" },
  { name: "compound-capsule", title: "Compound Capsule", category: "defi", appId: "miniapp-compound-capsule" },
  { name: "self-loan", title: "Self Loan", category: "defi", appId: "miniapp-self-loan" },
  { name: "red-envelope", title: "Red Envelope", category: "social", appId: "miniapp-redenvelope" },
  { name: "dev-tipping", title: "Dev Tipping", category: "social", appId: "miniapp-dev-tipping" },
  { name: "breakup-contract", title: "Breakup Contract", category: "social", appId: "miniapp-breakupcontract" },
  { name: "ex-files", title: "Ex Files", category: "social", appId: "miniapp-exfiles" },
  { name: "canvas", title: "Canvas", category: "nft", appId: "miniapp-canvas" },
  { name: "on-chain-tarot", title: "On-Chain Tarot", category: "nft", appId: "miniapp-onchaintarot" },
  { name: "time-capsule", title: "Time Capsule", category: "nft", appId: "miniapp-time-capsule" },
  { name: "heritage-trust", title: "Heritage Trust", category: "nft", appId: "miniapp-heritage-trust" },
  { name: "garden-of-neo", title: "Garden of Neo", category: "nft", appId: "miniapp-garden-of-neo" },
  { name: "graveyard", title: "Graveyard", category: "nft", appId: "miniapp-graveyard" },
  { name: "gov-booster", title: "Gov Booster", category: "governance", appId: "miniapp-govbooster" },
  { name: "burn-league", title: "Burn League", category: "governance", appId: "miniapp-burn-league" },
  { name: "doomsday-clock", title: "Doomsday Clock", category: "governance", appId: "miniapp-doomsday-clock" },
  { name: "masquerade-dao", title: "Masquerade DAO", category: "governance", appId: "miniapp-masqueradedao" },
  { name: "gov-merc", title: "Gov Merc", category: "governance", appId: "miniapp-gov-merc" },
  { name: "guardian-policy", title: "Guardian Policy", category: "utility", appId: "miniapp-guardianpolicy" },
  { name: "unbreakable-vault", title: "Unbreakable Vault", category: "utility", appId: "miniapp-unbreakablevault" },
  { name: "daily-checkin", title: "Daily Check-in", category: "utility", appId: "miniapp-dailycheckin" },
];

module.exports = { APPS_DIR, APPS };

// Run if called directly
if (require.main === module) {
  const { generateAllApps } = require("./templates");
  generateAllApps(APPS_DIR, APPS);
}
