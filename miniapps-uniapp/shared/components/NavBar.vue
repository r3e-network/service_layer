<template>
  <view class="navbar">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      :class="['nav-item', activeTab === tab.id && 'active']"
      @click="$emit('change', tab.id)"
    >
      <view class="nav-icon">
        <AppIcon :name="tab.icon" :size="22" />
      </view>
      <text class="nav-label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

export interface NavTab {
  id: string;
  icon: string;
  label: string;
}

defineProps<{
  tabs: NavTab[];
  activeTab: string;
}>();

defineEmits<{
  (e: "change", tabId: string): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.navbar {
  height: 64px;
  min-height: 64px;
  background: var(--bg-secondary, rgba(10, 10, 10, 0.8));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom, 0);
  flex-shrink: 0;
  position: relative;
  z-index: 10;

  // Subtle top glow effect
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--neo-green, #00e599) 50%, transparent 100%);
    opacity: 0.5;
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
  }
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  color: var(--text-muted, #666666);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 2px;
    background: var(--neo-green, #00e599);
    border-radius: 1px;
    transition: transform 0.2s ease;
  }

  &.active {
    color: var(--neo-green, #00e599);

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.nav-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
