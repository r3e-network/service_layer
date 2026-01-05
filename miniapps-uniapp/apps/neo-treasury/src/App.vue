<template>
  <view class="app">
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("[Neo Treasury] App launched");
});
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
</style>
