<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center glass-status"
      >
        <text class="status-msg">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="status-msg text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
              t("switchToNeo")
            }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Sponsor Tab -->
      <view v-if="activeTab === 'sponsor'" class="tab-content">
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
        <!-- Gas Tank Visualization -->
        <GasTank
          :fuel-level-percent="fuelLevelPercent"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />
      </view>

      <!-- Donate Tab -->
      <view v-if="activeTab === 'donate'" class="tab-content">
        <NeoCard variant="accent" class="glass-container">
          <view class="donate-form">
            <text class="form-subtitle">{{ t("donateSubtitle") }}</text>
            <text class="form-description">{{ t("donateDescription") }}</text>
            <view class="input-section">
              <text class="input-label">{{ t("donateAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="amt in [0.1, 0.5, 1, 5]"
                  :key="amt"
                  :class="['preset-btn glass-btn', { active: donateAmount === amt.toString() }]"
                  @click="donateAmount = amt.toString()"
                >
                  <text class="preset-value">{{ amt }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="donateAmount" type="number" placeholder="0.1" suffix="GAS" />
            </view>
            <NeoButton variant="primary" size="lg" block :loading="isDonating" @click="handleDonate">
              {{ isDonating ? t("donating") : t("donateBtn") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Send Tab -->
      <view v-if="activeTab === 'send'" class="tab-content">
        <NeoCard variant="accent" class="glass-container">
          <view class="send-form">
            <text class="form-subtitle">{{ t("sendSubtitle") }}</text>
            <view class="input-section">
              <text class="input-label">{{ t("recipientAddress") }}</text>
              <NeoInput v-model="recipientAddress" :placeholder="t('recipientPlaceholder')" />
            </view>
            <view class="input-section">
              <text class="input-label">{{ t("sendAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="amt in [0.05, 0.1, 0.2, 0.5]"
                  :key="amt"
                  :class="['preset-btn glass-btn', { active: sendAmount === amt.toString() }]"
                  @click="sendAmount = amt.toString()"
                >
                  <text class="preset-value">{{ amt }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="sendAmount" type="number" placeholder="0.1" suffix="GAS" />
            </view>
            <NeoButton variant="primary" size="lg" block :loading="isSending" @click="handleSend">
              {{ isSending ? t("sending") : t("sendBtn") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content scrollable">
        <!-- User Balance Info -->
        <UserBalanceInfo
          :loading="loading"
          :user-address="userAddress"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />

        <DailyQuotaCard
          :quota-percent="quotaPercent"
          :daily-limit="dailyLimit"
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :reset-time="resetTime"
          :t="t as any"
        />

        <UsageStatisticsCard
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :daily-limit="dailyLimit"
          :reset-time="resetTime"
          :t="t as any"
        />

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
        <HowItWorksCard :t="t as any" />
      </view>
    </view>
  </AppLayout>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useGasSponsor } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoDoc, NeoButton, NeoInput } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import GasTank from "./components/GasTank.vue";
import UserBalanceInfo from "./components/UserBalanceInfo.vue";
import RequestGasCard from "./components/RequestGasCard.vue";
import DailyQuotaCard from "./components/DailyQuotaCard.vue";
import UsageStatisticsCard from "./components/UsageStatisticsCard.vue";
import EligibilityStatusCard from "./components/EligibilityStatusCard.vue";
import HowItWorksCard from "./components/HowItWorksCard.vue";


const { t } = useI18n();

const { address, connect, invokeContract, chainType, switchChain } = useWallet() as any;
const { isRequestingSponsorship: isRequesting, checkEligibility, requestSponsorship: apiRequest } = useGasSponsor();

const ELIGIBILITY_THRESHOLD = 0.1;

const activeTab = ref("sponsor");
const navTabs = computed<NavTab[]>(() => [
  { id: "sponsor", icon: "gift", label: t("tabSponsor") },
  { id: "donate", icon: "heart", label: t("tabDonate") },
  { id: "send", icon: "send", label: t("tabSend") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const userAddress = ref("");
const gasBalance = ref("0");
const usedQuota = ref("0");
const dailyLimit = ref("0.1");
const resetsAt = ref("");
const loading = ref(true);
const requestAmount = ref("0.01");
const status = ref<{ msg: string; type: string } | null>(null);

const quickAmounts = [0.01, 0.02, 0.05, 0.1];

// Donate and Send state
const donateAmount = ref("0.1");
const sendAmount = ref("0.1");
const recipientAddress = ref("");
const isDonating = ref(false);
const isSending = ref(false);
const GAS_CONTRACT = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const SPONSOR_POOL_ADDRESS = "NikhQp1aAD1YFCiwknhM5LQQebj4464bCJ"; // Gas sponsor pool

const isEligible = computed(() => parseFloat(gasBalance.value) < ELIGIBILITY_THRESHOLD);
const remainingQuota = computed(() => Math.max(0, parseFloat(dailyLimit.value) - parseFloat(usedQuota.value)));
const quotaPercent = computed(() => {
  const limit = parseFloat(dailyLimit.value);
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return (parseFloat(usedQuota.value) / limit) * 100;
});
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
  if (diff <= 0) return t("now");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}${t("hoursShort")} ${minutes}${t("minutesShort")}`;
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
    showStatus(e.message || t("loadFailed"), "error");
  } finally {
    loading.value = false;
  }
};

const requestSponsorship = async () => {
  if (!isEligible.value || remainingQuota.value <= 0) return;

  const amount = parseFloat(requestAmount.value);
  if (Number.isNaN(amount) || amount <= 0 || amount > remainingQuota.value) {
    showStatus(t("invalidAmount"), "error");
    return;
  }

  try {
    showStatus(t("requestingSponsorship"), "loading");
    const result = await apiRequest(requestAmount.value);
    showStatus(t("requestSubmitted", { id: `${result.request_id.slice(0, 8)}...` }), "success");
    requestAmount.value = "0.01";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("requestFailed"), "error");
  }
};

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const handleDonate = async () => {
  if (isDonating.value) return;
  const amount = parseFloat(donateAmount.value);
  if (Number.isNaN(amount) || amount <= 0) {
    showStatus(t("invalidAmount"), "error");
    return;
  }
  isDonating.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("walletNotConnected"));
    await invokeContract({
      contractAddress: GAS_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: SPONSOR_POOL_ADDRESS },
        { type: "Integer", value: toFixed8(donateAmount.value) },
        { type: "Any", value: null },
      ],
    });
    showStatus(t("donateSuccess"), "success");
    donateAmount.value = "0.1";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isDonating.value = false;
  }
};

const handleSend = async () => {
  if (isSending.value) return;
  if (!recipientAddress.value || recipientAddress.value.length < 30) {
    showStatus(t("invalidAddress"), "error");
    return;
  }
  const amount = parseFloat(sendAmount.value);
  if (Number.isNaN(amount) || amount <= 0) {
    showStatus(t("invalidAmount"), "error");
    return;
  }
  isSending.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("walletNotConnected"));
    await invokeContract({
      contractAddress: GAS_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: recipientAddress.value },
        { type: "Integer", value: toFixed8(sendAmount.value) },
        { type: "Any", value: null },
      ],
    });
    showStatus(t("sendSuccess"), "success");
    sendAmount.value = "0.1";
    recipientAddress.value = "";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isSending.value = false;
  }
};

onMounted(() => {
  loadUserData();
  // We can't auto-refresh due to rate limits potentially, but could add a timer if needed
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$gas-bg: #1a0b2e;
$gas-pink: #d946ef;
$gas-cyan: #06b6d4;
$gas-purple: #701a75;
$gas-grid: rgba(217, 70, 239, 0.15);

:global(page) {
  background: $gas-bg;
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $gas-bg;
  background-image: 
    linear-gradient($gas-grid 1px, transparent 1px),
    linear-gradient(90deg, $gas-grid 1px, transparent 1px);
  background-size: 40px 40px;
  min-height: 100vh;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
}

/* Gas Station Component Overrides */
:deep(.neo-card) {
  background: rgba(26, 11, 46, 0.9) !important;
  border: 1px solid $gas-pink !important;
  border-bottom: 2px solid $gas-cyan !important;
  border-radius: 4px !important;
  box-shadow: 0 0 15px rgba(217, 70, 239, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.1) !important;
  color: #fff !important;
  backdrop-filter: blur(10px);
  
  &.variant-danger {
    border-color: #ef4444 !important;
    background: rgba(40, 10, 10, 0.9) !important;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3) !important;
  }
}

:deep(.neo-button) {
  border-radius: 99px !important; /* Pill shape */
  font-family: 'Orbitron', sans-serif !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800 !important;
  
  &.variant-primary {
    background: linear-gradient(90deg, $gas-pink, $gas-cyan) !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 0 20px rgba(217, 70, 239, 0.5) !important;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 0 10px rgba(217, 70, 239, 0.8) !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $gas-cyan !important;
    color: $gas-cyan !important;
    box-shadow: 0 0 5px rgba(6, 182, 212, 0.3) !important;
  }
}

:deep(.neo-input) {
  background: rgba(0,0,0,0.4) !important;
  border: 1px solid $gas-pink !important;
  border-radius: 4px !important;
  color: #fff !important;
  font-family: 'Courier New', monospace !important;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-msg {
  font-weight: 700;
  text-transform: uppercase;
  font-family: $font-mono;
  font-size: 12px;
  color: $gas-cyan;
  text-shadow: 0 0 5px rgba(6, 182, 212, 0.8);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.donate-form,
.send-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-subtitle {
  font-weight: 800;
  font-size: 14px;
     color: $gas-pink;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  text-shadow: 0 0 8px $gas-pink;
}

.form-description {
  font-size: 12px;
  color: #d1d5db;
  line-height: 1.5;
  margin-bottom: 8px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: $gas-cyan;
  letter-spacing: 0.05em;
  text-shadow: 0 0 5px $gas-cyan;
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.preset-btn {
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $gas-purple;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(5px);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(217, 70, 239, 0.2);
    border-color: $gas-pink;
    box-shadow: 0 0 15px rgba(217, 70, 239, 0.5);
    .preset-value { color: $gas-pink; }
  }
}

.preset-value {
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  font-family: $font-mono;
}

.preset-unit {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.7;
  color: $gas-cyan;
}

.glass-status {
  text-align: center;
  backdrop-filter: blur(10px);
}
</style>
