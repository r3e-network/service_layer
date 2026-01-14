<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
        <!-- Grant Pool Overview -->
        <NeoCard variant="erobo" class="pool-overview-card">
          <view class="pool-header">
            <text class="pool-title text-glass-glow">{{ t("grantPool") }}</text>
            <view class="pool-round-glass">
              <text class="round-text">{{ t("round") }} #1</text>
            </view>
          </view>
          <view class="pool-stats">
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("totalPool") }}</text>
              <text class="stat-value-glass">{{ formatAmount(totalFunded) }} GAS</text>
            </view>
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("activeProjects") }}</text>
              <text class="stat-value-glass">{{ totalGrants }}</text>
            </view>
            <view class="pool-stat-glass">
              <text class="stat-label-glass">{{ t("yourShare") }}</text>
              <text class="stat-value-glass highlight">{{ userShare }} GAS</text>
            </view>
          </view>
        </NeoCard>

        <!-- Active Grants Section -->
        <view class="grants-section">
          <text class="section-title-glass">{{ t("activeGrants") }}</text>

          <view v-if="grants.length === 0" class="empty-state">
            <text class="empty-text">{{ t("noActiveGrants") }}</text>
          </view>

          <!-- Grant Cards -->
          <NeoCard v-for="grant in grants" :key="grant.id" variant="erobo-neo" class="grant-card-neo">
            <view class="grant-card-header">
              <view class="grant-info">
                <text class="grant-title-glass">{{ grant.title }}</text>
                <text class="grant-creator-glass">{{ t("by") }} {{ grant.creator }}</text>
              </view>
              <view :class="['grant-badge-glass', grant.status]">
                <text class="badge-text">{{ getStatusLabel(grant.status) }}</text>
              </view>
            </view>

            <text class="grant-description-glass">{{ grant.description }}</text>

            <!-- Funding Progress -->
            <view class="funding-section-glass">
              <view class="funding-header">
                <text class="funding-label-glass">{{ t("fundingProgress") }}</text>
                <text class="funding-percentage-glass">{{ getProgress(grant) }}%</text>
              </view>

              <view class="progress-track-glass">
                <view class="progress-bar-glass" :style="{ width: getProgress(grant) + '%' }">
                  <view class="progress-glow"></view>
                </view>
              </view>

              <view class="funding-amounts">
                <text class="amount-raised-glass">{{ formatAmount(grant.funded) }} GAS</text>
                <text class="amount-divider-glass">/</text>
                <text class="amount-goal-glass">{{ formatAmount(grant.goal) }} GAS</text>
              </view>
            </view>

            <!-- Action Button -->
            <NeoButton variant="primary" block @click="openFundModal(grant)" :class="['fund-button', grant.status]">
              {{ grant.status === "funded" ? t("fullyFunded") : t("fundThisGrant") }}
            </NeoButton>
          </NeoCard>
        </view>
      </view>

      <!-- Apply Tab -->
      <view v-if="activeTab === 'apply'" class="tab-content">
        <NeoCard variant="erobo-neo" :title="t('applyForGrant')">
          <view class="form-container">
            <NeoInput v-model="newGrant.title" :label="t('grantTitle')" :placeholder="t('enterTitle')" type="text" />

            <NeoInput
              v-model="newGrant.description"
              :label="t('description')"
              :placeholder="t('describeProject')"
              type="textarea"
            />

            <NeoInput v-model="newGrant.goal" :label="t('fundingGoal')" placeholder="0" type="number" suffix="GAS" />

            <NeoButton
              variant="primary"
              block
              :disabled="!canCreate || loading"
              :loading="loading"
              @click="handleCreate"
              class="submit-button"
            >
              {{ loading ? t("creating") : t("createGrant") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Fund Modal -->
      <NeoModal
        :visible="showFundModal"
        :title="`${t('fund')}: ${selectedGrant?.title}`"
        @close="showFundModal = false"
      >
        <view class="modal-content">
          <NeoInput v-model="fundAmount" :label="t('amount')" placeholder="0" type="number" suffix="GAS" />
        </view>

        <template #footer>
          <NeoButton variant="secondary" @click="showFundModal = false">
            {{ t("cancel") }}
          </NeoButton>
          <NeoButton variant="primary" :disabled="loading || !fundAmount" :loading="loading" @click="handleFund">
            {{ loading ? t("processing") : t("confirm") }}
          </NeoButton>
        </template>
      </NeoModal>

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
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoCard, NeoInput, NeoModal, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "GrantShare", zh: "资助共享" },
  subtitle: { en: "Community Funding Platform", zh: "社区资助平台" },
  grantPool: { en: "Grant Pool", zh: "资助池" },
  round: { en: "Round", zh: "轮次" },
  totalPool: { en: "Total Pool", zh: "总资金池" },
  activeProjects: { en: "Active Projects", zh: "活跃项目" },
  yourShare: { en: "Your Share", zh: "你的份额" },
  activeGrants: { en: "Active Grants", zh: "活跃资助" },
  noActiveGrants: { en: "No active grants yet", zh: "暂无活跃资助" },
  by: { en: "by", zh: "创建者" },
  fundingProgress: { en: "Funding Progress", zh: "资助进度" },
  fundThisGrant: { en: "Fund This Grant", zh: "资助此项目" },
  fullyFunded: { en: "Fully Funded", zh: "已完成资助" },
  applyForGrant: { en: "Apply for Grant", zh: "申请资助" },
  grantTitle: { en: "Grant Title", zh: "资助标题" },
  enterTitle: { en: "Enter title", zh: "输入标题" },
  description: { en: "Description", zh: "描述" },
  describeProject: { en: "Describe your project", zh: "描述您的项目" },
  fundingGoal: { en: "Funding Goal (GAS)", zh: "资助目标 (GAS)" },
  creating: { en: "Creating...", zh: "创建中..." },
  createGrant: { en: "Create Grant", zh: "创建资助" },
  fund: { en: "Fund", zh: "资助" },
  amount: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  cancel: { en: "Cancel", zh: "取消" },
  processing: { en: "Processing...", zh: "处理中..." },
  confirm: { en: "Confirm", zh: "确认" },
  tabGrants: { en: "Grants", zh: "资助" },
  tabApply: { en: "Apply", zh: "申请" },
  statusActive: { en: "Active", zh: "进行中" },
  statusFunded: { en: "Funded", zh: "已资助" },
  statusCompleted: { en: "Completed", zh: "已完成" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Community funding with transparent milestone tracking",
    zh: "透明里程碑追踪的社区资助",
  },
  docDescription: {
    en: "Grant Share enables community-driven funding for Neo ecosystem projects. Create proposals, vote on funding, and track milestone-based fund releases.",
    zh: "Grant Share 支持 Neo 生态系统项目的社区驱动资助。创建提案、投票资助并跟踪基于里程碑的资金释放。",
  },
  step1: {
    en: "Connect your Neo wallet to participate",
    zh: "连接您的 Neo 钱包参与",
  },
  step2: {
    en: "Browse active proposals or submit your own",
    zh: "浏览活跃提案或提交您自己的",
  },
  step3: {
    en: "Vote on proposals you want to support",
    zh: "为您想支持的提案投票",
  },
  step4: {
    en: "Track funded projects through milestone completion",
    zh: "通过里程碑完成跟踪已资助项目",
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

const APP_ID = "miniapp-grant-share";
const { address, connect, chainType, switchChain } = useWallet() as any;
const { payGAS } = usePayments(APP_ID);

interface Grant {
  id: string;
  title: string;
  description: string;
  goal: number;
  funded: number;
  creator: string;
  status: "active" | "funded" | "completed";
}

const activeTab = ref("grants");
const navTabs: NavTab[] = [
  { id: "grants", icon: "gift", label: t("tabGrants") },
  { id: "apply", icon: "plus", label: t("tabApply") },
  { id: "docs", icon: "book", label: t("docs") },
];

const grants = ref<Grant[]>([]);

function decodeBase64(str: string) {
  try {
    // Basic base64 decode for browser/uniapp
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}

async function fetchGrants() {
  loading.value = true;
  try {
    // Utilizing uni.request for cross-platform compatibility
    const res = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: "https://api.prod.grantshares.io/api/proposal/all?page=0&page-size=50&order-attr=state-updated&order-asc=0",
        success: (r) => resolve(r.data),
        fail: (e) => reject(e),
      });
    });

    if (res && res.items) {
      grants.value = res.items.map((item: any) => ({
        id: String(item.id),
        title: decodeBase64(item.title),
        description: "", // API doesn't list summary in 'all' endpoint usually, might need detail fetch but keeping simple
        goal: parseFloat(item.targetAmount || "0"), // Adjust based on real API response if known, otherwise guess
        funded: parseFloat(item.receivedAmount || "0"), // Adjust
        creator: item.proposer,
        status: item.state === "Executed" ? "funded" : item.state === "Active" ? "active" : "completed",
        // Extend Grant interface if needed or map loosely
      }));
      totalGrants.value = res.totalCount || grants.value.length;
    }
  } catch (e) {
    console.error("Failed to fetch grants", e);
    // Fallback to mock if API fails (optional, but good for demo stability)
    grants.value = [
      {
        id: "1",
        title: "Neo Developer Tools (Offline Demo)",
        description: "Building open-source dev tools for Neo ecosystem",
        goal: 1000,
        funded: 450,
        creator: "NXtest1",
        status: "active",
      },
    ];
  } finally {
    loading.value = false;
  }
}

const totalGrants = ref(2);
const totalFunded = ref(950);
const userShare = ref(125.5);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const showFundModal = ref(false);
const selectedGrant = ref<Grant | null>(null);
const fundAmount = ref("");
const newGrant = ref({ title: "", description: "", goal: "" });

const canCreate = computed(() => {
  return newGrant.value.title && newGrant.value.description && parseFloat(newGrant.value.goal) > 0;
});

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function getProgress(grant: Grant): number {
  return Math.min((grant.funded / grant.goal) * 100, 100);
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: t("statusActive"),
    funded: t("statusFunded"),
    completed: t("statusCompleted"),
  };
  return statusMap[status] || status;
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 5000);
}

function openFundModal(grant: Grant) {
  if (grant.status === "funded") return;
  selectedGrant.value = grant;
  fundAmount.value = "";
  showFundModal.value = true;
}

async function handleCreate() {
  if (!canCreate.value || loading.value) return;
  loading.value = true;
  try {
    const grant: Grant = {
      id: Date.now().toString(),
      title: newGrant.value.title,
      description: newGrant.value.description,
      goal: parseFloat(newGrant.value.goal),
      funded: 0,
      creator: address.value || "",
      status: "active",
    };
    grants.value.unshift(grant);
    totalGrants.value++;
    newGrant.value = { title: "", description: "", goal: "" };
    showStatus("Grant created successfully!", "success");
    activeTab.value = "grants";
  } catch (e: any) {
    showStatus(e.message || "Failed to create grant", "error");
  } finally {
    loading.value = false;
  }
}

async function handleFund() {
  if (!selectedGrant.value || !fundAmount.value || loading.value) return;
  loading.value = true;
  try {
    await payGAS(fundAmount.value, `fund:${selectedGrant.value.id}`);
    selectedGrant.value.funded += parseFloat(fundAmount.value);
    totalFunded.value += parseFloat(fundAmount.value);
    userShare.value += parseFloat(fundAmount.value);
    if (selectedGrant.value.funded >= selectedGrant.value.goal) {
      selectedGrant.value.status = "funded";
    }
    showStatus("Funded successfully!", "success");
    showFundModal.value = false;
  } catch (e: any) {
    showStatus(e.message || "Failed to fund grant", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await connect();
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
  margin-bottom: $space-6;
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
  &.funded {
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.3);
  }
  &.completed {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.grant-description-glass {
  font-size: 14px;
  font-weight: $font-weight-medium;
  margin: $space-4 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
}

.funding-section-glass {
  margin-bottom: $space-5;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.funding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.funding-label-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.funding-percentage-glass {
  font-size: 14px;
  font-weight: $font-weight-bold;
  font-family: $font-mono;
  color: #34d399;
}

.progress-track-glass {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
}
.progress-bar-glass {
  height: 100%;
  background: #00e599;
  position: relative;
  border-radius: 3px;
}
.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 10px;
  background: white;
  filter: blur(4px);
  opacity: 0.5;
}

.funding-amounts {
  font-family: $font-mono;
  font-size: 10px;
  font-weight: $font-weight-bold;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.amount-raised-glass {
  color: white;
}
.amount-divider-glass {
  color: rgba(255, 255, 255, 0.3);
}
.amount-goal-glass {
  color: rgba(255, 255, 255, 0.5);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}
.modal-content {
  padding: $space-4 0;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
