<template>
  <view class="trust-document">
    <!-- Document Header -->
    <view class="document-header">
      <view class="document-seal">
        <text class="seal-icon">{{ trust.icon }}</text>
        <text class="seal-text">{{ t("sealed") }}</text>
      </view>
      <view class="document-status" :class="trust.status">
        <text class="status-dot">●</text>
        <text class="status-text">{{ t(trust.status) }}</text>
      </view>
    </view>

    <!-- Trust Title -->
    <view class="document-title">
      <text class="title-text">{{ trust.name }}</text>
      <text class="title-subtitle">{{ t("trustDocument") }}</text>
    </view>

    <!-- Asset Allocation -->
    <view class="asset-section">
      <view class="asset-header">
        <text class="asset-label">{{ t("totalAssets") }}</text>
      </view>
      <view class="dual-assets">
        <view v-if="trust.gasValue > 0" class="asset-item gas">
          <AppIcon name="gas" :size="24" class="asset-icon" />
          <text class="asset-amount">{{ trust.gasValue }}</text>
          <text class="asset-symbol">GAS</text>
        </view>
        <view v-if="trust.neoValue > 0" class="asset-item neo">
          <AppIcon name="neo" :size="24" class="asset-icon" />
          <text class="asset-amount">{{ trust.neoValue }}</text>
          <text class="asset-symbol">NEO</text>
        </view>
      </view>
    </view>

    <!-- Beneficiary Card -->
    <view class="beneficiary-card">
      <view class="beneficiary-header">
        <text class="beneficiary-icon">👤</text>
        <text class="beneficiary-label">{{ t("beneficiary") }}</text>
      </view>
      <text class="beneficiary-address">{{ trust.beneficiary }}</text>
      <view class="beneficiary-allocation">
        <text class="allocation-label">{{ t("allocation") }}:</text>
        <text class="allocation-value">100%</text>
      </view>
    </view>

    <!-- Trigger Conditions -->
    <view class="trigger-section">
      <view class="trigger-header">
        <text class="trigger-icon">⏱️</text>
        <text class="trigger-label">{{ t("triggerCondition") }}</text>
      </view>
      <view class="trigger-timeline">
        <view class="timeline-item">
          <view class="timeline-dot active"></view>
          <view class="timeline-content">
            <text class="timeline-title">{{ t("trustCreated") }}</text>
            <text class="timeline-date">{{ t("now") }}</text>
          </view>
        </view>
        <view class="timeline-line"></view>
        <view class="timeline-item">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-title">{{ t("inactivityPeriod") }}</text>
            <text class="timeline-date">90 {{ t("days") }}</text>
          </view>
        </view>
        <view class="timeline-line"></view>
        <view class="timeline-item">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-title">{{ t("trustActivates") }}</text>
            <text class="timeline-date">{{ t("automatic") }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Document Footer -->
    <view class="document-footer">
      <text class="footer-text">{{ t("documentId") }}: {{ trust.id }}</text>
      <text class="footer-signature">✍️ {{ t("digitalSignature") }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { AppIcon } from "@/shared/components";

export interface Trust {
  id: string;
  name: string;
  beneficiary: string;
  gasValue: number;
  neoValue: number;
  icon: string;
  status: "active" | "pending" | "triggered" | "executed";
}

defineProps<{
  trust: Trust;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.trust-document {
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 10px 10px 0 var(--shadow-color, black);
  margin-bottom: $space-8;
  padding: $space-6;
  position: relative;
  color: var(--text-primary, black);
  &::before {
    content: "OFFICIAL TRUST";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: black;
    color: var(--brutal-yellow);
    font-size: 10px;
    font-weight: $font-weight-black;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 2px;
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-6 0 $space-4;
  border-bottom: 3px solid black;
  padding-bottom: $space-3;
}
.document-seal {
  background: black;
  color: white;
  padding: 4px 12px;
  border: 2px solid black;
  display: flex;
  align-items: center;
  gap: $space-2;
  box-shadow: 3px 3px 0 var(--brutal-red);
}
.seal-icon {
  font-size: 18px;
}
.seal-text {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.document-status {
  padding: 4px 12px;
  border: 3px solid var(--border-color, black);
  font-weight: $font-weight-black;
  font-size: 10px;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 var(--shadow-color, black);
  &.active {
    background: var(--neo-green);
  }
  &.pending {
    background: var(--brutal-yellow);
  }
  &.triggered {
    background: var(--brutal-red);
    color: white;
  }
}

.document-title {
  text-align: center;
  margin: $space-6 0;
  padding: $space-4;
  background: var(--bg-elevated, #eee);
  border: 3px solid var(--border-color, black);
  box-shadow: inset 4px 4px 0 var(--shadow-color, rgba(0, 0, 0, 0.1));
  color: var(--text-primary, black);
}
.title-text {
  font-size: 24px;
  font-weight: $font-weight-black;
  display: block;
  text-transform: uppercase;
  border-bottom: 2px solid black;
}
.title-subtitle {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 1;
  text-transform: uppercase;
  margin-top: 4px;
  display: block;
}

.asset-section {
  margin-bottom: $space-6;
}
.asset-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-3;
}
.asset-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: black;
  color: white;
  padding: 2px 8px;
}

.dual-assets {
  display: flex;
  gap: $space-3;
  margin-top: $space-3;
}

.asset-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  border: 3px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);

  &.gas {
    background: var(--brutal-yellow);
  }

  &.neo {
    background: var(--neo-green);
  }
}

.asset-icon {
  flex-shrink: 0;
}

.asset-amount {
  font-size: 18px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.asset-symbol {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.beneficiary-card {
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  padding: $space-4;
  margin-bottom: $space-6;
  box-shadow: 5px 5px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
}
.beneficiary-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 8px;
}
.beneficiary-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border-bottom: 2px solid black;
}
.beneficiary-address {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: $font-weight-black;
  background: var(--bg-elevated, #eee);
  padding: $space-3;
  border: 2px solid var(--border-color, black);
  display: block;
  margin: $space-2 0;
  word-break: break-all;
  color: var(--text-primary, black);
}
.beneficiary-allocation {
  display: flex;
  justify-content: space-between;
  font-weight: $font-weight-black;
  font-size: 12px;
  margin-top: 8px;
  border-top: 2px solid black;
  padding-top: 4px;
}

.trigger-section {
  background: black;
  color: white;
  padding: $space-5;
  border: 3px solid black;
  margin-bottom: $space-6;
}
.trigger-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-4;
}
.trigger-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: var(--brutal-yellow);
}
.trigger-timeline {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.timeline-item {
  display: flex;
  align-items: center;
  gap: $space-4;
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  background: transparent;
  &.active {
    background: var(--brutal-green);
    border-color: var(--brutal-green);
  }
}
.timeline-line {
  width: 2px;
  height: 20px;
  background: #444;
  margin-left: 5px;
}
.timeline-title {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.timeline-date {
  font-size: 10px;
  color: var(--brutal-yellow);
  font-weight: $font-weight-black;
}

.document-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: $font-weight-black;
  border-top: 3px solid black;
  padding-top: $space-3;
  margin-top: $space-4;
}
.footer-signature {
  background: var(--bg-elevated, #eee);
  padding: 2px 8px;
  border: 1px solid var(--border-color, black);
  color: var(--text-primary, black);
}
</style>
