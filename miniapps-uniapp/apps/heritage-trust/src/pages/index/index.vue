<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center"
      >
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

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
        <view class="stats-grid-neo">
          <view class="stat-item-neo">
            <text class="stat-label">{{ t("totalTrusts") }}</text>
            <text class="stat-value">{{ stats.totalTrusts }}</text>
          </view>
          <view class="stat-item-neo">
            <text class="stat-label">{{ t("totalValue") }}</text>
            <text class="stat-value">{{ stats.totalValue }} GAS</text>
          </view>
          <view class="stat-item-neo">
            <text class="stat-label">{{ t("activeTrusts") }}</text>
            <text class="stat-value">{{ stats.activeTrusts }}</text>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

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
  docSubtitle: {
    en: "Automated digital inheritance with inactivity-triggered transfers",
    zh: "基于不活跃触发的自动数字遗产转移",
  },
  docDescription: {
    en: "Heritage Trust enables secure digital asset inheritance on Neo. Create trusts that automatically transfer assets to beneficiaries after a configurable inactivity period, ensuring your digital wealth passes to loved ones.",
    zh: "Heritage Trust 在 Neo 上实现安全的数字资产继承。创建信托，在可配置的不活跃期后自动将资产转移给受益人，确保您的数字财富传承给亲人。",
  },
  step1: {
    en: "Connect your Neo wallet and deposit assets into a new trust",
    zh: "连接您的 Neo 钱包并将资产存入新信托",
  },
  step2: {
    en: "Set the beneficiary address and configure the inactivity period (default 90 days)",
    zh: "设置受益人地址并配置不活跃期（默认 90 天）",
  },
  step3: {
    en: "The smart contract monitors your wallet activity automatically",
    zh: "智能合约自动监控您的钱包活动",
  },
  step4: {
    en: "If inactivity threshold is reached, assets transfer to beneficiary automatically",
    zh: "如果达到不活跃阈值，资产将自动转移给受益人",
  },
  feature1Name: { en: "Inactivity Trigger", zh: "不活跃触发" },
  feature1Desc: {
    en: "Automated monitoring detects wallet inactivity and triggers inheritance transfer.",
    zh: "自动监控检测钱包不活跃状态并触发遗产转移。",
  },
  feature2Name: { en: "Secure Beneficiary", zh: "安全受益人" },
  feature2Desc: {
    en: "Beneficiary addresses are locked on-chain and cannot be changed without owner signature.",
    zh: "受益人地址锁定在链上，未经所有者签名无法更改。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-heritage-trust";
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
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.trust-document {
  background: white;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  margin-bottom: $space-8;
  padding: $space-6;
  position: relative;
  &::before {
    content: "OFFICIAL TRUST";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 24px;
    background: black;
    color: var(--brutal-yellow);
    font-size: 10px;
    font-weight: $font-weight-black;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 2px;
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-6 0 $space-4;
  border-bottom: 3px solid black;
  padding-bottom: $space-3;
}
.document-seal {
  background: black;
  color: white;
  padding: 4px 12px;
  border: 2px solid black;
  display: flex;
  align-items: center;
  gap: $space-2;
  box-shadow: 3px 3px 0 var(--brutal-red);
}
.seal-icon { font-size: 18px; }
.seal-text { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; letter-spacing: 2px; }

.document-status {
  padding: 4px 12px;
  border: 3px solid black;
  font-weight: $font-weight-black;
  font-size: 10px;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 black;
  &.active { background: var(--neo-green); }
  &.pending { background: var(--brutal-yellow); }
  &.triggered { background: var(--brutal-red); color: white; }
}

.document-title {
  text-align: center;
  margin: $space-6 0;
  padding: $space-4;
  background: #eee;
  border: 3px solid black;
  box-shadow: inset 4px 4px 0 rgba(0,0,0,0.1);
}
.title-text { font-size: 24px; font-weight: $font-weight-black; display: block; text-transform: uppercase; border-bottom: 2px solid black; }
.title-subtitle { font-size: 10px; font-weight: $font-weight-black; opacity: 1; text-transform: uppercase; margin-top: 4px; display: block; }

.asset-section { margin-bottom: $space-6; }
.asset-header { display: flex; justify-content: space-between; margin-bottom: $space-3; }
.asset-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; background: black; color: white; padding: 2px 8px; }
.asset-value { font-size: 18px; font-weight: $font-weight-black; font-family: $font-mono; }
.asset-bar { height: 20px; background: white; border: 3px solid black; padding: 2px; }
.asset-fill { height: 100%; background: var(--brutal-yellow); border-right: 2px solid black; }

.beneficiary-card { background: white; border: 3px solid black; padding: $space-4; margin-bottom: $space-6; box-shadow: 5px 5px 0 black; }
.beneficiary-header { display: flex; align-items: center; gap: $space-2; margin-bottom: 8px; }
.beneficiary-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; border-bottom: 2px solid black; }
.beneficiary-address { font-family: $font-mono; font-size: 12px; font-weight: $font-weight-black; background: #eee; padding: $space-3; border: 2px solid black; display: block; margin: $space-2 0; word-break: break-all; }
.beneficiary-allocation { display: flex; justify-content: space-between; font-weight: $font-weight-black; font-size: 12px; margin-top: 8px; border-top: 2px solid black; padding-top: 4px; }

.trigger-section { background: black; color: white; padding: $space-5; border: 3px solid black; margin-bottom: $space-6; }
.trigger-header { display: flex; align-items: center; gap: $space-2; margin-bottom: $space-4; }
.trigger-label { font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; color: var(--brutal-yellow); }
.trigger-timeline { display: flex; flex-direction: column; gap: $space-4; }
.timeline-item { display: flex; align-items: center; gap: $space-4; }
.timeline-dot { width: 12px; height: 12px; border: 2px solid white; background: transparent; &.active { background: var(--brutal-green); border-color: var(--brutal-green); } }
.timeline-line { width: 2px; height: 20px; background: #444; margin-left: 5px; }
.timeline-title { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; }
.timeline-date { font-size: 10px; color: var(--brutal-yellow); font-weight: $font-weight-black; }

.document-footer { display: flex; justify-content: space-between; font-size: 10px; font-weight: $font-weight-black; border-top: 3px solid black; padding-top: $space-3; margin-top: $space-4; }
.footer-signature { background: #eee; padding: 2px 8px; border: 1px solid black; }

.form-section { margin-bottom: $space-4; }
.form-label { display: flex; align-items: center; gap: $space-2; margin-bottom: 6px; }
.label-text { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; border-bottom: 2px solid black; }

.info-banner { background: var(--brutal-yellow); border: 3px solid black; padding: $space-4; display: flex; gap: $space-4; margin-bottom: $space-6; box-shadow: 6px 6px 0 black; }
.info-title { font-weight: $font-weight-black; font-size: 12px; text-transform: uppercase; display: block; margin-bottom: 4px; border-bottom: 2px solid black; }
.info-text { font-size: 10px; font-weight: $font-weight-black; line-height: 1.5; }

.stats-grid-neo { display: flex; flex-direction: column; gap: $space-4; }
.stat-item-neo { display: flex; justify-content: space-between; align-items: center; padding: $space-4; background: white; border: 3px solid black; box-shadow: 4px 4px 0 black; }
.stat-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; }
.stat-value { font-size: 18px; font-weight: $font-weight-black; font-family: $font-mono; background: black; color: white; padding: 2px 10px; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
