<template>
  <AppLayout :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange">
    <view class="container">
      <view class="hero">
        <text class="eyebrow">{{ t("appTitle") }}</text>
        <text class="title">{{ t("homeTitle") }}</text>
        <text class="subtitle">{{ t("homeSubtitle") }}</text>
      </view>

      <NeoCard class="action-card">
        <NeoButton variant="primary" size="lg" block @click="navigateToCreate">
          <text class="btn-icon">+</text> {{ t("createCta") }}
        </NeoButton>

        <view class="input-group">
          <text class="label">{{ t("loadTitle") }}</text>
          <view class="input-row">
            <input
              class="input"
              :placeholder="t('loadPlaceholder')"
              v-model="idInput"
            />
            <NeoButton variant="secondary" size="md" @click="loadTransaction" :disabled="!idInput">
              {{ t("loadButton") }}
            </NeoButton>
          </view>
        </view>
      </NeoCard>

      <view class="recent-section">
        <text class="section-title">{{ t("recentTitle") }}</text>
        <view v-if="history.length === 0" class="empty-state">
          <text class="empty-text">{{ t("recentEmpty") }}</text>
        </view>
        <view v-else class="history-list">
          <NeoCard v-for="item in history" :key="item.id" class="history-item" @click="openHistory(item.id)">
            <view class="history-row">
              <text class="history-hash">{{ shorten(item.scriptHash) }}</text>
              <text class="history-status" :class="item.status">{{ statusLabel(item.status) }}</text>
            </view>
            <text class="history-time">{{ formatDate(item.createdAt) }}</text>
          </NeoCard>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { AppLayout, NeoCard, NeoButton } from "@/shared/components";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const tabs = computed(() => [
  { id: "home", label: t("tabHome"), icon: "home" },
  { id: "docs", label: t("tabDocs"), icon: "info" },
]);
const activeTab = ref("home");
const idInput = ref("");
const history = ref<any[]>([]);

onMounted(() => {
  const saved = uni.getStorageSync("multisig_history");
  if (saved) {
    try {
      history.value = JSON.parse(saved);
    } catch {}
  }
});

const handleTabChange = (tabId: string) => {
  if (tabId === "docs") {
    uni.navigateTo({ url: "/pages/docs/index" });
    return;
  }
  activeTab.value = tabId;
};

const navigateToCreate = () => {
  uni.navigateTo({ url: "/pages/create/index" });
};

const loadTransaction = () => {
  if (!idInput.value) return;
  uni.navigateTo({ url: `/pages/sign/index?id=${idInput.value}` });
};

const openHistory = (id: string) => {
  uni.navigateTo({ url: `/pages/sign/index?id=${id}` });
};

const statusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return t("statusPending");
    case "ready":
      return t("statusReady");
    case "broadcasted":
      return t("statusBroadcasted");
    case "cancelled":
      return t("statusCancelled");
    case "expired":
      return t("statusExpired");
    default:
      return t("statusUnknown");
  }
};

const shorten = (str: string) => str ? str.slice(0, 6) + "..." + str.slice(-4) : "";
const formatDate = (ts: string) => new Date(ts).toLocaleDateString();
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;

.container {
  padding: 24px;
}

.hero {
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(0, 229, 153, 0.7);
  display: block;
  margin-bottom: 12px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-primary);
  display: block;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  display: block;
}

.action-card {
  margin-bottom: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn-icon {
  margin-right: 8px;
  font-weight: 700;
}

.input-group {
  .label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 12px;
  }
}

.input-row {
  display: flex;
  gap: 12px;
}

.input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: white;
  font-size: 14px;
  
  &:focus {
    border-color: #00E599;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  display: block;
  color: var(--text-primary);
}

.empty-state {
  padding: 32px;
  text-align: center;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.history-item {
  margin-bottom: 12px;
  padding: 16px;
}

.history-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.history-hash {
  font-family: monospace;
  color: var(--text-primary);
}

.history-status {
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  
  &.pending {
    background: rgba(255, 193, 7, 0.1);
    color: #ffd700;
  }
  &.ready {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
  }
  &.broadcasted {
    background: rgba(0, 229, 153, 0.1);
    color: #00e599;
  }
  &.cancelled {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
  &.expired {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }
}

.history-time {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
