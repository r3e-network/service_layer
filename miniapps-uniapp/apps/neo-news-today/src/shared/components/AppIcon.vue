<template>
  <view class="icon" :style="iconStyle" v-html="iconSvg"></view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { icons } from "./icons";

const props = defineProps<{
  name: string;
  size?: number;
  color?: string;
}>();

const iconSvg = computed(() => icons[props.name as keyof typeof icons] || icons.coin);

const iconStyle = computed(() => ({
  width: `${props.size || 24}px`,
  height: `${props.size || 24}px`,
  color: props.color || "currentColor",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}));
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
