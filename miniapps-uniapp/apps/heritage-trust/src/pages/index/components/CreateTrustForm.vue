<template>
  <NeoCard :title="t('createTrust')" variant="erobo-neo">
    <view class="form-section">
      <view class="form-label">
        <text class="label-icon">📋</text>
        <text class="label-text">{{ t("trustDetails") }}</text>
      </view>
      <NeoInput :modelValue="name" @update:modelValue="$emit('update:name', $event)" :placeholder="t('trustName')" />
    </view>

    <view class="form-section">
      <view class="form-label">
        <text class="label-icon">👤</text>
        <text class="label-text">{{ t("beneficiaryInfo") }}</text>
      </view>
      <NeoInput
        :modelValue="beneficiary"
        @update:modelValue="$emit('update:beneficiary', $event)"
        :placeholder="t('beneficiaryAddress')"
      />
    </view>

    <view class="form-section">
      <view class="form-label">
        <text class="label-icon">💰</text>
        <text class="label-text">{{ t("assetAmount") }}</text>
      </view>
      <view class="dual-asset-inputs">
        <view class="asset-input">
          <NeoInput
            :modelValue="gasValue"
            @update:modelValue="$emit('update:gasValue', $event)"
            type="number"
            placeholder="0"
            suffix-icon="gas"
            suffix="GAS"
          />
        </view>
        <view class="asset-input">
          <NeoInput
            :modelValue="neoValue"
            @update:modelValue="$emit('update:neoValue', $event)"
            type="number"
            placeholder="0"
            suffix-icon="neo"
            suffix="NEO"
          />
        </view>
      </view>
      <text class="asset-hint">{{ t("assetHint") }}</text>
    </view>

    <view class="info-banner">
      <text class="info-icon">ℹ️</text>
      <view class="info-content">
        <text class="info-title">{{ t("importantNotice") }}</text>
        <text class="info-text">{{ t("infoText") }}</text>
      </view>
    </view>

    <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('create')">
      {{ t("createTrust") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  name: string;
  beneficiary: string;
  gasValue: string;
  neoValue: string;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:name", "update:beneficiary", "update:gasValue", "update:neoValue", "create"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.form-section {
  margin-bottom: $space-4;
}
.form-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: 6px;
}
.label-text {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: white;
  opacity: 0.9;
}

.info-banner {
  background: rgba(255, 222, 89, 0.1);
  border: 1px solid rgba(255, 222, 89, 0.3);
  border-radius: 12px;
  padding: $space-4;
  display: flex;
  gap: $space-4;
  margin-bottom: $space-6;
  backdrop-filter: blur(10px);
}
.info-title {
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
  color: #ffde59;
  letter-spacing: 0.1em;
}
.info-text {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
}

.dual-asset-inputs {
  display: flex;
  gap: $space-3;
}

.asset-input {
  flex: 1;
}

.asset-hint {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: $space-2;
  font-weight: 500;
  font-style: italic;
}
</style>
