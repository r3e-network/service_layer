<template>
  <view :class="['mobile-container', isEmbedded && 'embedded']">
    <view class="aspect-wrapper">
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
  </view>
</template>

<script setup lang="ts">
import NavBar, { type NavTab } from "./NavBar.vue";

const isEmbedded = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embedded") === "1";

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

// iPhone 14 Pro Max aspect ratio: 430 x 932 = 0.461
$aspect-ratio: calc(430 / 932);

// Mobile container - centers the app
.mobile-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-primary, #0a0a0a);
  overflow: hidden;
}

// Aspect ratio wrapper - maintains mobile proportions
.aspect-wrapper {
  height: 100%;
  max-height: 100%;
  aspect-ratio: $aspect-ratio;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.app-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0f0f0f);
  color: var(--text-primary, #ffffff);
  overflow: hidden;
  position: relative;
  border-left: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

// Embedded mode: fill container completely (use 100% instead of viewport units for iframe)
.mobile-container.embedded {
  height: 100%;
  max-height: 100%;

  .aspect-wrapper {
    aspect-ratio: unset;
    width: 100%;
    height: 100%;
    max-height: 100%;
  }

  .app-layout {
    border: none;
    height: 100%;
    max-height: 100%;
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
  scroll-behavior: smooth;
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
