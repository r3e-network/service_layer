<template>
  <NeoCard :title="'📋 ' + t('activePolicies')" class="policies-card" variant="erobo">
    <view class="policies-grid">
      <view v-for="policy in policies" :key="policy.id" class="policy-item-glass" :class="[policy.level, { 'disabled': !policy.enabled }]">
        <view class="level-stripe" :class="policy.level"></view>
        
        <view class="policy-content">
          <view class="policy-header">
            <text class="policy-name">{{ policy.name }}</text>
            <view class="level-badge" :class="policy.level">{{ getLevelText(policy.level) }}</view>
          </view>
          <text class="policy-desc">{{ policy.description }}</text>
        </view>

        <view class="policy-action">
          <NeoButton 
            :variant="policy.enabled ? 'primary' : 'secondary'" 
            size="sm" 
            class="toggle-btn"
            :class="{ 'active': policy.enabled }"
            @click="$emit('toggle', policy.id)"
          >
            <view class="toggle-track">
              <view class="toggle-thumb"></view>
            </view>
            <text class="toggle-label">{{ policy.enabled ? "ON" : "OFF" }}</text>
          </NeoButton>
        </view>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoButton } from "@/shared/components";

const LEVELS = ["low", "medium", "high", "critical"] as const;
export type Level = (typeof LEVELS)[number];

export interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: Level;
}

const props = defineProps<{
  policies: Policy[];
  t: (key: string) => string;
}>();

defineEmits(["toggle"]);

const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    low: props.t("levelLow"),
    medium: props.t("levelMedium"),
    high: props.t("levelHigh"),
    critical: props.t("levelCritical"),
  };
  return levelMap[level] || level;
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.policies-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.policy-item-glass {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  padding: 16px;
  padding-left: 20px; /* Space for stripe */
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(4px);
  }
  
  &.disabled {
    opacity: 0.6;
    background: rgba(0, 0, 0, 0.2);
    .level-stripe { background: rgba(255, 255, 255, 0.2); box-shadow: none; }
  }
}

.level-stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  
  &.low { background: #94a3b8; }
  &.medium { background: #00e599; box-shadow: 0 0 10px rgba(0, 229, 153, 0.3); }
  &.high { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
  &.critical { background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
}

.policy-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.policy-name {
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.level-badge {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  
  &.low { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); }
  &.medium { background: rgba(0, 229, 153, 0.1); color: #00e599; }
  &.high { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  &.critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
}

.policy-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
  
  &.active .toggle-thumb {
    background: #00e599;
    box-shadow: 0 0 8px #00e599;
  }
}

.toggle-track {
  width: 24px;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 99px;
  position: relative;
  display: flex;
  align-items: center;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-thumb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  
  /* Active state handled by parent class or manual transform if needed, 
     but for simplicity relying on color change for now. 
     To animate pos: transform: translateX(12px) when active */
}

.toggle-btn.active .toggle-thumb {
  transform: translateX(12px);
  background: #00e599;
}

.toggle-label {
  font-size: 10px;
  font-weight: 800;
  width: 20px;
  text-align: center;
}
</style>
