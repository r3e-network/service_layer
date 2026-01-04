<template>
  <view class="mobile-container">
    <view class="app-layout">
      <view class="app-content">
        <slot />
      </view>
      <NavBar
        v-if="tabs && tabs.length > 0"
        :tabs="tabs"
        :active-tab="activeTab"
        @change="$emit('tab-change', $event)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import NavBar, { type NavTab } from "./NavBar.vue";

defineProps<{
  title?: string;
  showTopNav?: boolean;
  showBack?: boolean;
  tabs?: NavTab[];
  activeTab?: string;
  allowScroll?: boolean;
}>();

defineEmits<{
  (e: "back"): void;
  (e: "tab-change", tabId: string): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";

// Mobile container - centers the app and maintains aspect ratio
.mobile-container {
  width: 100%;
  height: 100vh;
  height: 100dvh; // Dynamic viewport height for mobile browsers
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: var(--bg-primary, #0a0a0a);
  overflow: hidden;
}

.app-layout {
  width: 100%;
  max-width: 430px; // iPhone 14 Pro Max width - standard mobile width
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0f0f0f);
  color: var(--text-primary, #ffffff);
  overflow: hidden;
  position: relative;

  // Subtle border on larger screens to define the app boundary
  @media (min-width: 480px) {
    border-left: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  }
}

.app-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  // Smooth scrolling
  scroll-behavior: smooth;

  // Hide scrollbar but keep functionality
  scrollbar-width: thin;
  scrollbar-color: var(--text-muted, #666) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--text-muted, #666);
    border-radius: 2px;
  }
}
</style>
