<template>
  <view class="destruction-chamber">
    <view class="chamber-header">
      <text class="chamber-icon">🔥</text>
      <text class="chamber-title">{{ t("destroyAsset") }}</text>
    </view>

    <view class="input-container">
      <NeoInput
        :modelValue="assetHash"
        @update:modelValue="$emit('update:assetHash', $event)"
        :placeholder="t('assetHashPlaceholder')"
        type="text"
      />
    </view>

    <!-- Animated Warning -->
    <view class="warning-box" :class="{ shake: showWarningShake }">
      <view class="warning-icon-container">
        <text class="warning-icon">⚠️</text>
      </view>
      <view class="warning-content">
        <text class="warning-title">{{ t("warning") }}</text>
        <text class="warning-text">{{ t("warningText") }}</text>
      </view>
    </view>

    <!-- Destruction Button with Fire Effect -->
    <view class="destroy-btn-container">
      <view class="fire-particles" v-if="isDestroying">
        <view v-for="i in 12" :key="i" :class="['particle', `particle-${i}`]"></view>
      </view>
      <NeoButton variant="danger" size="lg" block @click="$emit('initiate')" :class="{ destroying: isDestroying }">
        <text class="btn-icon">{{ isDestroying ? "🔥" : "💀" }}</text>
        <text>{{ isDestroying ? t("destroying") : t("destroyForever") }}</text>
      </NeoButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  assetHash: string;
  isDestroying: boolean;
  showWarningShake: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:assetHash", "initiate"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.destruction-chamber {
  padding: $space-8;
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 12px 12px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
}
.chamber-header {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-8;
  border-bottom: 6px solid var(--border-color, black);
  padding-bottom: $space-3;
}
.chamber-title {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--text-primary, black);
  text-transform: uppercase;
  font-style: italic;
}

.input-container {
  margin-bottom: $space-6;
}

.warning-box {
  display: flex;
  gap: $space-5;
  background: #ff7e7e;
  color: black;
  padding: $space-6;
  border: 4px solid var(--border-color, black);
  margin-bottom: $space-8;
  box-shadow: 8px 8px 0 var(--shadow-color, black);
  &.shake {
    animation: shake 0.5s ease-in-out;
  }
}

.warning-icon {
  font-size: 40px;
}
.warning-title {
  font-weight: $font-weight-black;
  font-size: 16px;
  text-transform: uppercase;
  border-bottom: 3px solid black;
  margin-bottom: 8px;
  display: inline-block;
  font-style: italic;
}
.warning-text {
  font-size: 12px;
  font-weight: $font-weight-black;
  line-height: 1.2;
  text-transform: uppercase;
}

.destroy-btn-container {
  position: relative;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0) rotate(0);
  }
  25% {
    transform: translateX(-8px) rotate(-1deg);
  }
  75% {
    transform: translateX(8px) rotate(1deg);
  }
}
</style>
