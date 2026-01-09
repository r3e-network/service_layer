<template>
  <NeoCard variant="default" class="history-card">
    <text class="stats-title">📜 {{ t("recentLoans") }}</text>
    <view v-if="recentLoans.length > 0" class="loans-table">
      <view class="table-header">
        <text class="th th-amount">{{ t("amount") }}</text>
        <text class="th th-fee">{{ t("feeShort") }}</text>
        <text class="th th-time">{{ t("time") }}</text>
      </view>
      <view v-for="(loan, idx) in recentLoans" :key="idx" class="table-row">
        <text class="td td-amount">{{ formatNum(loan.amount) }} GAS</text>
        <text class="td td-fee">{{ (loan.amount * 0.0009).toFixed(4) }}</text>
        <text class="td td-time">{{ loan.timestamp }}</text>
      </view>
    </view>
    <view v-else class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">{{ t("noHistory") }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  recentLoans: { amount: number; timestamp: string; operation: string; profit: number }[];
  t: (key: string) => string;
}>();

const formatNum = (n: number) => {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.stats-title {
  font-size: 16px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-4;
  display: block;
}
.loans-table {
  border: 3px solid var(--border-color, black);
  background: var(--bg-card, white);
  color: var(--text-primary, black);
}
.table-header {
  display: flex;
  background: black;
  color: white;
}
.th {
  flex: 1;
  padding: $space-3;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.table-row {
  display: flex;
  border-bottom: 2px solid black;
  &:last-child {
    border-bottom: none;
  }
}
.td {
  flex: 1;
  padding: $space-3;
  font-size: 12px;
  font-family: $font-mono;
  font-weight: $font-weight-black;
}
.empty-state {
  text-align: center;
  padding: $space-6;
  opacity: 0.6;
}
.empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: $space-2;
}
.empty-text {
  font-size: 12px;
  font-weight: bold;
}
</style>
