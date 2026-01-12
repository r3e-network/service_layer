<template>
  <view class="streak-display">
    <view class="streak-flames">
      <text v-for="i in Math.min(currentStreak, 7)" :key="i" class="flame">🔥</text>
      <text v-if="currentStreak === 0" class="flame-empty">💤</text>
    </view>
    <text class="streak-count">{{ currentStreak }} {{ t("dayStreak") }}</text>
    <text class="streak-best">{{ t("bestStreak") }}: {{ highestStreak }} {{ t("days") }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  currentStreak: number;
  highestStreak: number;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.streak-display {
  text-align: center;
  padding: 24px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.streak-flames {
  font-size: 32px;
  margin-bottom: 16px;
  letter-spacing: 4px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flame-empty { opacity: 0.5; }

.streak-count {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
  font-family: $font-family;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.streak-best {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}
</style>
