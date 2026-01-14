<template>
  <NeoCard class="create-card" variant="erobo-neo">
    <NeoInput
      :modelValue="assetType"
      @update:modelValue="$emit('update:assetType', $event)"
      :placeholder="t('assetType')"
      class="input"
    />
    <NeoInput
      :modelValue="coverage"
      @update:modelValue="$emit('update:coverage', $event)"
      :placeholder="t('coverageAmount')"
      type="number"
      suffix="GAS"
      class="input"
    />
    <NeoInput
      :modelValue="threshold"
      @update:modelValue="$emit('update:threshold', $event)"
      :placeholder="t('thresholdPercent')"
      type="number"
      suffix="%"
      class="input"
    />

    <view class="price-row">
      <NeoInput
        :modelValue="startPrice"
        @update:modelValue="$emit('update:startPrice', $event)"
        :placeholder="t('startPrice')"
        type="number"
        suffix="USD"
        class="input"
      />
      <NeoButton size="sm" variant="secondary" class="price-btn" :loading="isFetchingPrice" @click="$emit('fetchPrice')">
        {{ t("fetchPrice") }}
      </NeoButton>
    </view>

    <text class="premium-note">{{ t("premiumNote").replace("{premium}", premium || "0") }}</text>

    <NeoButton variant="primary" size="lg" block @click="$emit('create')">
      {{ t("createPolicy") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

const props = defineProps<{
  assetType: string;
  coverage: string;
  threshold: string;
  startPrice: string;
  premium: string;
  isFetchingPrice: boolean;
  t: (key: string) => string;
}>();

defineEmits([
  "update:assetType",
  "update:coverage",
  "update:threshold",
  "update:startPrice",
  "fetchPrice",
  "create",
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.create-card { margin-top: $space-6; }
.price-row {
  display: flex;
  align-items: flex-end;
  gap: $space-3;
  margin-bottom: $space-3;
}

.price-btn {
  height: 36px;
}

.premium-note {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: $space-4;
  display: block;
}
</style>
