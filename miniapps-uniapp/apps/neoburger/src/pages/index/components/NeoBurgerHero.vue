<template>
  <NeoCard class="hero-apy-card mb-6 text-center">
    <div class="ambient-glow"></div>
    <view class="burger-icon"><AppIcon name="burger" :size="64" /></view>
    <text class="hero-label">{{ t("currentApy") }}</text>
    <text class="hero-value">{{ animatedApy }}%</text>
    <text class="hero-subtitle">{{ t("liquidStaking") }}</text>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, AppIcon } from "@/shared/components";

defineProps<{
  animatedApy: string;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.hero-apy-card {
  padding: 40px 20px !important;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%) !important;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 30px;
  box-shadow: 0 0 40px rgba(234, 179, 8, 0.1);
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;

  .ambient-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(234, 179, 8, 0.2) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .burger-icon, .hero-label, .hero-value, .hero-subtitle {
     position: relative;
     z-index: 1;
  }

  .hero-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary, rgba(255, 255, 255, 0.6));
    margin-bottom: 8px;
  }

  .hero-value {
    display: block;
    font-size: 64px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
    font-family: 'Inter', sans-serif;
  }

  .hero-subtitle {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted, rgba(255, 255, 255, 0.4));
  }
}

.burger-icon {
  margin-bottom: 24px;
  color: #FBBF24;
  filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
}
</style>
