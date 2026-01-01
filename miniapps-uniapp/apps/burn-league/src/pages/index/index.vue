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
      <view class="stats-grid">
        <view class="stat-box">
          <text class="stat-value">{{ formatNum(totalBurned) }}</text>
          <text class="stat-label">{{ t("totalBurned") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">{{ formatNum(userBurned) }}</text>
          <text class="stat-label">{{ t("youBurned") }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-value">#{{ rank }}</text>
          <text class="stat-label">{{ t("rank") }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("burnTokens") }}</text>
      <uni-easyinput v-model="burnAmount" type="number" :placeholder="t('amountPlaceholder')" />
      <view class="reward-info">
        <text class="reward-label">{{ t("estimatedRewards") }}</text>
        <text class="reward-value">{{ formatNum(estimatedReward) }} {{ t("points") }}</text>
      </view>
      <view class="burn-btn" @click="burnTokens" :style="{ opacity: isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("burning") : t("burnNow") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("leaderboard") }}</text>
      <view class="leaderboard-list">
        <view v-for="(entry, i) in leaderboard" :key="i" :class="['leader-item', entry.isUser && 'highlight']">
          <text class="leader-rank">#{{ entry.rank }}</text>
          <text class="leader-addr">{{ entry.address }}</text>
          <text class="leader-burned">{{ formatNum(entry.burned) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Burn League", zh: "燃烧联盟" },
  subtitle: { en: "Burn tokens, earn rewards", zh: "燃烧代币，赚取奖励" },
  totalBurned: { en: "Total Burned", zh: "总燃烧量" },
  youBurned: { en: "You Burned", zh: "你的燃烧量" },
  rank: { en: "Rank", zh: "排名" },
  burnTokens: { en: "Burn Tokens", zh: "燃烧代币" },
  amountPlaceholder: { en: "Amount to burn", zh: "燃烧数量" },
  estimatedRewards: { en: "Estimated Rewards", zh: "预估奖励" },
  points: { en: "Points", zh: "积分" },
  burning: { en: "Burning...", zh: "燃烧中..." },
  burnNow: { en: "Burn Now", zh: "立即燃烧" },
  leaderboard: { en: "Leaderboard", zh: "排行榜" },
  burned: { en: "Burned", zh: "已燃烧" },
  success: { en: "successfully!", zh: "成功！" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-burn-league";
const { address, connect } = useWallet();

interface LeaderEntry {
  rank: number;
  address: string;
  burned: number;
  isUser: boolean;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const burnAmount = ref("10");
const totalBurned = ref(50000);
const userBurned = ref(250);
const rank = ref(15);
const status = ref<{ msg: string; type: string } | null>(null);

const leaderboard = ref<LeaderEntry[]>([
  { rank: 1, address: "0x1a2b...3c4d", burned: 5000, isUser: false },
  { rank: 2, address: "0x5e6f...7g8h", burned: 3500, isUser: false },
  { rank: 3, address: "0x9i0j...1k2l", burned: 2800, isUser: false },
  { rank: 15, address: "You", burned: 250, isUser: true },
]);

const estimatedReward = computed(() => parseFloat(burnAmount.value || "0") * 10);
const formatNum = (n: number) => formatNumber(n, 0);

const burnTokens = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(burnAmount.value);
  if (amount < 1) {
    status.value = { msg: `${t("error")}: Min burn: 1 GAS`, type: "error" };
    return;
  }
  try {
    status.value = { msg: t("burning"), type: "loading" };
    await payGAS(burnAmount.value, "burn");
    userBurned.value += amount;
    totalBurned.value += amount;
    status.value = { msg: `${t("burned")} ${amount} GAS! +${estimatedReward.value} ${t("points")}`, type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
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
  color: $color-governance;
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
  color: $color-governance;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  gap: 8px;
}
.stat-box {
  flex: 1;
  text-align: center;
  background: rgba($color-governance, 0.1);
  border-radius: 8px;
  padding: 12px;
}
.stat-value {
  color: $color-governance;
  font-size: 1.2em;
  font-weight: bold;
  display: block;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.8em;
}

.reward-info {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba($color-governance, 0.1);
  border-radius: 8px;
  margin: 16px 0;
}
.reward-label {
  color: $color-text-secondary;
}
.reward-value {
  color: $color-governance;
  font-weight: bold;
}

.burn-btn {
  background: linear-gradient(135deg, $color-governance 0%, darken($color-governance, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.leader-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba($color-governance, 0.05);
  border-radius: 8px;
  &.highlight {
    background: rgba($color-governance, 0.15);
    border: 1px solid $color-governance;
  }
}
.leader-rank {
  color: $color-governance;
  font-weight: bold;
  width: 40px;
}
.leader-addr {
  color: $color-text-primary;
  flex: 1;
}
.leader-burned {
  color: $color-governance;
  font-weight: bold;
}
</style>
