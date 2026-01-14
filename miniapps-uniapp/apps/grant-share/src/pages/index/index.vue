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
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "GrantShare", zh: "资助共享" },
  subtitle: { en: "Community Funding Platform", zh: "社区资助平台" },
  grantPool: { en: "GrantShares Snapshot", zh: "GrantShares 快照" },
  totalPool: { en: "Total Proposals", zh: "提案总数" },
  activeProjects: { en: "Active (Loaded)", zh: "活跃（已加载）" },
  yourShare: { en: "Displayed", zh: "已展示" },
  activeGrants: { en: "Latest Proposals", zh: "最新提案" },
  noActiveGrants: { en: "No proposals found", zh: "暂无提案" },
  loading: { en: "Loading proposals...", zh: "提案加载中..." },
  loadFailed: { en: "Unable to load proposals", zh: "提案加载失败" },
  by: { en: "by", zh: "创建者" },
  copyDiscussion: { en: "Copy Discussion Link", zh: "复制讨论链接" },
  noDiscussion: { en: "No Discussion Link", zh: "暂无讨论链接" },
  linkCopied: { en: "Link copied", zh: "链接已复制" },
  copyFailed: { en: "Copy failed", zh: "复制失败" },
  votesFor: { en: "For", zh: "支持" },
  votesAgainst: { en: "Against", zh: "反对" },
  comments: { en: "Comments", zh: "评论" },
  tabStats: { en: "Stats", zh: "统计" },
  tabGrants: { en: "Proposals", zh: "提案" },
  statusActive: { en: "Active", zh: "进行中" },
  statusReview: { en: "In Review", zh: "审核中" },
  statusVoting: { en: "Voting", zh: "投票中" },
  statusDiscussion: { en: "Discussion", zh: "讨论中" },
  statusExecuted: { en: "Executed", zh: "已执行" },
  statusCancelled: { en: "Cancelled", zh: "已取消" },
  statusRejected: { en: "Rejected", zh: "已拒绝" },
  statusExpired: { en: "Expired", zh: "已过期" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Community funding with transparent milestone tracking",
    zh: "透明里程碑追踪的社区资助",
  },
  docDescription: {
    en: "GrantShares provides community funding for Neo ecosystem projects. This miniapp surfaces the latest proposals and their status; submit and vote on GrantShares directly.",
    zh: "GrantShares 为 Neo 生态系统项目提供社区资助。本应用展示最新提案及其状态；提交与投票请前往 GrantShares。",
  },
  step1: {
    en: "Browse the latest proposals and their status",
    zh: "浏览最新提案及其状态",
  },
  step2: {
    en: "Open discussion links for full context",
    zh: "打开讨论链接获取完整信息",
  },
  step3: {
    en: "Submit and vote on proposals at GrantShares",
    zh: "在 GrantShares 提交并投票",
  },
  step4: {
    en: "Track progress and execution over time",
    zh: "持续跟踪进展与执行情况",
  },
  feature1Name: { en: "Milestone Funding", zh: "里程碑资助" },
  feature1Desc: {
    en: "Funds released progressively as milestones are completed.",
    zh: "随着里程碑完成逐步释放资金。",
  },
  feature2Name: { en: "Community Voting", zh: "社区投票" },
  feature2Desc: {
    en: "Democratic decision-making on which projects receive funding.",
    zh: "民主决策哪些项目获得资助。",
  },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

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
const navTabs: NavTab[] = [
  { id: "grants", icon: "gift", label: t("tabGrants") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

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
    console.error("Failed to fetch proposals", e);
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
  return date.toLocaleDateString("en-US", {
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

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: $space-3;
}
.pool-title {
  font-weight: $font-weight-black;
  font-size: 24px;
  text-transform: uppercase;
  color: white;
}
.pool-round-glass {
  font-size: 10px;
  font-weight: $font-weight-black;
  border: 1px solid rgba(0, 229, 153, 0.3);
  padding: 4px 12px;
  background: rgba(0, 229, 153, 0.1);
  border-radius: 20px;
  color: #00e599;
}

.pool-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}
.pool-stat-glass {
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  opacity: 0.6;
  margin-bottom: 4px;
  color: white;
}
.stat-value-glass {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 16px;
  color: white;
  &.highlight {
    color: #34d399;
    text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
  }
}

.section-title-glass {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 12px;
  margin-bottom: $space-4;
  color: rgba(255, 255, 255, 0.6);
  padding-left: 4px;
  border-left: 2px solid #00e599;
  padding-left: 8px;
  display: block;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}
.empty-text {
  color: rgba(255, 255, 255, 0.4);
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
  font-weight: $font-weight-bold;
  font-size: 18px;
  color: white;
  display: block;
  margin-bottom: 4px;
}
.grant-creator-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
  text-transform: uppercase;
  color: white;
}

.grant-badge-glass {
  padding: 4px 10px;
  font-size: 9px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border-radius: 6px;
  &.active {
    background: rgba(253, 224, 71, 0.1);
    color: #fde047;
    border: 1px solid rgba(253, 224, 71, 0.3);
  }
  &.review,
  &.voting,
  &.discussion {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.3);
  }
  &.executed {
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.3);
  }
  &.cancelled,
  &.rejected,
  &.expired {
    background: rgba(248, 113, 113, 0.1);
    color: #f87171;
    border: 1px solid rgba(248, 113, 113, 0.3);
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
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.proposal-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: $space-3;
}
.stat-chip {
  font-size: 11px;
  font-weight: $font-weight-bold;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
}
.stat-chip.accept {
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}
.stat-chip.reject {
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.stat-chip.comments {
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
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
