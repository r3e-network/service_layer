<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Vote Tab -->
    <view v-if="activeTab === 'vote'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('epochOverview')" variant="default">
        <NeoStats :stats="epochStats" />
      </NeoCard>

      <NeoCard :title="t('registerVote')" variant="accent">
        <view class="vote-form">
          <NeoInput
            v-model="voteWeight"
            type="number"
            :label="t('voteWeight')"
            :placeholder="t('voteWeightPlaceholder')"
            suffix="NEO"
            :hint="t('minVoteWeight')"
          />
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="registerVote">
            {{ isLoading ? t("processing") : t("registerVote") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard :title="t('rewards')" variant="default">
        <view class="rewards-row">
          <view class="reward-info">
            <text class="reward-label">{{ t("pendingRewards") }}</text>
            <text class="reward-value">{{ formattedPendingRewards }}</text>
          </view>
          <NeoButton
            variant="primary"
            size="md"
            :disabled="pendingRewardsValue <= 0 || hasClaimed || isLoading"
            :loading="isLoading"
            @click="claimRewards"
          >
            {{ t("claimRewards") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Info Tab -->
    <view v-if="activeTab === 'info'" class="tab-content scrollable">
      <NeoCard :title="t('networkInfo')" variant="default">
        <NeoStats :stats="infoStats" />
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
import { ref, onMounted, computed } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { formatNumber, formatAddress } from "@/shared/utils/format";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoStats, NeoDoc, NeoInput, type StatItem } from "@/shared/components";

const translations = {
  vote: { en: "Vote", zh: "投票" },
  info: { en: "Info", zh: "信息" },
  title: { en: "Candidate Vote", zh: "候选人投票" },
  subtitle: { en: "Neo Governance Voting", zh: "Neo 治理投票" },
  epochOverview: { en: "Epoch Overview", zh: "周期概览" },
  currentEpoch: { en: "Current Epoch", zh: "当前周期" },
  epochEndsIn: { en: "Ends In", zh: "剩余时间" },
  epochEnded: { en: "Ended", zh: "已结束" },
  epochTotalVotes: { en: "Total Votes", zh: "总票数" },
  currentStrategy: { en: "Strategy", zh: "策略" },
  strategySelf: { en: "Self", zh: "自持" },
  strategyNeoBurger: { en: "NeoBurger", zh: "NeoBurger" },
  registerVote: { en: "Register Vote", zh: "登记投票" },
  voteWeight: { en: "Vote Weight", zh: "投票权重" },
  voteWeightPlaceholder: { en: "1.0", zh: "1.0" },
  minVoteWeight: { en: "Minimum 1 NEO", zh: "最低 1 NEO" },
  rewards: { en: "Rewards", zh: "奖励" },
  pendingRewards: { en: "Pending Rewards", zh: "待领取奖励" },
  claimRewards: { en: "Claim Rewards", zh: "领取奖励" },
  processing: { en: "Processing...", zh: "处理中..." },
  voteRegistered: { en: "Vote registered", zh: "投票已登记" },
  voteFailed: { en: "Vote failed", zh: "投票失败" },
  claimFailed: { en: "Claim failed", zh: "领取失败" },
  rewardsClaimed: { en: "Rewards claimed", zh: "奖励已领取" },
  noRewards: { en: "No rewards to claim", zh: "暂无奖励可领取" },
  invalidWeight: { en: "Enter at least 1 NEO", zh: "请输入不少于 1 NEO" },
  connectWallet: { en: "Connect wallet first", zh: "请先连接钱包" },
  failedToLoad: { en: "Failed to load data", zh: "加载数据失败" },
  networkInfo: { en: "Network Info", zh: "网络信息" },
  wallet: { en: "Wallet", zh: "钱包" },
  contract: { en: "Contract", zh: "合约" },
  epochEndsAt: { en: "Epoch Ends", zh: "周期结束" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Earn GAS rewards by registering your NEO vote weight",
    zh: "通过登记 NEO 投票权重赚取 GAS 奖励",
  },
  docDescription: {
    en: "Register your vote weight to earn proportional GAS rewards each epoch.",
    zh: "登记投票权重并按周期领取比例 GAS 奖励。",
  },
  step1: { en: "Connect your wallet.", zh: "连接你的钱包。" },
  step2: { en: "Register your vote weight.", zh: "登记你的投票权重。" },
  step3: { en: "Claim rewards after each epoch.", zh: "每个周期结束后领取奖励。" },
  step4: { en: "Re-register each epoch to continue earning.", zh: "每个周期重新登记以继续赚取。" },
  feature1Name: { en: "On-Chain Accounting", zh: "链上记账" },
  feature1Desc: { en: "Vote weights and rewards are stored on-chain.", zh: "投票权重与奖励都在链上记录。" },
  feature2Name: { en: "Proportional Rewards", zh: "比例奖励" },
  feature2Desc: { en: "Rewards scale with your registered vote weight.", zh: "奖励随投票权重按比例发放。" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-candidate-vote";
const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();

const navTabs = [
  { id: "vote", icon: "checkbox", label: t("vote") },
  { id: "info", icon: "info", label: t("info") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("vote");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const contractHash = ref<string | null>(null);

const voteWeight = ref("");
const currentEpoch = ref(0);
const epochEndTime = ref(0);
const epochTotalVotes = ref(0);
const currentStrategy = ref("");
const pendingRewardsValue = ref(0);
const hasClaimed = ref(false);

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const toMillis = (value: number) => (value > 1_000_000_000_000 ? value : value * 1000);

const formatToken = (value: number, decimals = 4) => {
  if (!Number.isFinite(value)) return "0";
  const formatted = value.toFixed(decimals);
  return formatted.replace(/\.?0+$/, "");
};

const formatNeo = (value: number) => formatNumber(value / 1e8, 2);

const formatEpochEnd = (value: number) => {
  if (!value) return "--";
  const date = new Date(toMillis(value));
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const epochEndsIn = computed(() => {
  if (!epochEndTime.value) return "--";
  const diff = toMillis(epochEndTime.value) - Date.now();
  if (diff <= 0) return t("epochEnded");
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
});

const strategyLabel = computed(() => {
  if (currentStrategy.value === "self") return t("strategySelf");
  if (currentStrategy.value === "neoburger") return t("strategyNeoBurger");
  return currentStrategy.value || "--";
});

const formattedPendingRewards = computed(() => `${formatToken(pendingRewardsValue.value)} GAS`);

const epochStats = computed<StatItem[]>(() => [
  { label: t("currentEpoch"), value: currentEpoch.value || "--" },
  { label: t("epochEndsIn"), value: epochEndsIn.value, variant: "warning" },
  { label: t("epochTotalVotes"), value: formatNeo(epochTotalVotes.value), variant: "accent" },
  { label: t("currentStrategy"), value: strategyLabel.value },
]);

const infoStats = computed<StatItem[]>(() => [
  { label: t("wallet"), value: address.value ? formatAddress(address.value) : "--" },
  { label: t("contract"), value: contractHash.value ? formatAddress(contractHash.value) : "--" },
  { label: t("epochEndsAt"), value: formatEpochEnd(epochEndTime.value) },
  { label: t("currentStrategy"), value: strategyLabel.value },
]);

const readMethod = async (operation: string, args: any[] = []) => {
  const result = await invokeRead({ contractHash: (contractHash.value as string) || undefined, operation, args });
  return parseInvokeResult(result);
};

const loadEpochData = async () => {
  try {
    if (!contractHash.value) {
      contractHash.value = await getContractHash();
    }
    const epochValue = await readMethod("CurrentEpoch");
    const epochNumber = Number(epochValue || 0);
    currentEpoch.value = epochNumber;

    const [endValue, totalValue, strategyValue] = await Promise.all([
      readMethod("EpochEndTime"),
      readMethod("EpochTotalVotes", [{ type: "Integer", value: epochNumber }]),
      readMethod("CurrentStrategy"),
    ]);

    epochEndTime.value = Number(endValue || 0);
    epochTotalVotes.value = Number(totalValue || 0);
    currentStrategy.value = typeof strategyValue === "string" ? strategyValue : String(strategyValue || "");
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  }
};

const loadRewards = async () => {
  if (!address.value || currentEpoch.value <= 1) {
    pendingRewardsValue.value = 0;
    hasClaimed.value = false;
    return;
  }
  const epochId = currentEpoch.value - 1;
  try {
    const [pendingValue, claimedValue] = await Promise.all([
      readMethod("GetPendingRewards", [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: epochId },
      ]),
      readMethod("HasClaimed", [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: epochId },
      ]),
    ]);
    pendingRewardsValue.value = Number(pendingValue || 0) / 1e8;
    hasClaimed.value = Boolean(claimedValue);
  } catch {
    pendingRewardsValue.value = 0;
    hasClaimed.value = false;
  }
};

const registerVote = async () => {
  if (isLoading.value) return;
  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoad"), "error");
    return;
  }

  const weight = parseFloat(voteWeight.value);
  if (!Number.isFinite(weight) || weight < 1) {
    showStatus(t("invalidWeight"), "error");
    return;
  }

  const weightInt = Math.floor(weight * 1e8).toString();

  try {
    isLoading.value = true;
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "RegisterVote",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: weightInt },
      ],
    });
    showStatus(t("voteRegistered"), "success");
    voteWeight.value = "";
    await loadEpochData();
    await loadRewards();
  } catch (e: any) {
    showStatus(e.message || t("voteFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

const claimRewards = async () => {
  if (isLoading.value) return;
  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (pendingRewardsValue.value <= 0 || hasClaimed.value || currentEpoch.value <= 1) {
    showStatus(t("noRewards"), "error");
    return;
  }
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoad"), "error");
    return;
  }

  const epochId = currentEpoch.value - 1;
  try {
    isLoading.value = true;
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "ClaimRewards",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: epochId },
      ],
    });
    showStatus(t("rewardsClaimed"), "success");
    await loadRewards();
  } catch (e: any) {
    showStatus(e.message || t("claimFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await connect();
  await loadEpochData();
  await loadRewards();
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
}

.vote-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.rewards-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4;
  background: white;
  border: 2px solid black;
  box-shadow: 4px 4px 0 black;
}

.reward-info {
  display: flex;
  flex-direction: column;
}
.reward-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}
.reward-value {
  font-size: 24px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  color: var(--neo-green);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
