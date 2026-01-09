<template>
  <NeoCard :title="t('availableEnvelopes')" variant="default">
    <view v-if="loadingEnvelopes" class="empty-state">{{ t("loadingEnvelopes") }}</view>
    <view v-else-if="!envelopes.length" class="empty-state">{{ t("noEnvelopes") }}</view>
    <view v-else class="envelope-list">
      <view
        v-for="env in envelopes"
        :key="env.id"
        class="glass-envelope"
        :class="{ disabled: !env.canClaim }"
        @click="$emit('claim', env)"
      >
        <view class="envelope-content">
          <view class="envelope-icon">
            <text class="envelope-symbol">福</text>
          </view>
          <view class="envelope-info">
            <text class="envelope-from">{{ env.from }}</text>
            <text class="envelope-detail">
              {{ t("remaining").replace("{0}", String(env.remaining)).replace("{1}", String(env.total)) }}
            </text>
          </view>
          <view class="envelope-status">
            <text
              class="status-badge"
              :class="{
                'status-ready': env.canClaim,
                'status-pending': !env.ready && !env.expired,
                'status-expired': env.expired,
              }"
            >
              {{ env.expired ? t("expired") : env.ready ? t("ready") : t("notReady") }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

type EnvelopeItem = {
  id: string;
  creator: string;
  from: string;
  total: number;
  remaining: number;
  totalAmount: number;
  ready: boolean;
  expired: boolean;
  canClaim: boolean;
};

defineProps<{
  envelopes: EnvelopeItem[];
  loadingEnvelopes: boolean;
  openingId: string | null;
  t: (key: string) => string;
}>();

defineEmits(["claim"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.envelope-list { display: flex; flex-direction: column; gap: 16px; }

.glass-envelope {
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  
  &:hover:not(.disabled) {
    background: var(--bg-card, rgba(255, 255, 255, 0.05));
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.envelope-content { display: flex; align-items: center; gap: 16px; width: 100%; }

.envelope-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #FF4D4D 0%, #CC0000 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(255, 77, 77, 0.2);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

.envelope-symbol {
  font-size: 24px;
  font-weight: 700;
  color: #FFDE59;
}

.envelope-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.envelope-from {
  font-family: 'Inter', monospace;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.envelope-detail {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.status-badge {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 100px;
  display: inline-block;
  
  &.status-ready {
    background: rgba(0, 229, 153, 0.1);
    color: #00E599;
    border: 1px solid rgba(0, 229, 153, 0.2);
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.1);
  }
  
  &.status-pending {
    background: rgba(255, 222, 89, 0.1);
    color: #FFDE59;
    border: 1px solid rgba(255, 222, 89, 0.2);
  }
  
  &.status-expired {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: var(--bg-card, rgba(255, 255, 255, 0.02));
}
</style>
