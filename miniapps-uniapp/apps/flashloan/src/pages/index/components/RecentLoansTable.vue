<template>
  <NeoCard variant="erobo" class="history-card">
    <text class="stats-title-glass">📜 {{ t("recentLoans") }}</text>
    <view v-if="recentLoans.length > 0" class="loans-table-glass">
      <view class="table-header-glass">
        <text class="th-glass th-amount">{{ t("amount") }}</text>
        <text class="th-glass th-fee">{{ t("feeShort") }}</text>
        <text class="th-glass th-time">{{ t("time") }}</text>
      </view>
      <view v-for="(loan, idx) in recentLoans" :key="idx" class="table-row-glass">
        <text class="td-glass td-amount">{{ formatNum(loan.amount) }} GAS</text>
        <text class="td-glass td-fee">{{ (loan.amount * 0.0009).toFixed(4) }}</text>
        <text class="td-glass td-time">{{ loan.timestamp }}</text>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.stats-title-glass {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: $space-4;
  display: block;
  color: white;
  letter-spacing: 0.05em;
}
.loans-table-glass {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.table-header-glass {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
.th-glass {
  flex: 1;
  padding: $space-3;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.table-row-glass {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  &:last-child {
    border-bottom: none;
  }
}
.td-glass {
  flex: 1;
  padding: $space-3;
  font-size: 12px;
  font-family: $font-mono;
  font-weight: 700;
  color: white;
}
.td-amount {
  color: #00E599;
}
.empty-state {
  text-align: center;
  padding: $space-6;
  opacity: 0.6;
  color: white;
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
