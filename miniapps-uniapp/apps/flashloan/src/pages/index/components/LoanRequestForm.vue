<template>
  <NeoCard variant="default" class="loan-card">
    <view class="card-header">
      <text class="card-title">{{ t("requestFlashLoan") }}</text>
      <view class="risk-indicator" :class="riskLevel">
        <text class="risk-text">{{ t(riskLevel) }}</text>
      </view>
    </view>

    <!-- Operation Type Selector -->
    <view class="operation-section">
      <text class="section-label">{{ t("selectOperation") }}</text>
      <view class="operation-grid">
        <view
          v-for="op in operationTypes"
          :key="op.id"
          :class="['operation-btn', { active: selectedOperation === op.id }]"
          @click="$emit('update:selectedOperation', op.id)"
        >
          <text class="op-icon">{{ op.icon }}</text>
          <text class="op-name">{{ (t as any)(op.id) }}</text>
          <text class="op-desc">{{ (t as any)(op.id + "Desc") }}</text>
        </view>
      </view>
    </view>

    <view class="input-section">
      <NeoInput
        :modelValue="loanAmount"
        @update:modelValue="$emit('update:loanAmount', $event)"
        type="number"
        :placeholder="t('amountPlaceholder')"
        suffix="GAS"
      />
      <view class="amount-hints">
        <text
          v-for="hint in [1000, 5000, 10000]"
          :key="hint"
          class="hint-btn"
          @click="$emit('update:loanAmount', hint.toString())"
        >
          {{ formatNum(hint) }}
        </text>
      </view>
    </view>

    <!-- Fee Calculator -->
    <view class="fee-calculator">
      <view class="calc-row">
        <text class="calc-label">{{ t("loanAmount") }}</text>
        <text class="calc-value">{{ formatNum(parseFloat(loanAmount || "0")) }} GAS</text>
      </view>
      <view class="calc-row">
        <text class="calc-label">{{ t("fee") }}</text>
        <text class="calc-value fee-highlight">{{ (parseFloat(loanAmount || "0") * 0.0009).toFixed(4) }} GAS</text>
      </view>
      <view class="calc-divider"></view>
      <view class="calc-row total">
        <text class="calc-label">{{ t("totalRepay") }}</text>
        <text class="calc-value">{{ (parseFloat(loanAmount || "0") * 1.0009).toFixed(4) }} GAS</text>
      </view>
      <view class="calc-divider"></view>
      <view class="calc-row profit">
        <text class="calc-label">{{ t("estimatedProfit") }}</text>
        <text class="calc-value profit-highlight">+{{ estimatedProfit.toFixed(4) }} GAS</text>
      </view>
    </view>

    <!-- Risk Warning -->
    <view v-if="parseFloat(loanAmount || '0') > gasLiquidity * 0.5" class="risk-warning">
      <text class="warning-icon">⚠️</text>
      <text class="warning-text">{{ t("highRiskWarning") }}</text>
    </view>

    <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('request')" class="execute-btn">
      <text v-if="!isLoading">⚡ {{ t("executeLoan") }}</text>
      <text v-else>{{ t("processing") }}</text>
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

interface Operation {
  id: string;
  icon: string;
  profit: number;
}

defineProps<{
  loanAmount: string;
  riskLevel: string;
  selectedOperation: string;
  operationTypes: Operation[];
  estimatedProfit: number;
  gasLiquidity: number;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:loanAmount", "update:selectedOperation", "request"]);

const formatNum = (n: number) => {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}
.card-title {
  font-size: 16px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.risk-indicator {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 2px solid var(--border-color, black);
  box-shadow: 3px 3px 0 var(--shadow-color, black);
  &.low {
    background: var(--neo-green);
  }
  &.medium {
    background: var(--brutal-yellow);
  }
  &.high {
    background: var(--brutal-red);
    color: white;
  }
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin: $space-6 0;
}
.operation-btn {
  padding: $space-4 $space-2;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  text-align: center;
  box-shadow: 4px 4px 0 var(--shadow-color, black);
  transition: all $transition-fast;
  color: var(--text-primary, black);
  &.active {
    background: var(--brutal-yellow);
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--shadow-color, black);
  }
}
.op-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}
.op-name {
  font-weight: $font-weight-black;
  font-size: 10px;
  text-transform: uppercase;
  display: block;
}

.input-section {
  margin-bottom: $space-4;
}
.amount-hints {
  display: flex;
  gap: $space-2;
  margin-top: $space-2;
}
.hint-btn {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 4px 8px;
  border: 1px solid var(--border-color, black);
  background: var(--bg-elevated, #eee);
  cursor: pointer;
  color: var(--text-primary, black);
}

.fee-calculator {
  background: black;
  color: white;
  padding: $space-5;
  border: 3px solid black;
  margin-top: $space-6;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
}
.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  &.total {
    font-weight: $font-weight-black;
    color: var(--brutal-green);
    border-top: 1px solid #444;
    padding-top: 8px;
  }
  &.profit {
    color: var(--brutal-yellow);
    font-weight: $font-weight-black;
    margin-top: 8px;
    border-top: 1px solid #444;
    padding-top: 8px;
  }
}
.calc-divider {
  height: 1px;
  background: #333;
  margin: 4px 0;
}

.risk-warning {
  margin: $space-4 0;
  padding: $space-3;
  background: var(--brutal-red);
  color: white;
  border: 2px solid var(--border-color, black);
  display: flex;
  align-items: center;
  gap: $space-2;
}
.warning-text {
  font-size: 10px;
  font-weight: bold;
}

.execute-btn {
  margin-top: $space-4;
}
</style>
