<template>
  <NeoCard :title="title" variant="default" class="reading-card">
    <view class="fortune-container">
      <text class="fortune-icon">🔮</text>
      <text class="reading-text">{{ reading }}</text>
      <view class="mystical-divider">
        <text>✦ ✦ ✦</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  title: string;
  reading: string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.reading-card {
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  box-shadow: none;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  backdrop-filter: blur(10px);
  color: white;
  border-radius: 24px;
}

.fortune-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
}

.fortune-icon {
  font-size: 64px;
  filter: drop-shadow(0 0 20px rgba(138, 43, 226, 0.5));
}

.reading-text {
  font-family: $font-mono;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  display: block;
  line-height: 1.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
}

.mystical-divider {
  color: #00E599;
  font-weight: 700;
  letter-spacing: 12px;
  font-size: 20px;
  opacity: 0.8;
}
</style>
