<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Sponsor Tab -->
      <view v-if="activeTab === 'sponsor'" class="tab-content">
        <!-- Gas Tank Visualization -->
        <NeoCard title="" variant="default" class="gas-tank-card">
          <view class="gas-tank-container">
            <view class="gas-tank">
              <view class="tank-body">
                <view class="fuel-level" :style="{ height: fuelLevelPercent + '%' }">
                  <view class="fuel-wave"></view>
                </view>
                <view class="tank-gauge">
                  <text class="gauge-label">GAS</text>
                  <text class="gauge-value">{{ formatBalance(gasBalance) }}</text>
                </view>
              </view>
              <view class="tank-nozzle"></view>
            </view>
            <view class="tank-status">
              <view :class="['status-indicator', isEligible ? 'eligible' : 'full']">
                <text class="status-icon">{{ isEligible ? "⚡" : "✓" }}</text>
                <text class="status-text">{{ isEligible ? t("needsFuel") : t("tankFull") }}</text>
              </view>
            </view>
          </view>
        </NeoCard>

        <!-- User Balance Info -->
        <NeoCard :title="t('yourBalance')" variant="default">
          <view v-if="loading" class="loading">
            <text>{{ t("checkingEligibility") }}</text>
          </view>
          <view v-else>
            <view class="info-row">
              <text class="info-label">{{ t("walletAddress") }}</text>
              <text class="info-value mono">{{ shortenAddress(userAddress) }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">{{ t("gasBalance") }}</text>
              <text class="info-value highlight">{{ formatBalance(gasBalance) }} GAS</text>
            </view>
            <view class="info-row">
              <text class="info-label">{{ t("eligibility") }}</text>
              <text :class="['info-value', 'badge', isEligible ? 'eligible' : 'not-eligible']">
                {{ isEligible ? "✓ " + t("eligible") : "✗ " + t("notEligible") }}
              </text>
            </view>
          </view>
        </NeoCard>

        <!-- Request Sponsored Gas -->
        <NeoCard :title="t('requestSponsoredGas')" variant="accent" class="request-card">
          <view v-if="!isEligible" class="not-eligible-msg">
            <view class="warning-icon">⚠️</view>
            <text class="warning-title">{{ t("notEligibleTitle") }}</text>
            <text class="warning-desc">{{ t("balanceExceeds") }}</text>
            <text class="warning-desc">{{ t("newUsersOnly") }}</text>
          </view>
          <view v-else-if="remainingQuota <= 0" class="not-eligible-msg">
            <view class="warning-icon">🚫</view>
            <text class="warning-title">{{ t("quotaExhausted") }}</text>
            <text class="warning-desc">{{ t("tryTomorrow") }}</text>
          </view>
          <view v-else class="request-form">
            <view class="fuel-pump-display">
              <view class="pump-screen">
                <text class="pump-label">{{ t("requestAmount") }}</text>
                <text class="pump-amount">{{ requestAmount || "0.00" }}</text>
                <text class="pump-unit">GAS</text>
              </view>
              <view class="pump-limits">
                <text class="limit-text">{{ t("maxRequest") }}: {{ formatBalance(maxRequestAmount) }} GAS</text>
                <text class="limit-text">{{ t("remaining") }}: {{ formatBalance(remainingQuota) }} GAS</text>
              </view>
            </view>

            <NeoInput
              v-model="requestAmount"
              type="number"
              :label="t('amountToRequest')"
              placeholder="0.01"
              suffix="GAS"
            />

            <view class="quick-amounts">
              <view
                v-for="amount in quickAmounts"
                :key="amount"
                class="quick-btn"
                @click="requestAmount = amount.toString()"
              >
                <text>{{ amount }}</text>
              </view>
            </view>

            <view style="margin-top: 16px">
              <NeoButton
                variant="primary"
                size="lg"
                block
                :loading="isRequesting"
                :disabled="!isEligible || remainingQuota <= 0"
                @click="requestSponsorship"
              >
                {{ isRequesting ? t("requesting") : "⛽ " + t("requestGas") }}
              </NeoButton>
            </view>
          </view>
        </NeoCard>

        <!-- How It Works -->
        <NeoCard :title="t('howItWorks')" variant="default">
          <view class="help-item">
            <text class="help-num">1</text>
            <text class="help-text">{{ t("step1") }}</text>
          </view>
          <view class="help-item">
            <text class="help-num">2</text>
            <text class="help-text">{{ t("step2") }}</text>
          </view>
          <view class="help-item">
            <text class="help-num">3</text>
            <text class="help-text">{{ t("step3") }}</text>
          </view>
          <view class="help-item">
            <text class="help-num">4</text>
            <text class="help-text">{{ t("step4") }}</text>
          </view>
        </NeoCard>
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content">
        <!-- Daily Quota Display -->
        <NeoCard :title="t('dailyQuota')" variant="default">
          <view class="quota-display">
            <view class="quota-header">
              <text class="quota-title">{{ t("todayUsage") }}</text>
              <text class="quota-percent">{{ Math.round(quotaPercent) }}%</text>
            </view>
            <view class="quota-bar-container">
              <view class="quota-bar">
                <view class="quota-fill" :style="{ width: quotaPercent + '%' }"></view>
              </view>
              <view class="quota-markers">
                <text class="marker">0</text>
                <text class="marker">{{ formatBalance(dailyLimit) }}</text>
              </view>
            </view>
            <text class="quota-text"> {{ formatBalance(usedQuota) }} / {{ formatBalance(dailyLimit) }} GAS </text>
          </view>

          <view class="info-row">
            <text class="info-label">{{ t("remainingToday") }}</text>
            <text class="info-value highlight">{{ formatBalance(remainingQuota) }} GAS</text>
          </view>
          <view class="info-row">
            <text class="info-label">{{ t("resetsIn") }}</text>
            <text class="info-value">{{ resetTime }}</text>
          </view>
        </NeoCard>

        <!-- Usage Statistics -->
        <NeoCard :title="t('statistics')" variant="accent">
          <view class="stat-grid">
            <view class="stat-item">
              <text class="stat-icon">⛽</text>
              <text class="stat-value">{{ formatBalance(usedQuota) }}</text>
              <text class="stat-label">{{ t("usedToday") }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-icon">🎯</text>
              <text class="stat-value">{{ formatBalance(remainingQuota) }}</text>
              <text class="stat-label">{{ t("available") }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-icon">📊</text>
              <text class="stat-value">{{ formatBalance(dailyLimit) }}</text>
              <text class="stat-label">{{ t("dailyLimit") }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-icon">⏰</text>
              <text class="stat-value">{{ resetTime }}</text>
              <text class="stat-label">{{ t("nextReset") }}</text>
            </view>
          </view>
        </NeoCard>

        <!-- Eligibility Status -->
        <NeoCard :title="t('eligibilityStatus')" variant="default">
          <view class="eligibility-check">
            <view class="check-item">
              <text class="check-icon">{{ parseFloat(gasBalance) < 0.1 ? "✓" : "✗" }}</text>
              <text class="check-text">{{ t("balanceCheck") }} ({{ formatBalance(gasBalance) }} GAS)</text>
            </view>
            <view class="check-item">
              <text class="check-icon">{{ remainingQuota > 0 ? "✓" : "✗" }}</text>
              <text class="check-text">{{ t("quotaCheck") }} ({{ formatBalance(remainingQuota) }} GAS)</text>
            </view>
            <view class="check-item">
              <text class="check-icon">{{ userAddress ? "✓" : "✗" }}</text>
              <text class="check-text">{{ t("walletCheck") }}</text>
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
import { useWallet, useGasSponsor } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Gas Sponsor", zh: "Gas 赞助" },
  subtitle: { en: "Get free GAS for transactions", zh: "获取免费 GAS 进行交易" },
  yourBalance: { en: "Your Balance", zh: "您的余额" },
  dailyQuota: { en: "Daily Quota", zh: "每日配额" },
  remainingToday: { en: "Remaining Today", zh: "今日剩余" },
  resetsIn: { en: "Resets In", zh: "重置时间" },
  requestSponsoredGas: { en: "Request Sponsored Gas", zh: "请求赞助 Gas" },
  balanceExceeds: { en: "Your GAS balance exceeds 0.1 GAS.", zh: "您的 GAS 余额超过 0.1 GAS。" },
  newUsersOnly: { en: "This service is for new users only.", zh: "此服务仅供新用户使用。" },
  quotaExhausted: { en: "Daily quota exhausted", zh: "每日配额已用完" },
  tryTomorrow: { en: "Please try again tomorrow.", zh: "请明天再试。" },
  amountToRequest: { en: "Amount to request", zh: "请求数量" },
  requesting: { en: "Requesting...", zh: "请求中..." },
  requestGas: { en: "Request GAS", zh: "请求 GAS" },
  maxRequest: { en: "Max request", zh: "最大请求" },
  remaining: { en: "Remaining", zh: "剩余" },
  requestSuccess: { en: "GAS sponsored successfully!", zh: "GAS 赞助成功！" },
  error: { en: "Error", zh: "错误" },
  tabSponsor: { en: "Sponsor", zh: "赞助" },
  tabStats: { en: "Stats", zh: "统计" },
  needsFuel: { en: "Needs Fuel", zh: "需要加油" },
  tankFull: { en: "Tank Full", zh: "油箱已满" },
  checkingEligibility: { en: "Checking eligibility...", zh: "检查资格中..." },
  walletAddress: { en: "Wallet Address", zh: "钱包地址" },
  gasBalance: { en: "GAS Balance", zh: "GAS 余额" },
  eligibility: { en: "Eligibility", zh: "资格" },
  eligible: { en: "Eligible", zh: "符合资格" },
  notEligible: { en: "Not Eligible", zh: "不符合资格" },
  notEligibleTitle: { en: "Not Eligible", zh: "不符合资格" },
  requestAmount: { en: "Request Amount", zh: "请求数量" },
  howItWorks: { en: "How It Works", zh: "如何使用" },
  step1: { en: "New users with less than 0.1 GAS are eligible", zh: "余额少于 0.1 GAS 的新用户符合资格" },
  step2: { en: "Request up to 0.1 GAS per day for free", zh: "每天可免费请求最多 0.1 GAS" },
  step3: { en: "Use sponsored gas to pay transaction fees", zh: "使用赞助的 gas 支付交易费用" },
  step4: { en: "Once you have enough GAS, help others!", zh: "当您有足够的 GAS 后，帮助其他人！" },
  todayUsage: { en: "Today's Usage", zh: "今日使用" },
  statistics: { en: "Statistics", zh: "统计数据" },
  usedToday: { en: "Used Today", zh: "今日已用" },
  available: { en: "Available", zh: "可用" },
  dailyLimit: { en: "Daily Limit", zh: "每日限额" },
  nextReset: { en: "Next Reset", zh: "下次重置" },
  eligibilityStatus: { en: "Eligibility Status", zh: "资格状态" },
  balanceCheck: { en: "Balance < 0.1 GAS", zh: "余额 < 0.1 GAS" },
  quotaCheck: { en: "Quota Available", zh: "配额可用" },
  walletCheck: { en: "Wallet Connected", zh: "钱包已连接" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: { en: "Professional documentation for this application is coming soon.", zh: "此应用程序的专业文档即将推出。" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
};

const t = createT(translations);

const { address, connect } = useWallet();
const { isLoading: isRequesting, checkEligibility, requestSponsorship: apiRequest } = useGasSponsor();

const ELIGIBILITY_THRESHOLD = 0.1;

const activeTab = ref("sponsor");
const navTabs: NavTab[] = [
  { id: "sponsor", icon: "gift", label: t("tabSponsor") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const userAddress = ref("");
const gasBalance = ref("0");
const usedQuota = ref("0");
const dailyLimit = ref("0.1");
const resetsAt = ref("");
const loading = ref(true);
const requestAmount = ref("0.01");
const status = ref<{ msg: string; type: string } | null>(null);

const quickAmounts = [0.01, 0.02, 0.05, 0.1];

const isEligible = computed(() => parseFloat(gasBalance.value) < ELIGIBILITY_THRESHOLD);
const remainingQuota = computed(() => Math.max(0, parseFloat(dailyLimit.value) - parseFloat(usedQuota.value)));
const quotaPercent = computed(() => (parseFloat(usedQuota.value) / parseFloat(dailyLimit.value)) * 100);
const maxRequestAmount = computed(() => Math.min(remainingQuota.value, 0.05).toString());
const fuelLevelPercent = computed(() => {
  const balance = parseFloat(gasBalance.value);
  return Math.min((balance / ELIGIBILITY_THRESHOLD) * 100, 100);
});

const resetTime = computed(() => {
  if (!resetsAt.value) return "--";
  const resetDate = new Date(resetsAt.value);
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
});

const shortenAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected");
const formatBalance = (val: string | number) => parseFloat(String(val)).toFixed(4);

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const loadUserData = async () => {
  loading.value = true;
  try {
    await connect();
    userAddress.value = address.value || "";

    const statusData = await checkEligibility();
    gasBalance.value = statusData.gas_balance;
    usedQuota.value = statusData.used_today;
    dailyLimit.value = statusData.daily_limit;
    resetsAt.value = statusData.resets_at;
  } catch (e: any) {
    showStatus(e.message || "Failed to load data", "error");
  } finally {
    loading.value = false;
  }
};

const requestSponsorship = async () => {
  if (!isEligible.value || remainingQuota.value <= 0) return;

  const amount = parseFloat(requestAmount.value);
  if (isNaN(amount) || amount <= 0 || amount > remainingQuota.value) {
    showStatus("Invalid amount", "error");
    return;
  }

  try {
    showStatus("Requesting sponsored gas...", "loading");
    const result = await apiRequest(requestAmount.value);
    showStatus(`Request submitted! ID: ${result.request_id.slice(0, 8)}...`, "success");
    requestAmount.value = "0.01";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || "Sponsorship request failed", "error");
  }
};

onMounted(() => {
  loadUserData();
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
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
}

.tab-content {
  flex: 1;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: var(--status-success);
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: var(--status-error);
  }
  &.loading {
    background: var(--status-warning);
    color: $neo-black;
    border-color: var(--status-warning);
  }
}

// Gas Tank Visualization
.gas-tank-card {
  margin-bottom: $space-4;
}

.gas-tank-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6 $space-4;
}

.gas-tank {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: $space-2;
  margin-bottom: $space-4;
}

.tank-body {
  position: relative;
  width: 120px;
  height: 180px;
  background: var(--bg-secondary);
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-md;
  overflow: hidden;
}

.fuel-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--neo-green) 0%, var(--brutal-lime) 100%);
  transition: height $transition-slow;
  border-top: $border-width-sm solid var(--border-color);
}

.fuel-wave {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--neo-green);
  opacity: 0.6;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

.tank-gauge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1;
}

.gauge-label {
  display: block;
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.gauge-value {
  display: block;
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  font-family: $font-mono;
}

.tank-nozzle {
  width: 40px;
  height: 60px;
  background: var(--brutal-orange);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 8px;
    background: var(--brutal-orange);
    border: $border-width-sm solid var(--border-color);
    border-bottom: none;
  }
}

.tank-status {
  width: 100%;
  max-width: 200px;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;

  &.eligible {
    background: var(--brutal-yellow);
    color: $neo-black;
  }

  &.full {
    background: var(--neo-green);
    color: $neo-black;
  }
}

.status-icon {
  font-size: $font-size-xl;
}

.status-text {
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// User Balance & Info Rows
.loading {
  text-align: center;
  padding: $space-5;
  color: var(--text-secondary);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  font-size: $font-size-sm;
  letter-spacing: 0.5px;
}

.info-value {
  color: var(--text-primary);
  font-weight: $font-weight-bold;

  &.mono {
    font-family: $font-mono;
    font-size: $font-size-sm;
  }

  &.highlight {
    color: var(--neo-green);
  }

  &.badge {
    padding: $space-1 $space-2;
    border: $border-width-sm solid var(--border-color);
    font-size: $font-size-xs;
  }

  &.eligible {
    background: var(--status-success);
    color: $neo-black;
  }

  &.not-eligible {
    background: var(--status-error);
    color: $neo-white;
  }
}

// Request Form
.request-card {
  margin-bottom: $space-4;
}

.not-eligible-msg {
  text-align: center;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
}

.warning-icon {
  font-size: $font-size-4xl;
  margin-bottom: $space-2;
}

.warning-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-transform: uppercase;
}

.warning-desc {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// Fuel Pump Display
.fuel-pump-display {
  background: var(--brutal-orange);
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-2;
}

.pump-screen {
  background: $neo-black;
  border: $border-width-sm solid var(--border-color);
  padding: $space-4;
  text-align: center;
  margin-bottom: $space-3;
}

.pump-label {
  display: block;
  font-size: $font-size-xs;
  color: var(--neo-green);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
}

.pump-amount {
  display: block;
  font-size: $font-size-4xl;
  color: var(--neo-green);
  font-weight: $font-weight-black;
  font-family: $font-mono;
  line-height: $line-height-tight;
}

.pump-unit {
  display: block;
  font-size: $font-size-sm;
  color: var(--brutal-yellow);
  font-weight: $font-weight-bold;
  margin-top: $space-1;
}

.pump-limits {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
}

.limit-text {
  font-size: $font-size-xs;
  color: $neo-black;
  font-weight: $font-weight-bold;
  background: var(--brutal-yellow);
  padding: $space-1 $space-2;
  border: $border-width-sm solid var(--border-color);
}

// Quick Amount Buttons
.quick-amounts {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.quick-btn {
  flex: 1;
  min-width: 60px;
  padding: $space-2 $space-3;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  text-align: center;
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--shadow-color);
  }

  text {
    font-weight: $font-weight-bold;
    color: var(--text-primary);
    font-size: $font-size-sm;
  }
}

// How It Works
.help-item {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 0;
}

.help-num {
  width: 32px;
  height: 32px;
  background: var(--neo-green);
  color: $neo-black;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-base;
  font-weight: $font-weight-black;
  flex-shrink: 0;
}

.help-text {
  color: var(--text-secondary);
  font-size: $font-size-base;
  line-height: $line-height-normal;
  font-weight: $font-weight-medium;
  flex: 1;
}

// Quota Display
.quota-display {
  margin-bottom: $space-4;
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.quota-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
}

.quota-percent {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  font-family: $font-mono;
}

.quota-bar-container {
  margin-bottom: $space-2;
}

.quota-bar {
  height: 24px;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  overflow: hidden;
  position: relative;
}

.quota-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-green) 0%, var(--brutal-lime) 100%);
  transition: width $transition-slow;
  border-right: $border-width-sm solid var(--border-color);
}

.quota-markers {
  display: flex;
  justify-content: space-between;
  margin-top: $space-1;
}

.marker {
  font-size: $font-size-xs;
  color: var(--text-muted);
  font-weight: $font-weight-medium;
  font-family: $font-mono;
}

.quota-text {
  font-size: $font-size-base;
  color: var(--text-secondary);
  text-align: center;
  display: block;
  font-weight: $font-weight-bold;
  font-family: $font-mono;
}

// Statistics Grid
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  text-align: center;
}

.stat-icon {
  font-size: $font-size-3xl;
  margin-bottom: $space-2;
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  font-family: $font-mono;
  margin-bottom: $space-1;
}

.stat-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Eligibility Check
.eligibility-check {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.check-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.check-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  flex-shrink: 0;
}

.check-text {
  flex: 1;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Scrollable content
.scrollable {
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
</style>
