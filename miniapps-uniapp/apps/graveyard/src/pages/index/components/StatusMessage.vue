<template>
  <view v-if="status" :class="['status-msg', status.type]">
    <text>{{ status.msg }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  status: { msg: string; type: string } | null;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.status-msg {
  text-align: center;
  padding: $space-4;
  border: 4px solid var(--border-color, black);
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 12px;
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  font-style: italic;
  &.success {
    background: var(--neo-green);
    color: black;
  }
  &.error {
    background: var(--brutal-red);
    color: white;
  }
}
</style>
