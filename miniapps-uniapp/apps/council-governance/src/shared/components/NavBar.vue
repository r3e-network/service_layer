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
  height: 56px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom, 0);
  flex-shrink: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  color: var(--text-tertiary);
  transition: color 0.2s ease;

  &.active {
    color: var(--color-accent, $neo-green);
  }
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
