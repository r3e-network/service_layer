<template>
  <NeoCard variant="erobo" class="loan-card">
    <view class="card-header">
      <text class="card-title">{{ t("requestFlashLoan") }}</text>
      <view class="risk-indicator-glass" :class="riskLevel">
        <text class="risk-text-glass">{{ t(riskLevel) }}</text>
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
        <view
          v-for="hint in [1000, 5000, 10000]"
          :key="hint"
          class="hint-btn-glass"
          @click="$emit('update:loanAmount', hint.toString())"
        >
          <text>{{ formatNum(hint) }}</text>
        </view>
      </view>
    </view>

    <!-- Fee Calculator -->
    <NeoCard variant="erobo-neo" flat class="fee-calculator">
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
    </NeoCard>

    <!-- Risk Warning -->
    <NeoCard v-if="parseFloat(loanAmount || '0') > gasLiquidity * 0.5" variant="danger" flat class="risk-warning mt-4">
      <view class="flex items-center gap-2">
        <text class="warning-icon">⚠️</text>
        <text class="warning-text-glass">{{ t("highRiskWarning") }}</text>
      </view>
    </NeoCard>

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.05em;
}

.risk-indicator-glass {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  backdrop-filter: blur(5px);

  &.low {
    background: rgba(0, 229, 153, 0.2);
    color: #00e599;
    border: 1px solid rgba(0, 229, 153, 0.3);
  }
  &.medium {
    background: rgba(253, 224, 71, 0.2);
    color: #FDE047;
    border: 1px solid rgba(253, 224, 71, 0.3);
  }
  &.high {
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
}

.risk-text-glass {
  letter-spacing: 0.05em;
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  display: block;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin-bottom: $space-6;
}
.operation-btn {
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;

  &.active {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.15);
  }
}
.op-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 4px;
}
.op-name {
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  display: block;
  color: white;
}
.op-desc {
  font-size: 8px;
  opacity: 0.6;
  color: white;
  margin-top: 4px;
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
.hint-btn-glass {
  font-size: 10px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.fee-calculator {
  margin-top: $space-6;
}
.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
  
  &.total {
    font-weight: 700;
    color: white;
    padding-top: 8px;
  }
  &.profit {
    color: #FDE047;
    font-weight: 700;
    margin-top: 8px;
    padding-top: 8px;
  }
}
.calc-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}
.fee-highlight {
  color: #EF4444;
}
.profit-highlight {
  color: #00e599;
}

.execute-btn {
  margin-top: $space-4;
}

.warning-text-glass {
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.4);
}
</style>
