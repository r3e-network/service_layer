<template>
  <NeoCard :title="'👥 ' + t('guardians')" class="guardians-card">
    <view v-for="guardian in guardians" :key="guardian.id" class="guardian-row">
      <view class="guardian-avatar">{{ guardian.avatar }}</view>
      <view class="guardian-info">
        <text class="guardian-name">{{ guardian.name }}</text>
        <text class="guardian-role">{{ guardian.role }}</text>
      </view>
      <view :class="['guardian-status', guardian.active ? 'active' : 'inactive']">
        <text class="status-dot">●</text>
        <text class="status-text">{{ guardian.active ? t("active") : t("inactive") }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

export interface Guardian {
  id: string;
  name: string;
  role: string;
  avatar: string;
  active: boolean;
}

defineProps<{
  guardians: Guardian[];
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.guardian-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  margin-bottom: $space-4;
  transition: all $transition-fast;
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0 var(--shadow-color, black);
  }
}
.guardian-avatar {
  width: 50px;
  height: 50px;
  background: var(--bg-elevated, #eee);
  border: 3px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.guardian-name {
  font-weight: $font-weight-black;
  font-size: 16px;
  display: block;
  border-bottom: 2px solid black;
  margin-bottom: 4px; /* Added margin for spacing */
}
.guardian-role {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 1;
  color: var(--text-secondary, #666);
}
.guardian-status {
  margin-left: auto;
  padding: 4px 12px;
  border: 2px solid var(--border-color, black);
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 var(--shadow-color, black);
  display: flex; /* Ensure dot and text align */
  align-items: center;
  gap: 4px;
  &.active {
    background: var(--neo-green);
    color: black;
  }
  &.inactive {
    background: #bbb;
    color: black;
  }
}
</style>
