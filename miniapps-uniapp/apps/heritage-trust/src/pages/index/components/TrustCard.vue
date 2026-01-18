<template>
  <NeoCard variant="erobo" class="trust-document-card">
    <view class="official-banner">{{ t("officialTrust") }}</view>
    
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
        <view class="asset-item neo">
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
            <text class="timeline-date">
              {{ trust.daysRemaining > 0 ? `${trust.daysRemaining} ${t("days")}` : t("ready") }}
            </text>
          </view>
        </view>
        <view class="timeline-line"></view>
        <view class="timeline-item">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-title">{{ t("trustActivates") }}</text>
            <text class="timeline-date">{{ trust.deadline }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="document-actions">
      <NeoButton variant="secondary" size="sm" @click="$emit('heartbeat', trust)">
        {{ t("heartbeat") }}
      </NeoButton>
      <NeoButton variant="primary" size="sm" @click="$emit('claimYield', trust)">
        {{ t("claimYield") }}
      </NeoButton>
      <NeoButton variant="warning" size="sm" :disabled="!trust.canExecute" @click="$emit('execute', trust)">
        {{ t("executeTrust") }}
      </NeoButton>
    </view>

    <!-- Document Footer -->
    <view class="document-footer">
      <text class="footer-text">{{ t("documentId") }}: {{ trust.id }}</text>
      <text class="footer-signature">✍️ {{ t("digitalSignature") }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { AppIcon, NeoButton, NeoCard } from "@/shared/components";

export interface Trust {
  id: string;
  name: string;
  beneficiary: string;
  neoValue: number;
  icon: string;
  status: "active" | "pending" | "triggered" | "executed";
  daysRemaining: number;
  deadline: string;
  canExecute: boolean;
}

defineProps<{
  trust: Trust;
  t: (key: string) => string;
}>();

defineEmits(["heartbeat", "claimYield", "execute"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.trust-document-card {
  margin-bottom: $space-6;
  position: relative;
  overflow: hidden;
}

.official-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.2em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-6 0 $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.document-seal {
  background: rgba(159, 157, 243, 0.15);
  color: #9f9df3;
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid rgba(159, 157, 243, 0.3);
  display: flex;
  align-items: center;
  gap: $space-2;
  box-shadow: 0 0 15px rgba(159, 157, 243, 0.2);
}
.seal-icon {
  font-size: 18px;
}
.seal-text {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.document-status {
  padding: 6px 14px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  
  &.active {
    background: rgba(0, 229, 153, 0.1);
    color: #00e599;
    border-color: rgba(0, 229, 153, 0.3);
  }
  &.pending {
    background: rgba(255, 222, 89, 0.1);
    color: #ffde59;
    border-color: rgba(255, 222, 89, 0.3);
  }
  &.triggered {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
  &.executed {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
    border-color: rgba(148, 163, 184, 0.3);
  }
}

.document-title {
  text-align: center;
  margin: $space-6 0;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  color: var(--text-primary);
}
.title-text {
  font-size: 24px;
  font-weight: 800;
  display: block;
  text-transform: uppercase;
  color: var(--text-primary);
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}
.title-subtitle {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
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
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  padding: 0;
  background: transparent;
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
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);

  &.gas {
    border-color: rgba(255, 222, 89, 0.3);
    background: linear-gradient(135deg, rgba(255, 222, 89, 0.1), transparent);
  }

  &.neo {
    border-color: rgba(0, 229, 153, 0.3);
    background: linear-gradient(135deg, rgba(0, 229, 153, 0.1), transparent);
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: $space-4;
  margin-bottom: $space-6;
  color: var(--text-primary);
}
.beneficiary-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 8px;
}
.beneficiary-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  border-bottom: none;
}
.beneficiary-address {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.2);
  padding: $space-3;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: block;
  margin: $space-2 0;
  word-break: break-all;
  color: var(--text-primary);
}
.beneficiary-allocation {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 12px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 8px;
  color: var(--text-primary);
}

.trigger-section {
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  padding: $space-5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
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
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-primary);
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
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  background: transparent;
  &.active {
    background: #00e599;
    border-color: #00e599;
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.4);
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
  color: #ffde59;
  font-weight: 600;
}

.document-actions {
  display: flex;
  gap: $space-2;
  justify-content: space-between;
  margin: $space-4 0;
}

.document-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: $space-3;
  margin-top: $space-4;
  color: var(--text-secondary);
}
.footer-signature {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
</style>
