<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <!-- Status Message -->
      <view v-if="statusMessage" :class="['status-banner', statusType]">
        <text class="status-text">{{ statusMessage }}</text>
      </view>

      <!-- Grants Tab -->
      <view v-if="activeTab === 'grants'" class="tab-content">
        <!-- Grant Pool Overview -->
        <view class="pool-overview">
          <view class="pool-header">
            <text class="pool-title">{{ t("grantPool") }}</text>
            <text class="pool-round">{{ t("round") }} #1</text>
          </view>
          <view class="pool-stats">
            <view class="pool-stat">
              <text class="stat-label">{{ t("totalPool") }}</text>
              <text class="stat-value">{{ formatAmount(totalFunded.value) }} GAS</text>
            </view>
            <view class="pool-stat">
              <text class="stat-label">{{ t("activeProjects") }}</text>
              <text class="stat-value">{{ totalGrants }}</text>
            </view>
            <view class="pool-stat">
              <text class="stat-label">{{ t("yourShare") }}</text>
              <text class="stat-value highlight">{{ userShare }} GAS</text>
            </view>
          </view>
        </view>

        <!-- Active Grants Section -->
        <view class="grants-section">
          <text class="section-title">{{ t("activeGrants") }}</text>

          <view v-if="grants.length === 0" class="empty-state">
            <text class="empty-text">{{ t("noActiveGrants") }}</text>
          </view>

          <!-- Grant Cards -->
          <view v-for="grant in grants" :key="grant.id" class="grant-card">
            <view class="grant-card-header">
              <view class="grant-info">
                <text class="grant-title">{{ grant.title }}</text>
                <text class="grant-creator">{{ t("by") }} {{ grant.creator }}</text>
              </view>
              <view :class="['grant-badge', grant.status]">
                <text class="badge-text">{{ getStatusLabel(grant.status) }}</text>
              </view>
            </view>

            <text class="grant-description">{{ grant.description }}</text>

            <!-- Funding Progress -->
            <view class="funding-section">
              <view class="funding-header">
                <text class="funding-label">{{ t("fundingProgress") }}</text>
                <text class="funding-percentage">{{ getProgress(grant) }}%</text>
              </view>

              <view class="progress-track">
                <view class="progress-bar" :style="{ width: getProgress(grant) + '%' }"></view>
              </view>

              <view class="funding-amounts">
                <text class="amount-raised">{{ formatAmount(grant.funded) }} GAS</text>
                <text class="amount-divider">/</text>
                <text class="amount-goal">{{ formatAmount(grant.goal) }} GAS</text>
              </view>
            </view>

            <!-- Action Button -->
            <NeoButton variant="primary" block @click="openFundModal(grant)" :class="['fund-button', grant.status]">
              {{ grant.status === "funded" ? t("fullyFunded") : t("fundThisGrant") }}
            </NeoButton>
          </view>
        </view>
      </view>

      <!-- Apply Tab -->
      <view v-if="activeTab === 'apply'" class="tab-content">
        <view class="apply-section">
          <text class="section-title">{{ t("applyForGrant") }}</text>

          <view class="form-container">
            <NeoInput v-model="newGrant.title" :label="t('grantTitle')" :placeholder="t('enterTitle')" type="text" />

            <view class="input-group">
              <text class="input-label">{{ t("description") }}</text>
              <textarea v-model="newGrant.description" :placeholder="t('describeProject')" class="textarea-input" />
            </view>

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
        </view>
      </view>

      <!-- Fund Modal -->
      <NeoModal :show="showFundModal" :title="`${t('fund')}: ${selectedGrant?.title}`" @close="showFundModal = false">
        <view class="modal-content">
          <NeoInput v-model="fundAmount" :label="t('amount')" placeholder="0" type="number" suffix="GAS" />
        </view>

        <template #footer>
          <view class="modal-actions">
            <NeoButton variant="secondary" @click="showFundModal = false">
              {{ t("cancel") }}
            </NeoButton>
            <NeoButton variant="primary" :disabled="loading || !fundAmount" :loading="loading" @click="handleFund">
              {{ loading ? t("processing") : t("confirm") }}
            </NeoButton>
          </view>
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
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoModal from "@/shared/components/NeoModal.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
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
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-grant-share";
const { address, connect } = useWallet();
const { payGAS, isLoading: paymentLoading } = usePayments(APP_ID);

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

const grants = ref<Grant[]>([
  {
    id: "1",
    title: "Neo Developer Tools",
    description: "Building open-source dev tools for Neo ecosystem",
    goal: 1000,
    funded: 450,
    creator: "NXtest1",
    status: "active",
  },
  {
    id: "2",
    title: "Community Education",
    description: "Creating tutorials and documentation",
    goal: 500,
    funded: 500,
    creator: "NXtest2",
    status: "funded",
  },
]);

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
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  padding: $space-4;
  gap: $space-4;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

/* Status Banner */
.status-banner {
  padding: $space-3 $space-4;
  border: $border-width-md solid var(--border-color);
  text-align: center;
  box-shadow: $shadow-md;

  &.success {
    background: var(--neo-green);
    border-color: var(--neo-green);
  }

  &.error {
    background: var(--status-error);
    border-color: var(--status-error);
  }
}

.status-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--neo-black);
}

/* Pool Overview */
.pool-overview {
  background: var(--bg-secondary);
  border: $border-width-lg solid var(--border-color);
  padding: $space-5;
  box-shadow: $shadow-md;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: $border-width-md solid var(--border-color);
}

.pool-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pool-round {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  padding: $space-1 $space-3;
  background: var(--bg-primary);
  border: $border-width-sm solid var(--border-color);
  text-transform: uppercase;
}

.pool-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

.pool-stat {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.stat-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  font-family: $font-mono;

  &.highlight {
    color: var(--neo-purple);
  }
}

/* Grants Section */
.grants-section {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: $space-2;
  border-bottom: $border-width-md solid var(--border-color);
}

.empty-state {
  text-align: center;
  padding: $space-10;
  background: var(--bg-secondary);
  border: $border-width-md dashed var(--border-color);
}

.empty-text {
  font-size: $font-size-base;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
}

/* Grant Card */
.grant-card {
  background: var(--bg-secondary);
  border: $border-width-lg solid var(--border-color);
  padding: $space-5;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--border-color);
  }
}

.grant-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
}

.grant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.grant-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.grant-creator {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: var(--text-muted);
  font-family: $font-mono;
}

.grant-badge {
  padding: $space-1 $space-3;
  border: $border-width-sm solid var(--border-color);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &.active {
    background: var(--brutal-yellow);
    border-color: var(--brutal-yellow);
    color: var(--neo-black);
  }

  &.funded {
    background: var(--neo-green);
    border-color: var(--neo-green);
    color: var(--neo-black);
  }

  &.completed {
    background: var(--neo-purple);
    border-color: var(--neo-purple);
    color: var(--neo-white);
  }
}

.badge-text {
  font-size: $font-size-xs;
}

.grant-description {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Funding Section */
.funding-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  background: var(--bg-primary);
  border: $border-width-sm solid var(--border-color);
}

.funding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.funding-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.funding-percentage {
  font-size: $font-size-sm;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
}

.progress-track {
  height: 16px;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  overflow: hidden;
  position: relative;
}

.progress-bar {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  transition: width $transition-normal;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(0, 0, 0, 0.1) 4px,
      rgba(0, 0, 0, 0.1) 8px
    );
  }
}

.funding-amounts {
  display: flex;
  align-items: baseline;
  gap: $space-2;
  justify-content: center;
  margin-top: $space-1;
}

.amount-raised {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
}

.amount-divider {
  font-size: $font-size-base;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
}

.amount-goal {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  font-family: $font-mono;
}

.fund-button {
  &.funded {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* Apply Section */
.apply-section {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.form-container {
  background: var(--bg-secondary);
  border: $border-width-lg solid var(--border-color);
  padding: $space-5;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.input-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.textarea-input {
  width: 100%;
  padding: $space-3;
  background: var(--bg-primary);
  border: $border-width-md solid var(--border-color);
  color: var(--text-primary);
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  min-height: 120px;
  font-family: $font-family;
  line-height: 1.6;
  resize: vertical;
  transition: all $transition-fast;

  &:focus {
    outline: none;
    border-color: var(--neo-green);
    box-shadow: 4px 4px 0 var(--neo-green);
  }

  &::placeholder {
    color: var(--text-muted);
  }
}

.submit-button {
  margin-top: $space-2;
}

/* Modal */
.modal-content {
  padding: $space-2 0;
}

.modal-actions {
  display: flex;
  gap: $space-3;
  margin-top: $space-4;
}

/* Scrollable */
.scrollable {
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
</style>
