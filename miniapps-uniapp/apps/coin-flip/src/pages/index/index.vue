<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>
    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>
    <view class="card">
      <view class="stats-row">
        <view class="stat"
          ><text class="stat-value">{{ wins }}</text
          ><text class="stat-label">{{ t("wins") }}</text></view
        >
        <view class="stat"
          ><text class="stat-value">{{ losses }}</text
          ><text class="stat-label">{{ t("losses") }}</text></view
        >
        <view class="stat"
          ><text class="stat-value">{{ formatNum(totalWon) }}</text
          ><text class="stat-label">{{ t("won") }}</text></view
        >
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("placeBet") }}</text>
      <uni-easyinput v-model="betAmount" type="number" :placeholder="t('betAmountPlaceholder')" />
      <view class="choice-row">
        <view :class="['choice-btn', choice === 'heads' && 'active']" @click="choice = 'heads'">
          <text>{{ t("heads") }}</text>
        </view>
        <view :class="['choice-btn', choice === 'tails' && 'active']" @click="choice = 'tails'">
          <text>{{ t("tails") }}</text>
        </view>
      </view>
      <view class="flip-btn" @click="flip" :style="{ opacity: isFlipping ? 0.6 : 1 }">
        <text>{{ isFlipping ? t("flipping") : t("flipCoin") }}</text>
      </view>
    </view>
    <view v-if="result" class="result-card">
      <text class="result-text">{{ result.won ? t("youWon") : t("youLost") }}</text>
      <text class="result-outcome">{{ result.outcome }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Coin Flip", zh: "抛硬币" },
  subtitle: { en: "50/50 chance to double", zh: "50/50 机会翻倍" },
  wins: { en: "Wins", zh: "胜利" },
  losses: { en: "Losses", zh: "失败" },
  won: { en: "Won", zh: "赢得" },
  placeBet: { en: "Place Bet", zh: "下注" },
  betAmountPlaceholder: { en: "Bet amount (GAS)", zh: "下注金额 (GAS)" },
  heads: { en: "🪙 Heads", zh: "🪙 正面" },
  tails: { en: "🔴 Tails", zh: "🔴 反面" },
  flipping: { en: "Flipping...", zh: "抛掷中..." },
  flipCoin: { en: "Flip Coin", zh: "抛硬币" },
  youWon: { en: "🎉 You Won!", zh: "🎉 你赢了！" },
  youLost: { en: "😢 You Lost", zh: "😢 你输了" },
  minBet: { en: "Min bet: 0.1 GAS", zh: "最小下注：0.1 GAS" },
  wonAmount: { en: "Won {amount} GAS!", zh: "赢得 {amount} GAS！" },
  betterLuck: { en: "Better luck next time", zh: "下次好运" },
  error: { en: "Error", zh: "错误" },
};
const t = createT(translations);

const APP_ID = "miniapp-coinflip";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);
const { requestRandom } = useRNG(APP_ID);

const betAmount = ref("1");
const choice = ref<"heads" | "tails">("heads");
const wins = ref(0);
const losses = ref(0);
const totalWon = ref(0);
const isFlipping = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const result = ref<{ won: boolean; outcome: string } | null>(null);

const formatNum = (n: number) => formatNumber(n, 2);

const flip = async () => {
  if (isFlipping.value) return;
  const amount = parseFloat(betAmount.value);
  if (amount < 0.1) {
    status.value = { msg: t("minBet"), type: "error" };
    return;
  }

  isFlipping.value = true;
  result.value = null;
  try {
    await payGAS(betAmount.value, `coinflip:${choice.value}`);
    const rng = await requestRandom();
    const byte = parseInt(rng.randomness.slice(0, 2), 16);
    const outcome = byte % 2 === 0 ? "heads" : "tails";
    const won = outcome === choice.value;

    result.value = { won, outcome: outcome.toUpperCase() };
    if (won) {
      wins.value++;
      totalWon.value += amount;
      status.value = { msg: t("wonAmount").replace("{amount}", String(amount * 2)), type: "success" };
    } else {
      losses.value++;
      status.value = { msg: t("betterLuck"), type: "error" };
    }
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isFlipping.value = false;
  }
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: #fff;
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
}
.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-gaming;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.stats-row {
  display: flex;
  gap: 12px;
}
.stat {
  flex: 1;
  text-align: center;
  background: rgba($color-gaming, 0.1);
  border-radius: 8px;
  padding: 12px;
}
.stat-value {
  color: $color-gaming;
  font-size: 1.3em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}
.choice-row {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}
.choice-btn {
  flex: 1;
  padding: 16px;
  text-align: center;
  background: rgba($color-gaming, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  &.active {
    border-color: $color-gaming;
    background: rgba($color-gaming, 0.2);
  }
}
.flip-btn {
  background: linear-gradient(135deg, $color-gaming 0%, darken($color-gaming, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
.result-card {
  background: rgba($color-gaming, 0.15);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}
.result-text {
  font-size: 1.5em;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}
.result-outcome {
  color: $color-gaming;
  font-size: 1.2em;
}
</style>
