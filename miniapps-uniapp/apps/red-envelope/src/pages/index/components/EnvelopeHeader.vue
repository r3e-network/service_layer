<template>
  <view class="header-neo">
    <text class="title-neo">{{ t("title") }}</text>
    <text class="subtitle-neo">{{ t("subtitle") }}</text>
    <view class="decorations-neo">
      <view class="decoration-item"><AppIcon name="sparkle" :size="24" class="text-accent" /></view>
      <view class="decoration-item"><AppIcon name="gift" :size="24" class="text-white" /></view>
      <view class="decoration-item"><AppIcon name="sparkle" :size="24" class="text-accent" /></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { AppIcon } from "@/shared/components";

defineProps<{
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.header-neo {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px 0;
  position: relative;
}

.title-neo {
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
  display: block;
  font-family: 'Inter', sans-serif;
  letter-spacing: -1px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.subtitle-neo {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 16px;
}

.decorations-neo {
  display: flex;
  justify-content: center;
  gap: 16px;
  opacity: 0.6;
}

.decoration-item {
  color: #00E599;
}

.text-white { color: white; }
.text-accent { color: #00E599; }
</style>
