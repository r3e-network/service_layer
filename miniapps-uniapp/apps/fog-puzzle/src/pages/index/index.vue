<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card stats-card">
      <view class="stat-item">
        <text class="stat-label">{{ t("moves") }}</text>
        <text class="stat-value">{{ moves }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">{{ t("found") }}</text>
        <text class="stat-value">{{ treasuresFound }}/{{ totalTreasures }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">{{ t("prize") }}</text>
        <text class="stat-value success">{{ formatNum(prizePool) }} GAS</text>
      </view>
    </view>

    <view class="card grid-card">
      <view class="puzzle-grid">
        <view v-for="(row, i) in grid" :key="i" class="grid-row">
          <view
            v-for="(cell, j) in row"
            :key="j"
            :class="['grid-cell', cell.revealed ? 'revealed' : 'hidden', cell.type]"
            @click="revealCell(i, j)"
          >
            <text v-if="cell.revealed" class="cell-icon">{{ getCellIcon(cell.type) }}</text>
            <text v-else class="fog-text">?</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("gameControls") }}</text>
      <view class="control-row">
        <text class="label">{{ t("entryFee") }}</text>
        <uni-easyinput v-model="entryFee" type="digit" placeholder="0.5" class="fee-input" />
        <text class="label">GAS</text>
      </view>
      <view class="action-btn" @click="startGame" :style="{ opacity: isLoading || gameActive ? 0.6 : 1 }">
        <text>{{ gameActive ? t("gameActive") : isLoading ? t("starting") : t("startHunt") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("legend") }}</text>
      <view class="legend-list">
        <view class="legend-item">
          <text class="legend-icon treasure">💎</text>
          <text class="legend-text">{{ t("treasureDesc") }}</text>
        </view>
        <view class="legend-item">
          <text class="legend-icon hint">💡</text>
          <text class="legend-text">{{ t("hintDesc") }}</text>
        </view>
        <view class="legend-item">
          <text class="legend-icon trap">💥</text>
          <text class="legend-text">{{ t("trapDesc") }}</text>
        </view>
        <view class="legend-item">
          <text class="legend-icon empty">·</text>
          <text class="legend-text">{{ t("emptyDesc") }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Fog Puzzle", zh: "迷雾谜题" },
  subtitle: { en: "Hidden treasure hunt", zh: "隐藏宝藏寻宝" },
  moves: { en: "Moves", zh: "移动" },
  found: { en: "Found", zh: "已找到" },
  prize: { en: "Prize", zh: "奖金" },
  gameControls: { en: "Game Controls", zh: "游戏控制" },
  entryFee: { en: "Entry Fee", zh: "入场费" },
  gameActive: { en: "Game Active", zh: "游戏进行中" },
  starting: { en: "Starting...", zh: "开始中..." },
  startHunt: { en: "Start Hunt", zh: "开始寻宝" },
  legend: { en: "Legend", zh: "图例" },
  treasureDesc: { en: "Treasure (+0.5 GAS)", zh: "宝藏 (+0.5 GAS)" },
  hintDesc: { en: "Hint (nearby treasure)", zh: "提示（附近有宝藏）" },
  trapDesc: { en: "Trap (game over)", zh: "陷阱（游戏结束）" },
  emptyDesc: { en: "Empty space", zh: "空白区域" },
  startFirst: { en: "Start a game first!", zh: "请先开始游戏！" },
  alreadyRevealed: { en: "Already revealed!", zh: "已经揭示！" },
  treasureFound: { en: "Treasure found! +0.5 GAS", zh: "找到宝藏！+0.5 GAS" },
  victory: { en: "Victory! All treasures found! Won", zh: "胜利！找到所有宝藏！赢得" },
  trapHit: { en: "Trap! Game over. Better luck next time.", zh: "陷阱！游戏结束。祝下次好运。" },
  hintNearby: { en: "Hint: Treasure nearby!", zh: "提示：附近有宝藏！" },
  emptySpace: { en: "Empty space", zh: "空白区域" },
  startingHunt: { en: "Starting treasure hunt...", zh: "开始寻宝..." },
  huntStarted: { en: "Hunt started! Find all treasures!", zh: "寻宝开始！找到所有宝藏！" },
  errorStarting: { en: "Error starting game", zh: "开始游戏出错" },
};

const t = createT(translations);

const APP_ID = "miniapp-fog-puzzle";
const { address, connect } = useWallet();

const { payGAS, isLoading } = usePayments(APP_ID);

const entryFee = ref("0.5");
const moves = ref(0);
const treasuresFound = ref(0);
const totalTreasures = ref(5);
const prizePool = ref(0);
const gameActive = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);

interface Cell {
  type: "empty" | "treasure" | "trap" | "hint";
  revealed: boolean;
}

const GRID_SIZE = 6;

const initGrid = (): Cell[][] => {
  const g: Cell[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      row.push({ type: "empty", revealed: false });
    }
    g.push(row);
  }

  let treasures = 0;
  while (treasures < totalTreasures.value) {
    const i = Math.floor(Math.random() * GRID_SIZE);
    const j = Math.floor(Math.random() * GRID_SIZE);
    if (g[i][j].type === "empty") {
      g[i][j].type = "treasure";
      treasures++;
    }
  }

  let traps = 0;
  while (traps < 3) {
    const i = Math.floor(Math.random() * GRID_SIZE);
    const j = Math.floor(Math.random() * GRID_SIZE);
    if (g[i][j].type === "empty") {
      g[i][j].type = "trap";
      traps++;
    }
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (g[i][j].type === "empty") {
        let nearbyTreasures = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < GRID_SIZE && nj >= 0 && nj < GRID_SIZE && g[ni][nj].type === "treasure") {
              nearbyTreasures++;
            }
          }
        }
        if (nearbyTreasures > 0) {
          g[i][j].type = "hint";
        }
      }
    }
  }

  return g;
};

const grid = ref<Cell[][]>(initGrid());

const formatNum = (n: number, d = 2) => formatNumber(n, d);

const getCellIcon = (type: string): string => {
  switch (type) {
    case "treasure":
      return "💎";
    case "trap":
      return "💥";
    case "hint":
      return "💡";
    default:
      return "·";
  }
};

const revealCell = (i: number, j: number) => {
  if (!gameActive.value) {
    status.value = { msg: t("startFirst"), type: "error" };
    return;
  }

  if (grid.value[i][j].revealed) {
    status.value = { msg: t("alreadyRevealed"), type: "error" };
    return;
  }

  grid.value[i][j].revealed = true;
  moves.value++;

  const cellType = grid.value[i][j].type;

  if (cellType === "treasure") {
    treasuresFound.value++;
    prizePool.value += 0.5;
    status.value = { msg: t("treasureFound"), type: "success" };

    if (treasuresFound.value === totalTreasures.value) {
      status.value = { msg: `${t("victory")} ${formatNum(prizePool.value)} GAS`, type: "success" };
      gameActive.value = false;
    }
  } else if (cellType === "trap") {
    status.value = { msg: t("trapHit"), type: "error" };
    gameActive.value = false;
    revealAll();
  } else if (cellType === "hint") {
    status.value = { msg: t("hintNearby"), type: "success" };
  } else {
    status.value = { msg: t("emptySpace"), type: "success" };
  }
};

const revealAll = () => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      grid.value[i][j].revealed = true;
    }
  }
};

const startGame = async () => {
  if (isLoading.value || gameActive.value) return;

  try {
    status.value = { msg: t("startingHunt"), type: "loading" };
    await payGAS(entryFee.value, `fogpuzzle:start:${Date.now()}`);

    grid.value = initGrid();
    moves.value = 0;
    treasuresFound.value = 0;
    prizePool.value = 0;
    gameActive.value = true;

    status.value = { msg: t("huntStarted"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("errorStarting"), type: "error" };
  }
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: $color-text-primary;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-gaming;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}

.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
  &.loading {
    background: rgba($color-gaming, 0.15);
    color: $color-gaming;
  }
}

.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  padding: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: $color-text-secondary;
  font-size: 0.85em;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  color: $color-gaming;
  font-weight: bold;
  font-size: 1.1em;
  &.success {
    color: $color-success;
  }
}

.grid-card {
  padding: 16px;
}

.puzzle-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-row {
  display: flex;
  gap: 6px;
}

.grid-cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.5em;
  &.hidden {
    background: rgba($color-gaming, 0.2);
    border: 1px solid $color-border;
  }
  &.revealed {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid $color-border;
    &.treasure {
      background: rgba($color-success, 0.2);
    }
    &.trap {
      background: rgba($color-error, 0.2);
    }
    &.hint {
      background: rgba($color-warning, 0.2);
    }
  }
}

.cell-icon {
  font-size: 1.2em;
}

.fog-text {
  color: $color-text-secondary;
  font-size: 1em;
}

.card-title {
  color: $color-gaming;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.label {
  color: $color-text-secondary;
  font-size: 0.9em;
}

.fee-input {
  flex: 1;
}

.action-btn {
  background: linear-gradient(135deg, $color-gaming 0%, darken($color-gaming, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-icon {
  font-size: 1.5em;
  width: 32px;
  text-align: center;
}

.legend-text {
  color: $color-text-secondary;
  font-size: 0.9em;
}
</style>
