<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card game-info">
      <view class="info-row">
        <text class="info-label">{{ t("turn") }}</text>
        <text :class="['info-value', currentTurn]">{{ currentTurn === "white" ? t("white") : t("black") }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">{{ t("move") }}</text>
        <text class="info-value">{{ moveCount }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">{{ t("stake") }}</text>
        <text class="info-value">{{ stake }} GAS</text>
      </view>
    </view>

    <view class="card board-card">
      <view class="chessboard">
        <view v-for="(row, i) in board" :key="i" class="board-row">
          <view
            v-for="(cell, j) in row"
            :key="j"
            :class="[
              'board-cell',
              (i + j) % 2 === 0 ? 'light' : 'dark',
              cell.selected ? 'selected' : '',
              cell.visible ? '' : 'fog',
            ]"
            @click="selectCell(i, j)"
          >
            <text v-if="cell.visible && cell.piece" class="piece">{{ cell.piece }}</text>
            <text v-if="!cell.visible" class="fog-icon">?</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("gameActions") }}</text>
      <view class="action-row">
        <view class="action-btn secondary" @click="showRules">
          <text>{{ t("rules") }}</text>
        </view>
        <view class="action-btn" @click="newGame" :style="{ opacity: isLoading ? 0.6 : 1 }">
          <text>{{ isLoading ? t("starting") : t("newGame") }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("moveHistory") }}</text>
      <view class="history-list">
        <text v-if="moveHistory.length === 0" class="empty">{{ t("noMoves") }}</text>
        <view v-for="(move, i) in moveHistory" :key="i" class="history-item">
          <text class="move-number">{{ i + 1 }}.</text>
          <text class="move-text">{{ move }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Fog Chess", zh: "迷雾象棋" },
  subtitle: { en: "Hidden chess game", zh: "隐藏棋盘游戏" },
  turn: { en: "Turn", zh: "回合" },
  white: { en: "White", zh: "白方" },
  black: { en: "Black", zh: "黑方" },
  move: { en: "Move", zh: "移动" },
  stake: { en: "Stake", zh: "赌注" },
  gameActions: { en: "Game Actions", zh: "游戏操作" },
  rules: { en: "Rules", zh: "规则" },
  starting: { en: "Starting...", zh: "开始中..." },
  newGame: { en: "New Game", zh: "新游戏" },
  moveHistory: { en: "Move History", zh: "移动历史" },
  noMoves: { en: "No moves yet", zh: "暂无移动" },
  cannotSee: { en: "Cannot see this square!", zh: "看不到这个方格！" },
  moveMade: { en: "Move made!", zh: "移动完成！" },
  startingNewGame: { en: "Starting new game...", zh: "开始新游戏..." },
  newGameStarted: { en: "New game started!", zh: "新游戏已开始！" },
  errorStarting: { en: "Error starting game", zh: "开始游戏出错" },
  rulesText: {
    en: "Standard chess rules apply. You can only see squares near your pieces!",
    zh: "标准国际象棋规则。你只能看到棋子附近的方格！",
  },
};

const t = createT(translations);

const APP_ID = "miniapp-fog-chess";
const { address, connect } = useWallet();

const { payGAS, isLoading } = usePayments(APP_ID);

const currentTurn = ref<"white" | "black">("white");
const moveCount = ref(0);
const stake = ref("1.0");
const status = ref<{ msg: string; type: string } | null>(null);
const moveHistory = ref<string[]>([]);
const selectedCell = ref<{ row: number; col: number } | null>(null);

interface Cell {
  piece: string;
  visible: boolean;
  selected: boolean;
}

const initBoard = (): Cell[][] => {
  const b: Cell[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < 8; j++) {
      const visible = i >= 6 || i <= 1;
      let piece = "";

      if (i === 1) piece = "♟";
      if (i === 6) piece = "♙";
      if (i === 0) {
        if (j === 0 || j === 7) piece = "♜";
        if (j === 1 || j === 6) piece = "♞";
        if (j === 2 || j === 5) piece = "♝";
        if (j === 3) piece = "♛";
        if (j === 4) piece = "♚";
      }
      if (i === 7) {
        if (j === 0 || j === 7) piece = "♖";
        if (j === 1 || j === 6) piece = "♘";
        if (j === 2 || j === 5) piece = "♗";
        if (j === 3) piece = "♕";
        if (j === 4) piece = "♔";
      }

      row.push({ piece, visible, selected: false });
    }
    b.push(row);
  }
  return b;
};

const board = ref<Cell[][]>(initBoard());

const selectCell = (row: number, col: number) => {
  if (!board.value[row][col].visible) {
    status.value = { msg: t("cannotSee"), type: "error" };
    return;
  }

  if (selectedCell.value) {
    board.value[selectedCell.value.row][selectedCell.value.col].selected = false;

    if (selectedCell.value.row !== row || selectedCell.value.col !== col) {
      const fromPiece = board.value[selectedCell.value.row][selectedCell.value.col].piece;
      board.value[row][col].piece = fromPiece;
      board.value[selectedCell.value.row][selectedCell.value.col].piece = "";

      revealFog(row, col);

      const move = `${String.fromCharCode(97 + selectedCell.value.col)}${8 - selectedCell.value.row} → ${String.fromCharCode(97 + col)}${8 - row}`;
      moveHistory.value.unshift(move);
      moveHistory.value = moveHistory.value.slice(0, 10);

      moveCount.value++;
      currentTurn.value = currentTurn.value === "white" ? "black" : "white";
      status.value = { msg: t("moveMade"), type: "success" };
    }

    selectedCell.value = null;
  } else if (board.value[row][col].piece) {
    board.value[row][col].selected = true;
    selectedCell.value = { row, col };
  }
};

const revealFog = (row: number, col: number) => {
  for (let i = Math.max(0, row - 1); i <= Math.min(7, row + 1); i++) {
    for (let j = Math.max(0, col - 1); j <= Math.min(7, col + 1); j++) {
      board.value[i][j].visible = true;
    }
  }
};

const newGame = async () => {
  if (isLoading.value) return;

  try {
    status.value = { msg: t("startingNewGame"), type: "loading" };
    await payGAS(stake.value, `fogchess:new:${Date.now()}`);

    board.value = initBoard();
    moveHistory.value = [];
    moveCount.value = 0;
    currentTurn.value = "white";
    selectedCell.value = null;

    status.value = { msg: t("newGameStarted"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("errorStarting"), type: "error" };
  }
};

const showRules = () => {
  status.value = {
    msg: t("rulesText"),
    type: "success",
  };
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

.game-info {
  display: flex;
  justify-content: space-around;
  padding: 16px;
}

.info-row {
  text-align: center;
}

.info-label {
  color: $color-text-secondary;
  font-size: 0.85em;
  display: block;
  margin-bottom: 4px;
}

.info-value {
  color: $color-gaming;
  font-weight: bold;
  font-size: 1.1em;
  &.white {
    color: #fff;
  }
  &.black {
    color: #888;
  }
}

.board-card {
  padding: 12px;
}

.chessboard {
  display: flex;
  flex-direction: column;
  border: 2px solid $color-border;
  border-radius: 8px;
  overflow: hidden;
}

.board-row {
  display: flex;
}

.board-cell {
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  &.light {
    background: rgba(255, 255, 255, 0.1);
  }
  &.dark {
    background: rgba(0, 0, 0, 0.3);
  }
  &.selected {
    background: rgba($color-gaming, 0.4) !important;
  }
  &.fog {
    background: rgba(0, 0, 0, 0.7) !important;
  }
}

.piece {
  font-size: 1.8em;
}

.fog-icon {
  color: $color-text-secondary;
  font-size: 1.2em;
}

.card-title {
  color: $color-gaming;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 16px;
}

.action-row {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  background: linear-gradient(135deg, $color-gaming 0%, darken($color-gaming, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  &.secondary {
    background: rgba($color-gaming, 0.2);
    color: $color-gaming;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.empty {
  color: $color-text-secondary;
  text-align: center;
}

.history-item {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: rgba($color-gaming, 0.1);
  border-radius: 6px;
}

.move-number {
  color: $color-gaming;
  font-weight: bold;
}

.move-text {
  color: $color-text-primary;
}
</style>
