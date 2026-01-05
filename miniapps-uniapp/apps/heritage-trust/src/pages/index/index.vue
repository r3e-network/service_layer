<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Trust Documents Section -->
      <NeoCard :title="t('yourTrusts')" variant="default">
        <view v-for="trust in trusts" :key="trust.id" class="trust-document">
          <!-- Document Header -->
          <view class="document-header">
            <view class="document-seal">
              <text class="seal-icon">{{ trust.icon }}</text>
              <text class="seal-text">{{ t("sealed") }}</text>
            </view>
            <view class="document-status" :class="trust.status">
              <text class="status-dot">●</text>
              <text class="status-text">{{ t(trust.status) }}</text>
            </view>
          </view>

          <!-- Trust Title -->
          <view class="document-title">
            <text class="title-text">{{ trust.name }}</text>
            <text class="title-subtitle">{{ t("trustDocument") }}</text>
          </view>

          <!-- Asset Allocation -->
          <view class="asset-section">
            <view class="asset-header">
              <text class="asset-label">{{ t("totalAssets") }}</text>
              <text class="asset-value">{{ trust.value }} GAS</text>
            </view>
            <view class="asset-bar">
              <view class="asset-fill" :style="{ width: '100%' }"></view>
            </view>
          </view>

          <!-- Beneficiary Card -->
          <view class="beneficiary-card">
            <view class="beneficiary-header">
              <text class="beneficiary-icon">👤</text>
              <text class="beneficiary-label">{{ t("beneficiary") }}</text>
            </view>
            <text class="beneficiary-address">{{ trust.beneficiary }}</text>
            <view class="beneficiary-allocation">
              <text class="allocation-label">{{ t("allocation") }}:</text>
              <text class="allocation-value">100%</text>
            </view>
          </view>

          <!-- Trigger Conditions -->
          <view class="trigger-section">
            <view class="trigger-header">
              <text class="trigger-icon">⏱️</text>
              <text class="trigger-label">{{ t("triggerCondition") }}</text>
            </view>
            <view class="trigger-timeline">
              <view class="timeline-item">
                <view class="timeline-dot active"></view>
                <view class="timeline-content">
                  <text class="timeline-title">{{ t("trustCreated") }}</text>
                  <text class="timeline-date">{{ t("now") }}</text>
                </view>
              </view>
              <view class="timeline-line"></view>
              <view class="timeline-item">
                <view class="timeline-dot"></view>
                <view class="timeline-content">
                  <text class="timeline-title">{{ t("inactivityPeriod") }}</text>
                  <text class="timeline-date">90 {{ t("days") }}</text>
                </view>
              </view>
              <view class="timeline-line"></view>
              <view class="timeline-item">
                <view class="timeline-dot"></view>
                <view class="timeline-content">
                  <text class="timeline-title">{{ t("trustActivates") }}</text>
                  <text class="timeline-date">{{ t("automatic") }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- Document Footer -->
          <view class="document-footer">
            <text class="footer-text">{{ t("documentId") }}: {{ trust.id }}</text>
            <text class="footer-signature">✍️ {{ t("digitalSignature") }}</text>
          </view>
        </view>
      </NeoCard>

      <!-- Create Trust Form -->
      <NeoCard :title="t('createTrust')" variant="accent">
        <view class="form-section">
          <view class="form-label">
            <text class="label-icon">📋</text>
            <text class="label-text">{{ t("trustDetails") }}</text>
          </view>
          <NeoInput v-model="newTrust.name" :placeholder="t('trustName')" />
        </view>

        <view class="form-section">
          <view class="form-label">
            <text class="label-icon">👤</text>
            <text class="label-text">{{ t("beneficiaryInfo") }}</text>
          </view>
          <NeoInput v-model="newTrust.beneficiary" :placeholder="t('beneficiaryAddress')" />
        </view>

        <view class="form-section">
          <view class="form-label">
            <text class="label-icon">💰</text>
            <text class="label-text">{{ t("assetAmount") }}</text>
          </view>
          <NeoInput v-model="newTrust.value" type="number" :placeholder="t('amount')" suffix="GAS" />
        </view>

        <view class="info-banner">
          <text class="info-icon">ℹ️</text>
          <view class="info-content">
            <text class="info-title">{{ t("importantNotice") }}</text>
            <text class="info-text">{{ t("infoText") }}</text>
          </view>
        </view>

        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="create">
          {{ t("createTrust") }}
        </NeoButton>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="success">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalTrusts") }}</text>
          <text class="stat-value">{{ stats.totalTrusts }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalValue") }}</text>
          <text class="stat-value">{{ stats.totalValue }} GAS</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("activeTrusts") }}</text>
          <text class="stat-value">{{ stats.activeTrusts }}</text>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";

const translations = {
  title: { en: "Heritage Trust", zh: "遗产信托" },
  yourTrusts: { en: "Your Trusts", zh: "您的信托" },
  to: { en: "To", zh: "受益人" },
  createTrust: { en: "Create Trust", zh: "创建信托" },
  trustName: { en: "Trust name", zh: "信托名称" },
  beneficiaryAddress: { en: "Beneficiary address", zh: "受益人地址" },
  amount: { en: "Amount (GAS)", zh: "金额 (GAS)" },
  infoText: { en: "Trust activates after 90 days of inactivity", zh: "信托在90天不活跃后激活" },
  creating: { en: "Creating...", zh: "创建中..." },
  trustCreated: { en: "Trust created!", zh: "信托已创建！" },
  error: { en: "Error", zh: "错误" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalTrusts: { en: "Total Trusts", zh: "总信托数" },
  totalValue: { en: "Total Value", zh: "总价值" },
  activeTrusts: { en: "Active Trusts", zh: "活跃信托" },

  // New translations for enhanced UI
  sealed: { en: "SEALED", zh: "已封存" },
  trustDocument: { en: "Trust Document", zh: "信托文件" },
  totalAssets: { en: "Total Assets", zh: "总资产" },
  beneficiary: { en: "Beneficiary", zh: "受益人" },
  allocation: { en: "Allocation", zh: "分配比例" },
  triggerCondition: { en: "Trigger Condition", zh: "触发条件" },
  now: { en: "Now", zh: "现在" },
  inactivityPeriod: { en: "Inactivity Period", zh: "不活跃期" },
  days: { en: "days", zh: "天" },
  trustActivates: { en: "Trust Activates", zh: "信托激活" },
  automatic: { en: "Automatic", zh: "自动" },
  documentId: { en: "Document ID", zh: "文档编号" },
  digitalSignature: { en: "Digital Signature", zh: "数字签名" },
  trustDetails: { en: "Trust Details", zh: "信托详情" },
  beneficiaryInfo: { en: "Beneficiary Information", zh: "受益人信息" },
  assetAmount: { en: "Asset Amount", zh: "资产金额" },
  importantNotice: { en: "Important Notice", zh: "重要提示" },
  active: { en: "ACTIVE", zh: "活跃" },
  pending: { en: "PENDING", zh: "待定" },
  triggered: { en: "TRIGGERED", zh: "已触发" },

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

const navTabs = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-heritagetrust";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface Trust {
  id: string;
  name: string;
  beneficiary: string;
  value: number;
  icon: string;
  status: "active" | "pending" | "triggered";
}

const trusts = ref<Trust[]>([
  { id: "1", name: "Family Fund", beneficiary: "NXXx...abc", value: 100, icon: "👨‍👩‍👧", status: "active" },
  { id: "2", name: "Charity", beneficiary: "NXXx...def", value: 50, icon: "❤️", status: "active" },
]);
const newTrust = ref({ name: "", beneficiary: "", value: "" });
const status = ref<{ msg: string; type: string } | null>(null);

const stats = computed(() => ({
  totalTrusts: trusts.value.length,
  totalValue: trusts.value.reduce((sum, t) => sum + t.value, 0),
  activeTrusts: trusts.value.length,
}));

// Fetch trusts data
const fetchData = async () => {
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("heritageTrust.getTrusts", { appId: APP_ID })) as Trust[] | null;
    if (data) {
      trusts.value = data;
    }
  } catch (e) {
    console.warn("[HeritageTrust] Failed to fetch data:", e);
  }
};

// Register trust for inactivity monitoring via Edge Function automation
const registerInactivityMonitor = async (trustId: string) => {
  try {
    await fetch("/api/automation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        taskName: `monitor-${trustId}`,
        taskType: "conditional",
        payload: {
          action: "custom",
          handler: "heritage:checkInactivity",
          data: { trustId, inactivityDays: 90 },
        },
        schedule: { intervalSeconds: 24 * 60 * 60 }, // Check daily
      }),
    });
  } catch (e) {
    console.warn("[HeritageTrust] Failed to register monitor:", e);
  }
};

const create = async () => {
  if (isLoading.value || !newTrust.value.name || !newTrust.value.beneficiary || !newTrust.value.value) return;
  try {
    status.value = { msg: "Creating trust...", type: "loading" };
    await payGAS(newTrust.value.value, `trust:${Date.now()}`);
    const trustId = Date.now().toString();
    trusts.value.push({
      id: trustId,
      name: newTrust.value.name,
      beneficiary: newTrust.value.beneficiary,
      value: parseFloat(newTrust.value.value),
      icon: "📜",
      status: "active",
    });
    // Register for inactivity monitoring
    await registerInactivityMonitor(trustId);
    status.value = { msg: t("trustCreated"), type: "success" };
    newTrust.value = { name: "", beneficiary: "", value: "" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  margin-bottom: $space-3;
  flex-shrink: 0;
  border: $border-width-md solid var(--border-color);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    box-shadow: $shadow-sm;
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    box-shadow: $shadow-sm;
  }
}

// Trust Document Styling
.trust-document {
  background: var(--bg-elevated);
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-lg;
  margin-bottom: $space-5;
  padding: $space-5;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--neo-purple), var(--brutal-yellow));
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: $border-width-sm dashed var(--border-color);
}

.document-seal {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--neo-purple);
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
}

.seal-icon {
  font-size: $font-size-xl;
}

.seal-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $neo-white;
  letter-spacing: 1px;
}

.document-status {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;

  &.active {
    background: var(--neo-green);
    color: $neo-black;
  }

  &.pending {
    background: var(--brutal-yellow);
    color: $neo-black;
  }

  &.triggered {
    background: var(--status-error);
    color: $neo-white;
  }
}

.status-dot {
  font-size: $font-size-sm;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 1px;
}

.document-title {
  text-align: center;
  margin-bottom: $space-5;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.title-text {
  display: block;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
}

.title-subtitle {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Asset Allocation Section
.asset-section {
  margin-bottom: $space-5;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.asset-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.asset-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-yellow);
}

.asset-bar {
  height: 8px;
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.asset-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--brutal-yellow), var(--neo-green));
  transition: width $transition-normal;
}

// Beneficiary Card
.beneficiary-card {
  margin-bottom: $space-5;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
}

.beneficiary-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.beneficiary-icon {
  font-size: $font-size-xl;
}

.beneficiary-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.beneficiary-address {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: var(--text-primary);
  margin-bottom: $space-3;
  padding: $space-3;
  background: var(--bg-elevated);
  border: $border-width-sm solid var(--border-color);
  font-family: monospace;
}

.beneficiary-allocation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $space-3;
  border-top: $border-width-sm solid var(--border-color);
}

.allocation-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.allocation-value {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4 0;
  border-bottom: $border-width-sm solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  font-size: $font-size-xl;
}

// Trigger Conditions Section
.trigger-section {
  margin-bottom: $space-5;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.trigger-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-4;
}

.trigger-icon {
  font-size: $font-size-xl;
}

.trigger-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trigger-timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: $space-3;
  position: relative;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--border-color);
  flex-shrink: 0;
  margin-top: 4px;

  &.active {
    background: var(--neo-green);
    border-color: var(--neo-green);
    box-shadow: 0 0 8px var(--neo-green);
  }
}

.timeline-line {
  width: 2px;
  height: 24px;
  background: var(--border-color);
  margin-left: 5px;
}

.timeline-content {
  flex: 1;
  margin-bottom: $space-3;
}

.timeline-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.timeline-date {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Document Footer
.document-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $space-4;
  border-top: $border-width-sm dashed var(--border-color);
  margin-top: $space-4;
}

.footer-text {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  font-family: monospace;
}

.footer-signature {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Form Sections
.form-section {
  margin-bottom: $space-4;
}

.form-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-2;
  padding: $space-2 $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.label-icon {
  font-size: $font-size-lg;
}

.label-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-banner {
  display: flex;
  gap: $space-3;
  padding: $space-4;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
  box-shadow: $shadow-sm;
}

.info-icon {
  font-size: $font-size-2xl;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: $space-2;
}

.info-text {
  display: block;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  line-height: 1.5;
}
</style>
