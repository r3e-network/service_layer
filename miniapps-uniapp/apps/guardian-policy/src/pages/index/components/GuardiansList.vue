<template>
  <NeoCard :title="'👥 ' + t('guardians')" class="guardians-card" variant="erobo">
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.guardian-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: $space-4;
  transition: all 0.2s ease;
  color: white;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }
}
.guardian-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.guardian-name {
  font-weight: 700;
  font-size: 14px;
  display: block;
  color: white;
  margin-bottom: 2px;
}
.guardian-role {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  display: block;
}
.guardian-status {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.active {
    background: rgba(0, 229, 153, 0.1);
    color: #00E599;
    border: 1px solid rgba(0, 229, 153, 0.2);
  }
  &.inactive {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
.status-dot { font-size: 8px; }
</style>
