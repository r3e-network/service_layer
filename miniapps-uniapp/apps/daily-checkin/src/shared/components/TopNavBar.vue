<template>
  <view class="top-navbar">
    <view class="nav-left">
      <view v-if="showBack" class="nav-btn" @click="$emit('back')">
        <AppIcon name="arrow-left" :size="20" />
      </view>
    </view>
    <view class="nav-center">
      <text class="nav-title">{{ title }}</text>
    </view>
    <view class="nav-right">
      <slot name="right" />
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

defineProps<{
  title: string;
  showBack?: boolean;
}>();

defineEmits<{
  (e: "back"): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.top-navbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $space-4;
  background: var(--bg-card);
  border-bottom: $border-width-md solid $neo-black;
  flex-shrink: 0;
}

.nav-left,
.nav-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.nav-right {
  justify-content: flex-end;
}

.nav-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-primary, #ffffff);

  &:active {
    background: var(--bg-secondary, #1a1a1a);
  }
}

.nav-center {
  flex: 1;
  text-align: center;
}

.nav-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
