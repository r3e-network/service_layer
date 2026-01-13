<template>
  <view class="docs-container">
    <NeoCard :title="t('docTitle')" variant="accent" class="mb-4">
      <view class="hero-doc">
        <text class="doc-subtitle">{{ t("docSubtitle") }}</text>
        <text class="doc-description">{{ t("docDescription") }}</text>
      </view>
    </NeoCard>

    <!-- Contract Info -->
    <NeoCard :title="t('contractInfo')" class="mb-4">
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">{{ t("contractName") }}</text>
          <text class="info-value mono">NeoFlashPool</text>
        </view>
        <view class="info-item">
          <text class="info-label">{{ t("version") }}</text>
          <text class="info-value">v2.1-stable</text>
        </view>
        <view class="info-item">
          <text class="info-label">Network</text>
          <text class="info-value">Neo N3 Mainnet</text>
        </view>
        <view class="info-item">
          <text class="info-label">Protocol Fee</text>
          <text class="info-value highlight">0.09%</text>
        </view>
      </view>

      <view class="hash-box mt-4">
        <text class="info-label">Contract Hash</text>
        <view class="hash-value">
          <text class="mono-small">0x794b127599723ede80e608985ef414a38202976b</text>
        </view>
      </view>
    </NeoCard>

    <!-- Contract Methods -->
    <NeoCard :title="t('contractMethods')" class="mb-4">
      <view class="method-card">
        <view class="method-header">
          <text class="method-name">flashLoan</text>
          <text class="method-badge write">{{ t("write") }}</text>
        </view>
        <text class="method-desc">{{ t("requestLoanDesc") }}</text>
        <view class="method-params">
          <text class="params-title">{{ t("parameters") }}:</text>
          <view class="param-item">
            <text class="param-name">receiver</text>
            <text class="param-type">Hash160</text>
            <text class="param-desc">Callback contract address</text>
          </view>
          <view class="param-item">
            <text class="param-name">token</text>
            <text class="param-type">Hash160</text>
            <text class="param-desc">Asset to borrow (NEO/GAS)</text>
          </view>
          <view class="param-item">
            <text class="param-name">amount</text>
            <text class="param-type">Integer</text>
            <text class="param-desc">Amount in basic units</text>
          </view>
          <view class="param-item">
            <text class="param-name">data</text>
            <text class="param-type">Any</text>
            <text class="param-desc">Encoded params for callback</text>
          </view>
        </view>
      </view>

      <view class="method-card">
        <view class="method-header">
          <text class="method-name">getPoolBalance</text>
          <text class="method-badge read">{{ t("read") }}</text>
        </view>
        <text class="method-desc">Check available liquidity for a specific token.</text>
      </view>
    </NeoCard>

    <!-- Usage Steps -->
    <NeoCard :title="t('howToUse')" variant="success" class="mb-4">
      <view class="usage-steps">
        <view class="u-step">
          <view class="u-num">01</view>
          <view class="u-content">
            <text class="u-title">Deploy Callback Contract</text>
            <text class="u-text"
              >Create a smart contract that implements the `onFlashLoan` method to receive assets and execute your
              logic.</text
            >
          </view>
        </view>
        <view class="u-step">
          <view class="u-num">02</view>
          <view class="u-content">
            <text class="u-title">Call flashLoan</text>
            <text class="u-text"
              >Trigger the `flashLoan` method on the NeoFlashPool contract from your bot or frontend.</text
            >
          </view>
        </view>
        <view class="u-step">
          <view class="u-num">03</view>
          <view class="u-content">
            <text class="u-title">Atomic Execution</text>
            <text class="u-text"
              >The pool sends you funds, calls your `onFlashLoan`, and finally checks if you returned the loan + 0.09%
              fee.</text
            >
          </view>
        </view>
        <view class="u-step">
          <view class="u-num">04</view>
          <view class="u-content">
            <text class="u-title">Profit Capture</text>
            <text class="u-text"
              >Any excess assets remaining in your callback contract after repayment are your guaranteed profit!</text
            >
          </view>
        </view>
      </view>
    </NeoCard>

    <!-- Warning -->
    <view class="warning-box">
      <AppIcon name="alert-triangle" :size="20" />
      <text class="warning-text"
        >Flash loans will fail if the transaction doesn't include the full repayment. Ensure your gas calculation
        includes the fee.</text
      >
    </view>
  </view>
</template>

<script setup lang="ts">
import { NeoCard, AppIcon } from "@/shared/components";

defineProps<{
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.docs-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-bottom: $space-8;
}

.hero-doc {
  padding: $space-2;
}

.doc-subtitle {
  font-weight: $font-weight-black;
  font-size: 16px;
  display: block;
  margin-bottom: $space-2;
  text-transform: uppercase;
}

.doc-description {
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.8;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.5;
  margin-bottom: 2px;
}

.info-value {
  font-size: 13px;
  font-weight: $font-weight-black;

  &.mono {
    font-family: $font-mono;
  }
  &.highlight {
    color: var(--neo-green);
    background: black;
    padding: 2px 6px;
    display: inline-block;
    align-self: flex-start;
  }
}

.hash-box {
  background: var(--bg-elevated, #f5f5f5);
  border: 1px solid var(--border-color, black);
  padding: $space-3;
  color: var(--text-primary, #000);
}

.hash-value {
  margin-top: 4px;
}

.mono-small {
  font-family: $font-mono;
  font-size: 11px;
  word-break: break-all;
}

.method-card {
  padding: $space-4;
  background: var(--bg-elevated, #fafafa);
  border: 2px solid var(--border-color, black);
  margin-bottom: $space-4;
  color: var(--text-primary, #000);
  &:last-child {
    margin-bottom: 0;
  }
}

.method-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
}

.method-name {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 15px;
  color: var(--neo-purple);
}

.method-badge {
  font-size: 9px;
  font-weight: $font-weight-black;
  padding: 2px 8px;
  border: 1px solid black;
  text-transform: uppercase;

  &.write {
    background: var(--brutal-yellow);
  }
  &.read {
    background: var(--neo-green);
  }
}

.method-desc {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: $space-3;
  display: block;
}

.method-params {
  background: black;
  color: white;
  padding: $space-3;
}

.params-title {
  font-size: 9px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  display: block;
  margin-bottom: $space-2;
}

.param-item {
  display: flex;
  gap: $space-2;
  margin-bottom: 4px;
  font-size: 11px;
}

.param-name {
  color: var(--neo-green);
  font-family: $font-mono;
  min-width: 80px;
}
.param-type {
  color: var(--brutal-yellow);
  font-family: $font-mono;
  min-width: 60px;
}
.param-desc {
  opacity: 0.6;
  flex: 1;
}

.usage-steps {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.u-step {
  display: flex;
  gap: $space-4;
}

.u-num {
  font-family: $font-mono;
  font-size: 20px;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  opacity: 0.3;
}

.u-title {
  display: block;
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.u-text {
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.7;
  display: block;
}

.warning-box {
  background: #fff4e5;
  border: 2px solid #ffa500;
  padding: $space-4;
  display: flex;
  gap: $space-3;
  align-items: flex-start;
}

.warning-text {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: #663c00;
}

.mt-4 {
  margin-top: $space-4;
}
</style>
