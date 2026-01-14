<template>
  <NeoCard variant="erobo-neo">
    <view class="input-group">
      <NeoInput
        :modelValue="name"
        @update:modelValue="$emit('update:name', $event)"
        :placeholder="t('namePlaceholder')"
      />
      <NeoInput
        :modelValue="description"
        @update:modelValue="$emit('update:description', $event)"
        :placeholder="t('descriptionPlaceholder')"
      />
      <NeoInput
        :modelValue="amount"
        @update:modelValue="$emit('update:amount', $event)"
        type="number"
        :placeholder="t('totalGasPlaceholder')"
        suffix="GAS"
      />
      <NeoInput
        :modelValue="count"
        @update:modelValue="$emit('update:count', $event)"
        type="number"
        :placeholder="t('packetsPlaceholder')"
      />
      <NeoInput
        :modelValue="expiryHours"
        @update:modelValue="$emit('update:expiryHours', $event)"
        type="number"
        :placeholder="t('expiryPlaceholder')"
        suffix="h"
      />
    </view>
    <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('create')" class="send-button">
      <view class="btn-content">
        <AppIcon name="envelope" :size="24" />
        <text class="button-text">{{ t("sendRedEnvelope") }}</text>
      </view>
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton, AppIcon } from "@/shared/components";

defineProps<{
  name: string;
  description: string;
  amount: string;
  count: string;
  expiryHours: string;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:name", "update:description", "update:amount", "update:count", "update:expiryHours", "create"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.input-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}
.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.button-text {
  font-weight: 800;
  text-transform: uppercase;
  font-family: $font-family;
  letter-spacing: 0.05em;
  font-size: 14px;
}
</style>
