<template>
  <NeoCard variant="erobo-bitcoin" class="hero-apy-card mb-6 text-center">
    <div class="ambient-glow"></div>
    <view class="burger-icon"><AppIcon name="burger" :size="64" /></view>
    <text class="hero-label-glass">{{ t("currentApy") }}</text>
    <text class="hero-value-glass">{{ animatedApy }}%</text>
    <text class="hero-subtitle-glass">{{ t("liquidStaking") }}</text>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.hero-apy-card {
  padding: 20px 10px !important;
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
    background: radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    animation: pulse-glow 4s ease-in-out infinite;
  }

  .burger-icon, .hero-label-glass, .hero-value-glass, .hero-subtitle-glass {
     position: relative;
     z-index: 1;
  }
}

.hero-label-glass {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.hero-value-glass {
  display: block;
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
  font-family: $font-family;
}

.hero-subtitle-glass {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.burger-icon {
  margin-bottom: 12px;
  color: #FBBF24;
  filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

@keyframes pulse-glow {
  0% { opacity: 0.5; transform: scale(0.95) translate(-50%, -50%); }
  50% { opacity: 0.8; transform: scale(1.05) translate(-50%, -50%); }
  100% { opacity: 0.5; transform: scale(0.95) translate(-50%, -50%); }
}
</style>
