<template>
  <NeoCard :title="t('createEnvelope')" variant="default">
    <view class="input-group">
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
  amount: string;
  count: string;
  expiryHours: string;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:amount", "update:count", "update:expiryHours", "create"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.input-group { display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px; }
.btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
.button-text { font-weight: 700; text-transform: uppercase; font-family: 'Inter', sans-serif; }
</style>
