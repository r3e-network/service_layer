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
          :class="['operation-btn-glass', { active: selectedOperation === op.id }]"
          @click="$emit('update:selectedOperation', op.id)"
        >
          <view class="op-glow" v-if="selectedOperation === op.id"></view>
          <view class="op-content">
            <text class="op-icon">{{ op.icon }}</text>
            <text class="op-name">{{ (t as any)(op.id) }}</text>
            <text class="op-desc">{{ (t as any)(op.id + "Desc") }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Loan Amount Input -->
    <view class="input-section">
      <NeoInput
        :modelValue="loanAmount"
        @update:modelValue="$emit('update:loanAmount', $event)"
        type="number"
        :placeholder="t('amountPlaceholder')"
        suffix="GAS"
        label="LOAN AMOUNT"
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
    <view class="fee-receipt-glass">
      <view class="receipt-header">
        <text class="receipt-title">SIMULATION DETAILS</text>
        <text class="receipt-id">#SIM-{{ Math.floor(Math.random() * 1000) }}</text>
      </view>
      <view class="receipt-body">
        <view class="calc-row">
          <text class="calc-label">{{ t("loanAmount") }}</text>
          <text class="calc-value mono">{{ formatNum(parseFloat(loanAmount || "0")) }} GAS</text>
        </view>
        <view class="calc-row">
          <text class="calc-label">{{ t("fee") }}</text>
          <text class="calc-value mono fee-highlight">{{ (parseFloat(loanAmount || "0") * 0.0009).toFixed(4) }} GAS</text>
        </view>
        <view class="calc-divider"></view>
        <view class="calc-row total">
          <text class="calc-label">{{ t("totalRepay") }}</text>
          <text class="calc-value mono">{{ (parseFloat(loanAmount || "0") * 1.0009).toFixed(4) }} GAS</text>
        </view>
        <view class="calc-row profit">
          <text class="calc-label">{{ t("estimatedProfit") }}</text>
          <text class="calc-value mono profit-highlight">+{{ estimatedProfit.toFixed(4) }} GAS</text>
        </view>
      </view>
    </view>

    <!-- Risk Warning -->
    <view v-if="parseFloat(loanAmount || '0') > gasLiquidity * 0.5" class="risk-warning-glass mt-4">
      <text class="warning-icon">⚠️</text>
      <text class="warning-text-glass">{{ t("highRiskWarning") }}</text>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}

.card-title {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.risk-indicator-glass {
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &.low {
    background: rgba(0, 229, 153, 0.15);
    color: #00e599;
    border-color: rgba(0, 229, 153, 0.3);
  }
  &.medium {
    background: rgba(253, 224, 71, 0.15);
    color: #FDE047;
    border-color: rgba(253, 224, 71, 0.3);
  }
  &.high {
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
  }
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  display: block;
  letter-spacing: 0.1em;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: $space-6;
}

.operation-btn-glass {
  position: relative;
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #00e599;
    box-shadow: 0 0 20px rgba(0, 229, 153, 0.15);
    
    .op-name { color: #00e599; }
    .op-icon { transform: scale(1.1); }
  }
}

.op-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, rgba(0, 229, 153, 0.15), transparent 70%);
  pointer-events: none;
}

.op-content {
  position: relative;
  z-index: 1;
}

.op-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
  transition: transform 0.3s;
}

.op-name {
  font-weight: 800;
  font-size: 10px;
  text-transform: uppercase;
  display: block;
  color: white;
  margin-bottom: 4px;
  transition: color 0.3s;
}

.op-desc {
  font-size: 8px;
  opacity: 0.6;
  color: white;
  display: block;
  line-height: 1.2;
}

.input-section {
  margin-bottom: $space-6;
}

.amount-hints {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.hint-btn-glass {
  font-size: 10px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  font-family: $font-mono;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
  }
}

.fee-receipt-glass {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: $space-6;
}

.receipt-header {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.receipt-title {
  font-size: 10px;
  font-weight: 800;
  color: white;
  letter-spacing: 0.1em;
}

.receipt-id {
  font-size: 10px;
  font-family: $font-mono;
  color: rgba(255, 255, 255, 0.4);
}

.receipt-body {
  padding: 16px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.7);
  
  &.total {
    font-weight: 700;
    color: white;
    padding-top: 4px;
  }
  &.profit {
    color: #00e599;
    font-weight: 800;
    margin-top: 12px;
    padding: 10px 0 0;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    font-size: 14px;
  }
}

.calc-value {
  font-family: $font-mono;
}

.calc-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.fee-highlight {
  color: #ff9f43; // Warning color for fee
}

.risk-warning-glass {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: $space-4;
}

.warning-text-glass {
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
}

.execute-btn {
  margin-top: $space-2;
}
</style>
