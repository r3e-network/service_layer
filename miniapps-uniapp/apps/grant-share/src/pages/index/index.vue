<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <!-- Stats Cards -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-label">{{ t("totalGrants") }}</text>
        <text class="stat-value">{{ totalGrants }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">{{ t("totalFunded") }}</text>
        <text class="stat-value">{{ formatAmount(totalFunded) }} GAS</text>
      </view>
    </view>

    <!-- Tab Switcher -->
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'browse' }" @click="activeTab = 'browse'">
        <text>{{ t("browse") }}</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 'create' }" @click="activeTab = 'create'">
        <text>{{ t("create") }}</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'">
        <text>{{ t("myGrants") }}</text>
      </view>
    </view>

    <!-- Browse Panel -->
    <view v-if="activeTab === 'browse'" class="panel">
      <view v-if="grants.length === 0" class="empty-state">
        <text>{{ t("noActiveGrants") }}</text>
      </view>
      <view v-for="grant in grants" :key="grant.id" class="grant-card">
        <view class="grant-header">
          <text class="grant-title">{{ grant.title }}</text>
          <text class="grant-status" :class="grant.status">{{ grant.status }}</text>
        </view>
        <text class="grant-desc">{{ grant.description }}</text>
        <view class="grant-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: getProgress(grant) + '%' }"></view>
          </view>
          <text class="progress-text">{{ formatAmount(grant.funded) }} / {{ formatAmount(grant.goal) }} GAS</text>
        </view>
        <button class="fund-btn" @click="openFundModal(grant)">
          <text>{{ t("fundThisGrant") }}</text>
        </button>
      </view>
    </view>

    <!-- Create Panel -->
    <view v-if="activeTab === 'create'" class="panel">
      <view class="input-group">
        <text class="input-label">{{ t("grantTitle") }}</text>
        <input v-model="newGrant.title" :placeholder="t('enterTitle')" class="text-input" />
      </view>
      <view class="input-group">
        <text class="input-label">{{ t("description") }}</text>
        <textarea v-model="newGrant.description" :placeholder="t('describeProject')" class="textarea-input" />
      </view>
      <view class="input-group">
        <text class="input-label">{{ t("fundingGoal") }}</text>
        <input v-model="newGrant.goal" type="digit" placeholder="0" class="text-input" />
      </view>
      <button class="action-btn" :disabled="!canCreate || loading" @click="handleCreate">
        <text>{{ loading ? t("creating") : t("createGrant") }}</text>
      </button>
    </view>

    <!-- My Grants Panel -->
    <view v-if="activeTab === 'my'" class="panel">
      <view v-if="myGrants.length === 0" class="empty-state">
        <text>{{ t("noGrantsCreated") }}</text>
      </view>
      <view v-for="grant in myGrants" :key="grant.id" class="grant-card">
        <view class="grant-header">
          <text class="grant-title">{{ grant.title }}</text>
          <text class="grant-status" :class="grant.status">{{ grant.status }}</text>
        </view>
        <view class="grant-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: getProgress(grant) + '%' }"></view>
          </view>
          <text class="progress-text">{{ formatAmount(grant.funded) }} / {{ formatAmount(grant.goal) }} GAS</text>
        </view>
        <button v-if="grant.funded >= grant.goal" class="withdraw-btn" @click="handleWithdraw(grant)">
          <text>{{ t("withdrawFunds") }}</text>
        </button>
      </view>
    </view>

    <!-- Fund Modal -->
    <view v-if="showFundModal" class="modal-overlay" @click="showFundModal = false">
      <view class="modal" @click.stop>
        <text class="modal-title">{{ t("fund") }}: {{ selectedGrant?.title }}</text>
        <view class="input-group">
          <text class="input-label">{{ t("amount") }}</text>
          <input v-model="fundAmount" type="digit" placeholder="0" class="text-input" />
        </view>
        <view class="modal-actions">
          <button class="cancel-btn" @click="showFundModal = false">{{ t("cancel") }}</button>
          <button class="confirm-btn" :disabled="loading" @click="handleFund">
            {{ loading ? t("processing") : t("confirm") }}
          </button>
        </view>
      </view>
    </view>

    <!-- Status Message -->
    <view v-if="statusMessage" class="status" :class="statusType">
      <text>{{ statusMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "GrantShare", zh: "资助共享" },
  subtitle: { en: "Community Funding Platform", zh: "社区资助平台" },
  totalGrants: { en: "Total Grants", zh: "总资助数" },
  totalFunded: { en: "Total Funded", zh: "总资助额" },
  browse: { en: "Browse", zh: "浏览" },
  create: { en: "Create", zh: "创建" },
  myGrants: { en: "My Grants", zh: "我的资助" },
  noActiveGrants: { en: "No active grants yet", zh: "暂无活跃资助" },
  fundThisGrant: { en: "Fund This Grant", zh: "资助此项目" },
  grantTitle: { en: "Grant Title", zh: "资助标题" },
  enterTitle: { en: "Enter title", zh: "输入标题" },
  description: { en: "Description", zh: "描述" },
  describeProject: { en: "Describe your project", zh: "描述您的项目" },
  fundingGoal: { en: "Funding Goal (GAS)", zh: "资助目标 (GAS)" },
  creating: { en: "Creating...", zh: "创建中..." },
  createGrant: { en: "Create Grant", zh: "创建资助" },
  noGrantsCreated: { en: "You haven't created any grants", zh: "您还没有创建任何资助" },
  withdrawFunds: { en: "Withdraw Funds", zh: "提取资金" },
  fund: { en: "Fund", zh: "资助" },
  amount: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  cancel: { en: "Cancel", zh: "取消" },
  processing: { en: "Processing...", zh: "处理中..." },
  confirm: { en: "Confirm", zh: "确认" },
};

const t = createT(translations);

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

// State
const activeTab = ref<"browse" | "create" | "my">("browse");
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
const myGrants = ref<Grant[]>([]);
const totalGrants = ref(2);
const totalFunded = ref(950);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const showFundModal = ref(false);
const selectedGrant = ref<Grant | null>(null);
const fundAmount = ref("");
const newGrant = ref({ title: "", description: "", goal: "" });

// Computed
const canCreate = computed(() => {
  return newGrant.value.title && newGrant.value.description && parseFloat(newGrant.value.goal) > 0;
});

// Methods
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function getProgress(grant: Grant): number {
  return Math.min((grant.funded / grant.goal) * 100, 100);
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 5000);
}

function openFundModal(grant: Grant) {
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
    myGrants.value.unshift(grant);
    totalGrants.value++;
    newGrant.value = { title: "", description: "", goal: "" };
    showStatus("Grant created successfully!", "success");
    activeTab.value = "browse";
  } catch (e: any) {
    showStatus(e.message || "Failed to create grant", "error");
  } finally {
    loading.value = false;
  }
}

async function handleFund() {
  if (!selectedGrant.value || loading.value) return;
  const amount = parseFloat(fundAmount.value);
  if (amount <= 0) return;

  loading.value = true;
  try {
    await payGAS(amount.toString(), `grant:${selectedGrant.value.id}`);
    selectedGrant.value.funded += amount;
    totalFunded.value += amount;
    if (selectedGrant.value.funded >= selectedGrant.value.goal) {
      selectedGrant.value.status = "funded";
    }
    showFundModal.value = false;
    showStatus(`Funded ${amount} GAS successfully!`, "success");
  } catch (e: any) {
    showStatus(e.message || "Funding failed", "error");
  } finally {
    loading.value = false;
  }
}

async function handleWithdraw(grant: Grant) {
  loading.value = true;
  try {
    grant.status = "completed";
    showStatus("Funds withdrawn successfully!", "success");
  } catch (e: any) {
    showStatus(e.message || "Withdrawal failed", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await connect();
  if (address.value) {
    myGrants.value = grants.value.filter((g) => g.creator === address.value);
  }
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #4ade80;
}

.subtitle {
  display: block;
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  color: #888;
  transition: all 0.2s;
}

.tab.active {
  background: #4ade80;
  color: #0f0f1a;
  font-weight: 600;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.grant-card {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.grant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.grant-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.grant-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.grant-status.active {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.grant-status.funded {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.grant-status.completed {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.grant-desc {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
}

.grant-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  display: block;
  font-size: 12px;
  color: #888;
  text-align: right;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #fff;
}

.textarea-input {
  width: 100%;
  min-height: 100px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #fff;
}

.action-btn,
.fund-btn,
.withdraw-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn,
.fund-btn {
  background: #4ade80;
  color: #0f0f1a;
}

.withdraw-btn {
  background: #3b82f6;
  color: #fff;
}

.action-btn:disabled,
.fund-btn:disabled {
  opacity: 0.5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modal-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #888;
}

.confirm-btn {
  background: #4ade80;
  color: #0f0f1a;
}

.status {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.status.success {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.status.error {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}
</style>
