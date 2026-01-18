<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
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

$eco-bg: #ecf3ed;
$eco-green: #34d399;
$eco-dark: #064e3b;
$eco-light: #d1fae5;
$eco-accent: #10b981;

:global(page) {
  background: $eco-bg;
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $eco-bg;
  background-image: 
    radial-gradient(circle at 10% 10%, rgba(52, 211, 153, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(52, 211, 153, 0.2) 0%, transparent 40%);
  min-height: 100vh;
}

/* Eco Component Overrides */
:deep(.neo-card) {
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
  color: #1f2937 !important;
  
  &.variant-erobo-neo {
    background: #ffffff !important;
    border-color: #d1fae5 !important;
  }
}

:deep(.neo-button) {
  border-radius: 99px !important;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: $eco-green !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 4px 10px rgba(52, 211, 153, 0.3) !important;
    
    &:active {
      transform: translateY(1px);
      box-shadow: none !important;
    }
  }
  
  &.variant-secondary {
    background: #f3f4f6 !important;
    color: #4b5563 !important;
    border: 1px solid #e5e7eb !important;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
  border-bottom: 2px dashed rgba(52, 211, 153, 0.2);
  padding-bottom: $space-3;
}
.pool-title {
  font-weight: 800;
  font-size: 20px;
  color: $eco-dark;
}
.pool-round-glass {
  font-size: 10px;
  font-weight: bold;
  border: 1px solid $eco-green;
  padding: 4px 12px;
  background: $eco-light;
  border-radius: 20px;
  color: $eco-dark;
}

.pool-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}
.pool-stat-glass {
  padding: $space-4;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
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
  color: #6b7280;
  margin-bottom: 4px;
}
.stat-value-glass {
  font-weight: 700;
  font-size: 18px;
  color: $eco-dark;
  &.highlight {
    color: $eco-accent;
  }
}

.section-title-glass {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: $space-4;
  color: #6b7280;
  border-left: 3px solid $eco-green;
  padding-left: 8px;
  display: block;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px dashed #d1d5db;
}
.empty-text {
  color: #6b7280;
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
  color: $eco-dark;
  display: block;
  margin-bottom: 4px;
}
.grant-creator-glass {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
}

.grant-badge-glass {
  padding: 4px 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 20px;
  
  &.active {
    background: #fef3c7; color: #d97706;
  }
  &.review, &.voting, &.discussion {
    background: #dbeafe; color: #2563eb;
  }
  &.executed {
    background: #d1fae5; color: #059669;
  }
  &.cancelled, &.rejected, &.expired {
    background: #fee2e2; color: #dc2626;
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
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
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
  background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
}
.stat-chip.reject {
  background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
}
.stat-chip.comments {
  background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;
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
