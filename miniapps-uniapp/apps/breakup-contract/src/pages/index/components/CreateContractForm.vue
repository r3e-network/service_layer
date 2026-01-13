<template>
  <NeoCard variant="erobo-neo" class="contract-card">
    <view class="document-header mb-6">
      <text class="document-title">{{ t("contractTitle") }}</text>
      <text class="document-seal">💕</text>
    </view>

    <view class="document-body">
      <view class="clause-box mb-6">
        <text class="document-clause">{{ t("clause1") }}</text>
      </view>

      <view class="form-group mb-4">
        <text class="form-label mb-2 block">{{ t("partnerLabel") }}</text>
        <NeoInput
          :modelValue="partnerAddress"
          @update:modelValue="$emit('update:partnerAddress', $event)"
          :placeholder="t('partnerPlaceholder')"
        />
      </view>

      <view class="form-group mb-4">
        <text class="form-label mb-2 block">{{ t("stakeLabel") }}</text>
        <NeoInput
          :modelValue="stakeAmount"
          @update:modelValue="$emit('update:stakeAmount', $event)"
          type="number"
          :placeholder="t('stakePlaceholder')"
          suffix="GAS"
        />
      </view>

      <view class="form-group mb-6">
        <text class="form-label mb-2 block">{{ t("durationLabel") }}</text>
        <NeoInput
          :modelValue="duration"
          @update:modelValue="$emit('update:duration', $event)"
          type="number"
          :placeholder="t('durationPlaceholder')"
          suffix="Days"
        />
      </view>

      <view class="signature-section mb-6">
        <text class="signature-label mb-2 block">{{ t("signatureLabel") }}</text>
        <view class="signature-box">
          <text class="signature-text mono">{{ address || t("connectWallet") }}</text>
        </view>
      </view>

      <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('create')">
        {{ isLoading ? t("creating") : t("createBtn") }}
      </NeoButton>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoInput, NeoButton, NeoCard } from "@/shared/components";

defineProps<{
  partnerAddress: string;
  stakeAmount: string;
  duration: string;
  address: string | null;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:partnerAddress", "update:stakeAmount", "update:duration", "create"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.document-title {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.1em;
}

.document-seal {
  font-size: 20px;
  text-shadow: 0 0 10px rgba(255, 105, 180, 0.4);
}

.clause-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.document-clause {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.form-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
}

.signature-section {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.signature-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.signature-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.signature-text {
  font-family: $font-mono;
  font-size: 11px;
  color: #FF6B6B;
  word-break: break-all;
}
</style>
