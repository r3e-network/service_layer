<template>
  <NeoModal
    :visible="visible"
    :title="t('youWon')"
    variant="success"
    closeable
    @close="$emit('close')"
  >
    <view class="win-content">
      <view class="win-icon">
        <AppIcon name="trophy" :size="64" />
      </view>
      <text class="win-amount">+{{ winAmount }} GAS</text>
    </view>
  </NeoModal>
</template>

<script setup lang="ts">
import { NeoModal, AppIcon } from "@/shared/components";

defineProps<{
  visible: boolean;
  winAmount: string;
  t: (key: string) => string;
}>();

defineEmits(["close"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.win-content {
  padding: 32px;
  text-align: center;
}

.win-amount {
  font-family: $font-mono;
  font-weight: 800;
  font-size: 36px;
  color: #00E599;
  display: block;
  margin-top: 24px;
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.4);
}
</style>
