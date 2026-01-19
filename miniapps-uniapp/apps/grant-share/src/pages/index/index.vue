<template>
  <AppLayout class="theme-grant-share" :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="status-title">{{ t("wrongChain") }}</text>
            <text class="status-detail">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
              t("switchToNeo")
            }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Status Message -->
      <NeoCard v-if="statusMessage" :variant="statusType === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold uppercase tracking-wider">{{ statusMessage }}</text>
      </NeoCard>

      <!-- Grants Tab -->
      <view v-if="activeTab === 'grants'" class="tab-content">
        <!-- Active Grants Section -->
        <view class="grants-section">

          <view v-if="loading" class="empty-state">
            <text class="empty-text">{{ t("loading") }}</text>
          </view>

          <view v-else-if="fetchError" class="empty-state">
            <text class="empty-text">{{ t("loadFailed") }}</text>
          </view>

          <view v-else-if="grants.length === 0" class="empty-state">
            <text class="empty-text">{{ t("noActiveGrants") }}</text>
          </view>

          <!-- Grant Cards -->
          <view v-else class="grants-list">
            <NeoCard v-for="grant in grants" :key="grant.id" variant="erobo-neo" class="grant-card-neo">
              <view class="grant-card-header">
                <view class="grant-info">
                  <text class="grant-title-glass">{{ grant.title }}</text>
                  <text v-if="grant.proposer" class="grant-creator-glass">{{ t("by") }} {{ grant.proposer }}</text>
                </view>
                <view :class="['grant-badge-glass', grant.state]">
                  <text class="badge-text">{{ getStatusLabel(grant.state) }}</text>
                </view>
              </view>

              <view class="proposal-meta">
                <text v-if="grant.onchainId !== null" class="meta-item">#{{ grant.onchainId }}</text>
                <text v-if="grant.createdAt" class="meta-item">{{ formatDate(grant.createdAt) }}</text>
              </view>

              <view class="proposal-stats">
                <view class="stat-chip accept">{{ t("votesFor") }} {{ formatCount(grant.votesAccept) }}</view>
                <view class="stat-chip reject">{{ t("votesAgainst") }} {{ formatCount(grant.votesReject) }}</view>
                <view class="stat-chip comments">{{ t("comments") }} {{ formatCount(grant.comments) }}</view>
              </view>

              <view class="proposal-actions">
                <NeoButton
                  size="sm"
                  variant="secondary"
                  :disabled="!grant.discussionUrl"
                  @click="copyLink(grant.discussionUrl)"
                >
                  {{ grant.discussionUrl ? t("copyDiscussion") : t("noDiscussion") }}
                </NeoButton>
              </view>
            </NeoCard>
          </view>
        </view>
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content">
        <!-- Grant Pool Overview -->
        <NeoCard variant="erobo" class="pool-overview-card">
          <view class="pool-stats">
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("totalPool") }}</text>
              <text class="stat-value-glass">{{ formatCount(totalProposals) }}</text>
            </view>
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("activeProjects") }}</text>
              <text class="stat-value-glass">{{ formatCount(activeProposals) }}</text>
            </view>
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("yourShare") }}</text>
              <text class="stat-value-glass highlight">{{ formatCount(displayedProposals) }}</text>
            </view>
          </view>
        </NeoCard>
      </view>

      <!-- Docs Tab -->
      <view v-if="activeTab === 'docs'" class="tab-content scrollable">
        <NeoDoc
          :title="t('title')"
          :subtitle="t('docSubtitle')"
          :description="t('docDescription')"
          :steps="docSteps"
          :features="docFeatures"
        />
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoButton, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";


const { t, locale } = useI18n();

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const { chainType, switchChain } = useWallet() as any;

interface Grant {
  id: string;
  title: string;
  proposer: string;
  state: string;
  votesAccept: number;
  votesReject: number;
  discussionUrl: string;
  createdAt: string;
  comments: number;
  onchainId: number | null;
}

const activeTab = ref<string>("grants");
const navTabs = computed<NavTab[]>(() => [
  { id: "grants", icon: "gift", label: t("tabGrants") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const grants = ref<Grant[]>([]);
const totalProposals = ref(0);
const loading = ref(false);
const fetchError = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");

const displayedProposals = computed(() => grants.value.length);
const activeProposals = computed(() => grants.value.filter((grant) => isActiveState(grant.state)).length);

function decodeBase64(str: string) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}

function normalizeState(state: string): string {
  return String(state || "").toLowerCase();
}

function isActiveState(state: string): boolean {
  const normalized = normalizeState(state);
  return ["active", "review", "voting", "discussion"].includes(normalized);
}

async function fetchGrants() {
  loading.value = true;
  fetchError.value = false;
  try {
    const res = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: "https://api.prod.grantshares.io/api/proposal/all?page=0&page-size=50&order-attr=state-updated&order-asc=0",
        success: (r) => resolve(r.data),
        fail: (e) => reject(e),
      });
    });

    if (res && Array.isArray(res.items)) {
      grants.value = res.items
        .map((item: any) => {
          const title = decodeBase64(item.title || "");
          return {
            id: String(item.offchain_id || item.id || ""),
            title,
            proposer: String(item.proposer || item.proposer_address || item.proposerAddress || ""),
            state: normalizeState(item.state || ""),
            votesAccept: Number(item.votes_amount_accept || item.votesAmountAccept || 0),
            votesReject: Number(item.votes_amount_reject || item.votesAmountReject || 0),
            discussionUrl: String(item.discussion_url || item.discussionUrl || ""),
            createdAt: String(item.offchain_creation_timestamp || item.offchainCreationTimestamp || ""),
            comments: Number(item.offchain_comments_count || item.offchainCommentsCount || 0),
            onchainId: item.onchain_id ?? item.onchainId ?? null,
          } as Grant;
        })
        .filter((item: Grant) => item.id && item.title);

      const totalCount = Number(res.total ?? res.totalCount ?? grants.value.length);
      totalProposals.value = Number.isFinite(totalCount) ? totalCount : grants.value.length;
    } else {
      grants.value = [];
      totalProposals.value = 0;
    }
  } catch (e) {
    grants.value = [];
    totalProposals.value = 0;
    fetchError.value = true;
  } finally {
    loading.value = false;
  }
}

function formatCount(amount: number): string {
  return Number.isFinite(amount) ? amount.toLocaleString() : "0";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const dateLocale = locale.value === "zh" ? "zh-CN" : "en-US";
  return date.toLocaleDateString(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(state: string): string {
  const statusMap: Record<string, string> = {
    active: t("statusActive"),
    review: t("statusReview"),
    voting: t("statusVoting"),
    discussion: t("statusDiscussion"),
    executed: t("statusExecuted"),
    cancelled: t("statusCancelled"),
    rejected: t("statusRejected"),
    expired: t("statusExpired"),
  };
  return statusMap[normalizeState(state)] || state;
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 5000);
}

function copyLink(url: string) {
  if (!url) return;
  const uniApi = (globalThis as any)?.uni;
  if (uniApi?.setClipboardData) {
    uniApi.setClipboardData({
      data: url,
      success: () => showStatus(t("linkCopied"), "success"),
      fail: () => showStatus(t("copyFailed"), "error"),
    });
    return;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => showStatus(t("linkCopied"), "success"))
      .catch(() => showStatus(t("copyFailed"), "error"));
    return;
  }

  showStatus(t("copyFailed"), "error");
}

onMounted(() => {
  fetchGrants();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

:global(.theme-grant-share) {
  --eco-bg: #0f1c15;
  --eco-bg-pattern: rgba(52, 211, 153, 0.14);
  --eco-card-bg: rgba(17, 32, 25, 0.9);
  --eco-card-border: rgba(52, 211, 153, 0.18);
  --eco-card-accent-border: rgba(52, 211, 153, 0.35);
  --eco-card-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  --eco-text: #e5f8ee;
  --eco-text-muted: #9cc7b3;
  --eco-text-subtle: #b9d6c7;
  --eco-accent: #34d399;
  --eco-accent-strong: #10b981;
  --eco-accent-soft: rgba(52, 211, 153, 0.18);
  --eco-divider: rgba(52, 211, 153, 0.2);
  --eco-button-primary-bg: #34d399;
  --eco-button-primary-text: #06231a;
  --eco-button-primary-shadow: 0 4px 10px rgba(52, 211, 153, 0.3);
  --eco-button-secondary-bg: rgba(255, 255, 255, 0.08);
  --eco-button-secondary-text: #c5e7d6;
  --eco-button-secondary-border: rgba(255, 255, 255, 0.16);
  --eco-pool-stat-bg: rgba(16, 185, 129, 0.12);
  --eco-pool-stat-border: rgba(16, 185, 129, 0.3);
  --eco-empty-bg: rgba(255, 255, 255, 0.06);
  --eco-empty-border: rgba(255, 255, 255, 0.15);
  --eco-meta-bg: rgba(255, 255, 255, 0.08);
  --eco-meta-text: #c1ddcf;
  --eco-chip-accept-bg: rgba(16, 185, 129, 0.2);
  --eco-chip-accept-text: #34d399;
  --eco-chip-accept-border: rgba(16, 185, 129, 0.4);
  --eco-chip-reject-bg: rgba(239, 68, 68, 0.2);
  --eco-chip-reject-text: #f87171;
  --eco-chip-reject-border: rgba(239, 68, 68, 0.4);
  --eco-chip-neutral-bg: rgba(148, 163, 184, 0.2);
  --eco-chip-neutral-text: #d1d5db;
  --eco-chip-neutral-border: rgba(148, 163, 184, 0.3);
  --eco-badge-active-bg: rgba(245, 158, 11, 0.2);
  --eco-badge-active-text: #fbbf24;
  --eco-badge-review-bg: rgba(59, 130, 246, 0.2);
  --eco-badge-review-text: #60a5fa;
  --eco-badge-executed-bg: rgba(16, 185, 129, 0.2);
  --eco-badge-executed-text: #34d399;
  --eco-badge-cancel-bg: rgba(239, 68, 68, 0.2);
  --eco-badge-cancel-text: #f87171;
  --eco-danger-bg: rgba(127, 29, 29, 0.3);
  --eco-danger-border: rgba(239, 68, 68, 0.6);
  --eco-danger-text: #fecaca;
  --eco-success-bg: rgba(16, 185, 129, 0.2);
  --eco-success-border: rgba(16, 185, 129, 0.5);
  --eco-success-text: #6ee7b7;
  --eco-status-title: #fca5a5;
  --eco-status-detail: #fcd7d7;
  --bg-primary: var(--eco-bg);
  --bg-secondary: #13281d;
  --bg-card: var(--eco-card-bg);
  --text-primary: var(--eco-text);
  --text-secondary: var(--eco-text-muted);
  --text-muted: var(--eco-text-muted);
  --border-color: var(--eco-card-border);
  --shadow-color: rgba(0, 0, 0, 0.35);
}

:global(.theme-light .theme-grant-share),
:global([data-theme="light"] .theme-grant-share) {
  --eco-bg: #ecf3ed;
  --eco-bg-pattern: rgba(52, 211, 153, 0.2);
  --eco-card-bg: #ffffff;
  --eco-card-border: #e5e7eb;
  --eco-card-accent-border: #d1fae5;
  --eco-card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --eco-text: #1f2937;
  --eco-text-muted: #6b7280;
  --eco-text-subtle: #4b5563;
  --eco-accent: #34d399;
  --eco-accent-strong: #10b981;
  --eco-accent-soft: #d1fae5;
  --eco-divider: rgba(52, 211, 153, 0.2);
  --eco-button-primary-bg: #34d399;
  --eco-button-primary-text: #ffffff;
  --eco-button-primary-shadow: 0 4px 10px rgba(52, 211, 153, 0.3);
  --eco-button-secondary-bg: #f3f4f6;
  --eco-button-secondary-text: #4b5563;
  --eco-button-secondary-border: #e5e7eb;
  --eco-pool-stat-bg: #f0fdf4;
  --eco-pool-stat-border: #bbf7d0;
  --eco-empty-bg: rgba(255, 255, 255, 0.5);
  --eco-empty-border: #d1d5db;
  --eco-meta-bg: #f3f4f6;
  --eco-meta-text: #6b7280;
  --eco-chip-accept-bg: #ecfdf5;
  --eco-chip-accept-text: #059669;
  --eco-chip-accept-border: #a7f3d0;
  --eco-chip-reject-bg: #fef2f2;
  --eco-chip-reject-text: #dc2626;
  --eco-chip-reject-border: #fecaca;
  --eco-chip-neutral-bg: #f3f4f6;
  --eco-chip-neutral-text: #4b5563;
  --eco-chip-neutral-border: #e5e7eb;
  --eco-badge-active-bg: #fef3c7;
  --eco-badge-active-text: #d97706;
  --eco-badge-review-bg: #dbeafe;
  --eco-badge-review-text: #2563eb;
  --eco-badge-executed-bg: #d1fae5;
  --eco-badge-executed-text: #059669;
  --eco-badge-cancel-bg: #fee2e2;
  --eco-badge-cancel-text: #dc2626;
  --eco-danger-bg: #fee2e2;
  --eco-danger-border: #fca5a5;
  --eco-danger-text: #b91c1c;
  --eco-success-bg: #ecfdf3;
  --eco-success-border: #a7f3d0;
  --eco-success-text: #047857;
  --eco-status-title: #ef4444;
  --eco-status-detail: #6b7280;
  --shadow-color: rgba(31, 41, 55, 0.08);
}

:global(page) {
  background: var(--eco-bg);
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--eco-bg);
  background-image: 
    radial-gradient(circle at 10% 10%, var(--eco-bg-pattern) 0%, transparent 40%),
    radial-gradient(circle at 90% 90%, var(--eco-bg-pattern) 0%, transparent 40%);
  min-height: 100vh;
}

/* Eco Component Overrides */
:deep(.neo-card) {
  background: var(--eco-card-bg) !important;
  border: 1px solid var(--eco-card-border) !important;
  border-radius: 12px !important;
  box-shadow: var(--eco-card-shadow) !important;
  color: var(--eco-text) !important;
  
  &.variant-erobo-neo {
    background: var(--eco-card-bg) !important;
    border-color: var(--eco-card-accent-border) !important;
  }

  &.variant-danger {
    background: var(--eco-danger-bg) !important;
    border-color: var(--eco-danger-border) !important;
    color: var(--eco-danger-text) !important;
  }

  &.variant-success {
    background: var(--eco-success-bg) !important;
    border-color: var(--eco-success-border) !important;
    color: var(--eco-success-text) !important;
  }
}

:deep(.neo-button) {
  border-radius: 99px !important;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: var(--eco-button-primary-bg) !important;
    color: var(--eco-button-primary-text) !important;
    border: none !important;
    box-shadow: var(--eco-button-primary-shadow) !important;
    
    &:active {
      transform: translateY(1px);
      box-shadow: none !important;
    }
  }
  
  &.variant-secondary {
    background: var(--eco-button-secondary-bg) !important;
    color: var(--eco-button-secondary-text) !important;
    border: 1px solid var(--eco-button-secondary-border) !important;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-title {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--eco-status-title);
  letter-spacing: 0.08em;
}

.status-detail {
  font-size: 12px;
  text-align: center;
  color: var(--eco-status-detail);
  opacity: 0.85;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
  border-bottom: 2px dashed var(--eco-divider);
  padding-bottom: $space-3;
}
.pool-title {
  font-weight: 800;
  font-size: 20px;
  color: var(--eco-text);
}
.pool-round-glass {
  font-size: 10px;
  font-weight: bold;
  border: 1px solid var(--eco-accent);
  padding: 4px 12px;
  background: var(--eco-accent-soft);
  border-radius: 20px;
  color: var(--eco-text);
}

.pool-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}
.pool-stat-glass {
  padding: $space-4;
  background: var(--eco-pool-stat-bg);
  border: 1px solid var(--eco-pool-stat-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.stat-label-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: var(--eco-text-muted);
  margin-bottom: 4px;
}
.stat-value-glass {
  font-weight: 700;
  font-size: 18px;
  color: var(--eco-text);
  &.highlight {
    color: var(--eco-accent-strong);
  }
}

.section-title-glass {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: $space-4;
  color: var(--eco-text-muted);
  border-left: 3px solid var(--eco-accent);
  padding-left: 8px;
  display: block;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: var(--eco-empty-bg);
  border-radius: 12px;
  border: 1px dashed var(--eco-empty-border);
}
.empty-text {
  color: var(--eco-text-muted);
  font-size: 14px;
}

.grant-card-neo {
  margin-bottom: 0;
}
.grant-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-4;
  align-items: flex-start;
}
.grant-title-glass {
  font-weight: 700;
  font-size: 16px;
  color: var(--eco-text);
  display: block;
  margin-bottom: 4px;
}
.grant-creator-glass {
  font-size: 10px;
  font-weight: 500;
  color: var(--eco-text-muted);
}

.grant-badge-glass {
  padding: 4px 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 20px;
  
  &.active {
    background: var(--eco-badge-active-bg); color: var(--eco-badge-active-text);
  }
  &.review, &.voting, &.discussion {
    background: var(--eco-badge-review-bg); color: var(--eco-badge-review-text);
  }
  &.executed {
    background: var(--eco-badge-executed-bg); color: var(--eco-badge-executed-text);
  }
  &.cancelled, &.rejected, &.expired {
    background: var(--eco-badge-cancel-bg); color: var(--eco-badge-cancel-text);
  }
}

.grants-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.proposal-meta {
  display: flex;
  gap: 8px;
  margin-bottom: $space-3;
}
.meta-item {
  font-size: 10px;
  font-weight: 600;
  color: var(--eco-meta-text);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--eco-meta-bg);
}

.proposal-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-3;
}
.stat-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}
.stat-chip.accept {
  background: var(--eco-chip-accept-bg); color: var(--eco-chip-accept-text); border: 1px solid var(--eco-chip-accept-border);
}
.stat-chip.reject {
  background: var(--eco-chip-reject-bg); color: var(--eco-chip-reject-text); border: 1px solid var(--eco-chip-reject-border);
}
.stat-chip.comments {
  background: var(--eco-chip-neutral-bg); color: var(--eco-chip-neutral-text); border: 1px solid var(--eco-chip-neutral-border);
}

.proposal-actions {
  display: flex;
  justify-content: flex-end;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
