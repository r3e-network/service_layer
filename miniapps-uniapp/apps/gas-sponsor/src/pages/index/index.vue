<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center"
      >
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <!-- Sponsor Tab -->
      <view v-if="activeTab === 'sponsor'" class="tab-content">
        <!-- Gas Tank Visualization -->
        <GasTank
          :fuel-level-percent="fuelLevelPercent"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />

        <!-- User Balance Info -->
        <UserBalanceInfo
          :loading="loading"
          :user-address="userAddress"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />

        <!-- Request Sponsored Gas -->
        <RequestGasCard
          :is-eligible="isEligible"
          :remaining-quota="remainingQuota"
          v-model:requestAmount="requestAmount"
          :max-request-amount="maxRequestAmount"
          :is-requesting="isRequesting"
          :quick-amounts="quickAmounts"
          :t="t as any"
          @request="requestSponsorship"
        />

        <!-- How It Works -->
        <HowItWorksCard :t="t as any" />
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content">
        <!-- Daily Quota Display -->
        <DailyQuotaCard
          :quota-percent="quotaPercent"
          :daily-limit="dailyLimit"
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :reset-time="resetTime"
          :t="t as any"
        />

        <!-- Usage Statistics -->
        <UsageStatisticsCard
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :daily-limit="dailyLimit"
          :reset-time="resetTime"
          :t="t as any"
        />

        <!-- Eligibility Status -->
        <EligibilityStatusCard
          :gas-balance="gasBalance"
          :remaining-quota="remainingQuota"
          :user-address="userAddress"
          :t="t as any"
        />
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
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import GasTank from "./components/GasTank.vue";
import UserBalanceInfo from "./components/UserBalanceInfo.vue";
import RequestGasCard from "./components/RequestGasCard.vue";
import DailyQuotaCard from "./components/DailyQuotaCard.vue";
import UsageStatisticsCard from "./components/UsageStatisticsCard.vue";
import EligibilityStatusCard from "./components/EligibilityStatusCard.vue";
import HowItWorksCard from "./components/HowItWorksCard.vue";

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
  docSubtitle: {
    en: "Free GAS for new users to start transacting",
    zh: "为新用户提供免费 GAS 开始交易",
  },
  docDescription: {
    en: "Gas Sponsor provides free GAS to new Neo users with low balances. Request up to 0.1 GAS daily to cover transaction fees and get started on the Neo network.",
    zh: "Gas Sponsor 为低余额的 Neo 新用户提供免费 GAS。每天可请求最多 0.1 GAS 来支付交易费用，开始使用 Neo 网络。",
  },
  feature1Name: { en: "Daily Quota", zh: "每日配额" },
  feature1Desc: {
    en: "Request up to 0.1 GAS per day when your balance is low.",
    zh: "当余额较低时，每天可请求最多 0.1 GAS。",
  },
  feature2Name: { en: "Auto-Reset", zh: "自动重置" },
  feature2Desc: {
    en: "Quota resets daily at midnight UTC for continued access.",
    zh: "配额每天 UTC 午夜自动重置，持续可用。",
  },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-text {
  font-weight: 700;
  text-transform: uppercase;
  font-family: 'Inter', monospace;
  font-size: 12px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
