<template>
  <view class="contract-document">
    <view class="document-header">
      <text class="document-title">{{ t("contractTitle") }}</text>
      <view class="document-seal">
        <text class="seal-text">💕</text>
      </view>
    </view>

    <view class="document-body">
      <text class="document-clause">{{ t("clause1") }}</text>

      <view class="form-group">
        <text class="form-label">{{ t("partnerLabel") }}</text>
        <NeoInput
          :modelValue="partnerAddress"
          @update:modelValue="$emit('update:partnerAddress', $event)"
          :placeholder="t('partnerPlaceholder')"
        />
      </view>

      <view class="form-group">
        <text class="form-label">{{ t("stakeLabel") }}</text>
        <NeoInput
          :modelValue="stakeAmount"
          @update:modelValue="$emit('update:stakeAmount', $event)"
          type="number"
          :placeholder="t('stakePlaceholder')"
        />
      </view>

      <view class="form-group">
        <text class="form-label">{{ t("durationLabel") }}</text>
        <NeoInput
          :modelValue="duration"
          @update:modelValue="$emit('update:duration', $event)"
          type="number"
          :placeholder="t('durationPlaceholder')"
        />
      </view>

      <view class="signature-section">
        <text class="signature-label">{{ t("signatureLabel") }}</text>
        <view class="signature-line">
          <text class="signature-placeholder">{{ address || t("connectWallet") }}</text>
        </view>
      </view>

      <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('create')">
        {{ isLoading ? t("creating") : t("createBtn") }}
      </NeoButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { NeoInput, NeoButton } from "@/shared/components";

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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.contract-document {
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 10px 10px 0 var(--shadow-color, black);
  padding: $space-6;
  position: relative;
  color: var(--text-primary, black);
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: repeating-linear-gradient(45deg, var(--brutal-pink), var(--brutal-pink) 10px, black 10px, black 20px);
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  border-bottom: 2px dashed black;
  padding: $space-2 0;
}
.document-title {
  font-weight: $font-weight-black;
  font-size: 14px;
  text-transform: uppercase;
}
.document-seal {
  font-size: 24px;
  opacity: 0.5;
  filter: grayscale(1);
}

.document-clause {
  font-size: 8px;
  font-weight: $font-weight-bold;
  line-height: 1.4;
  padding: $space-3;
  border: 1px dashed var(--border-color, black);
  background: var(--bg-elevated, #f9f9f9);
  display: block;
  margin-bottom: $space-4;
  color: var(--text-primary, black);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;
}
.form-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}

.signature-section {
  border-top: 2px dashed black;
  padding-top: $space-4;
  margin-top: $space-2;
}
.signature-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  text-transform: uppercase;
}
.signature-line {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: $font-weight-black;
  color: var(--brutal-pink);
  padding: $space-2 0;
  border-bottom: 3px solid var(--brutal-pink);
}
</style>
