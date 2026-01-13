<template>
  <NeoCard :title="t('availableEnvelopes')" variant="erobo">
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
            <text v-if="env.name" class="envelope-name">{{ env.name }}</text>
            <text class="envelope-from">{{ env.from }}</text>
            <text class="envelope-detail">
              {{ t("remaining").replace("{0}", String(env.remaining)).replace("{1}", String(env.total)) }}
              · {{ env.totalAmount.toFixed(2) }} GAS
            </text>
            <view v-if="env.bestLuckAddress && env.bestLuckAmount" class="best-luck">
              <text class="best-luck-icon">🎉</text>
              <text class="best-luck-text"
                >{{ t("bestLuck") }}: {{ formatAddress(env.bestLuckAddress) }} ({{
                  (env.bestLuckAmount / 1e8).toFixed(4)
                }}
                GAS)</text
              >
            </view>
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
  name?: string;
  description?: string;
  total: number;
  remaining: number;
  totalAmount: number;
  bestLuckAddress?: string;
  bestLuckAmount?: number;
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

const formatAddress = (addr: string): string => {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.envelope-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.glass-envelope {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    filter: grayscale(0.5);
  }
}

.envelope-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.envelope-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.envelope-symbol {
  font-size: 24px;
  font-weight: 700;
  color: #ffde59;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.envelope-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.envelope-from {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.envelope-detail {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.envelope-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffde59;
  margin-bottom: 2px;
}

.best-luck {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 222, 89, 0.1);
  border-radius: 8px;
  width: fit-content;
}

.best-luck-icon {
  font-size: 12px;
}

.best-luck-text {
  font-size: 10px;
  font-weight: 600;
  color: #ffde59;
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
    color: #00e599;
    border: 1px solid rgba(0, 229, 153, 0.2);
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.1);
  }

  &.status-pending {
    background: rgba(255, 222, 89, 0.1);
    color: #ffde59;
    border: 1px solid rgba(255, 222, 89, 0.2);
  }

  &.status-expired {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  font-weight: 500;
  font-family: $font-family;
  color: rgba(255, 255, 255, 0.4);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}
</style>
