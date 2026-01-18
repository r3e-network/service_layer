<template>
  <view :class="['mobile-container', isEmbedded && 'embedded']">
    <view class="aspect-wrapper">
      <view class="app-layout">
        <TopNavBar
          v-if="showTopNav"
          :title="title ?? ''"
          :show-back="showBack"
          @back="$emit('back')"
        />
        <view class="app-content">
          <slot />
        </view>
        <NavBar
          v-if="tabs && tabs.length > 0"
          :tabs="tabs"
          :active-tab="safeActiveTab"
          @change="$emit('tab-change', $event)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import NavBar, { type NavTab } from "./NavBar.vue";
import TopNavBar from "./TopNavBar.vue";

const isEmbedded = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embedded") === "1";

const props = withDefaults(defineProps<{
  title?: string;
  showTopNav?: boolean;
  showBack?: boolean;
  tabs?: NavTab[];
  activeTab?: string;
  allowScroll?: boolean;
}>(), {
  title: '',
  showTopNav: false,
  showBack: false,
  tabs: () => [],
  activeTab: '',
  allowScroll: true
});

defineEmits<{
  (e: "back"): void;
  (e: "tab-change", tabId: string): void;
}>();

const safeActiveTab = computed(() => (props.activeTab as string) || '');
</script>

<style lang="scss">
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/theme.scss" as *;

// Global reset
:global(*) {
  box-sizing: border-box;
}

:global(body), :global(page) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary, #05060d);
  font-family: $font-family;
  -webkit-font-smoothing: antialiased;
}

// iPhone 14 Pro Max aspect ratio: 430 x 932
$aspect-ratio: calc(516 / 932);

// Mobile container
.mobile-container {
  width: 100%;
  height: 100%;
  background: var(--bg-primary, #05060d);
  overflow: hidden;
  position: relative;
}

:global(uni-page-body), :global(uni-page-wrapper) {
  height: 100%;
}

.aspect-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.app-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #05060d);
  background-image:
    radial-gradient(circle at 50% 0%, rgba(159, 157, 243, 0.12) 0%, transparent 60%),
    radial-gradient(circle at 85% 35%, rgba(247, 170, 199, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 15% 70%, rgba(248, 215, 194, 0.16) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.01) 0%, transparent 100%);
  color: var(--text-primary, #ffffff);
  overflow: hidden;
  position: relative;
}

// Embedded mode support (now consistent with default)
.mobile-container.embedded {
  .app-layout {
    height: 100% !important;
    max-height: 100% !important;
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
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}
</style>
