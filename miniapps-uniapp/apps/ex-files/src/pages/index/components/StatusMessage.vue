<template>
  <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
    <text class="status-text font-bold uppercase">{{ status.msg }}</text>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  status: { msg: string; type: string } | null;
}>();
</script>
