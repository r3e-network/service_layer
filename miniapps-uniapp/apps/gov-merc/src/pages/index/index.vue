<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Rent Tab -->
    <view v-if="activeTab === 'rent'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('yourDelegations')" variant="accent" class="mb-6">
        <NeoStats :stats="rentStats" />
      </NeoCard>

      <NeoCard title="Rent Out Your Votes" class="mb-6">
        <view class="form-group-neo">
          <NeoInput
            v-model="rentAmount"
            type="number"
            placeholder="Voting power to rent"
            label="VP Amount"
            class="mb-2"
          />
          <NeoInput
            v-model="rentPrice"
            type="number"
            placeholder="Price per vote"
            suffix="GAS"
            label="Price"
            class="mb-4"
          />

          <view class="duration-row-neo flex gap-2 mb-6">
            <NeoButton
              v-for="d in durations"
              :key="d.hours"
              :variant="rentDuration === d.hours ? 'success' : 'secondary'"
              size="sm"
              class="flex-1"
              @click="rentDuration = d.hours"
            >
              {{ d.label }}
            </NeoButton>
          </view>

          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="listVotes">
            {{ isLoading ? "Listing..." : "List for Rent" }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Market Tab -->
    <view v-if="activeTab === 'market'" class="tab-content">
      <text class="section-title-neo mb-4 font-bold uppercase">{{ t("availableMercs") }}</text>
      <view class="delegates-list">
        <text v-if="delegates.length === 0" class="empty-neo text-center p-8 opacity-60 uppercase font-bold">{{
          t("noDelegates")
        }}</text>
        <NeoCard
          v-for="(d, i) in delegates"
          :key="i"
          :variant="d.tier === 'elite' ? 'warning' : 'default'"
          class="mb-6"
        >
          <template #header-extra v-if="d.tier === 'elite'">
            <text
              class="elite-badge-neo bg-black text-warning text-xs font-black px-2 py-1 border border-black shadow-neo"
              >ELITE</text
            >
          </template>

          <view class="delegate-header-neo flex items-center gap-3 mb-4 pb-4 border-b border-dashed border-black/10">
            <view
              class="delegate-avatar-neo w-12 h-12 rounded-full border-2 border-neo-black flex items-center justify-center font-black text-xl"
              :class="d.tier"
            >
              {{ d.name.substring(0, 2).toUpperCase() }}
            </view>
            <view class="delegate-info-neo">
              <text class="delegate-name-neo font-black text-lg uppercase block">{{ d.name }}</text>
              <text class="delegate-address-neo font-mono text-xs opacity-60 block">{{ d.address }}</text>
            </view>
          </view>

          <view class="delegate-stats-grid mb-4">
            <NeoStats
              :stats="[
                { label: 'Rep', value: d.reputation + '%', variant: 'accent' },
                { label: 'Success', value: d.successRate + '%', variant: 'success' },
                { label: 'Comm', value: d.commission + '%', variant: 'warning' },
              ]"
            />
          </view>

          <view class="delegate-metrics-neo bg-black/5 p-3 rounded mb-4 flex gap-4">
            <view class="metric-neo flex-1">
              <text class="metric-label-neo text-[10px] uppercase font-bold opacity-60 block">Total Delegated</text>
              <text class="metric-value-neo font-mono font-bold text-sm">{{ formatNum(d.totalDelegated) }} VP</text>
            </view>
            <view class="metric-neo flex-1 text-right">
              <text class="metric-label-neo text-[10px] uppercase font-bold opacity-60 block">Votes Cast</text>
              <text class="metric-value-neo font-mono font-bold text-sm">{{ d.votesCast }}</text>
            </view>
          </view>

          <view class="delegate-actions-neo pt-4 border-t border-dashed border-black/10">
            <NeoInput v-model="d.delegateAmount" type="number" placeholder="Amount" size="sm" class="mb-2" />
            <NeoButton
              variant="primary"
              size="md"
              block
              :loading="isLoading"
              @click="delegateToMerc(d.id, d.delegateAmount)"
            >
              Delegate Now
            </NeoButton>
          </view>
        </NeoCard>
      </view>
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
import { formatNumber } from "@/shared/utils/format";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Gov Merc", zh: "治理雇佣兵" },
  subtitle: { en: "Delegate voting power", zh: "委托投票权" },
  rent: { en: "Rent", zh: "出租" },
  market: { en: "Market", zh: "市场" },
  availableMercs: { en: "Available Mercs", zh: "可用雇佣兵" },
  yourDelegations: { en: "Your Delegations", zh: "您的委托" },
  delegateVotes: { en: "Delegate Votes", zh: "委托投票" },
  votesToDelegate: { en: "Votes to delegate", zh: "委托票数" },
  mercAddress: { en: "Merc address", zh: "雇佣兵地址" },
  delegating: { en: "Delegating...", zh: "委托中..." },
  delegate: { en: "Delegate", zh: "委托" },
  revoke: { en: "Revoke", zh: "撤销" },
  minDelegate: { en: "Min delegate: 1 vote", zh: "最小委托：1票" },
  delegationSuccess: { en: "Delegation successful!", zh: "委托成功！" },
  noDelegates: { en: "No delegates available", zh: "没有可用的雇佣兵" },
  error: { en: "Error", zh: "错误" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Governance mercenary - rent out your voting power",
    zh: "治理雇佣兵 - 出租您的投票权",
  },
  docDescription: {
    en: "Gov Merc is a marketplace for governance voting power. List your idle votes for rent, or hire voting power for proposals you care about.",
    zh: "Gov Merc 是治理投票权的市场。出租您闲置的投票权，或为您关心的提案雇用投票权。",
  },
  step1: {
    en: "Connect your Neo wallet",
    zh: "连接您的 Neo 钱包",
  },
  step2: {
    en: "List your voting power for rent or browse available votes",
    zh: "出租您的投票权或浏览可用投票",
  },
  step3: {
    en: "Set your price per vote or accept delegation requests",
    zh: "设置每票价格或接受委托请求",
  },
  step4: {
    en: "Earn GAS from your idle voting power",
    zh: "从闲置投票权中赚取 GAS",
  },
  feature1Name: { en: "Vote Marketplace", zh: "投票市场" },
  feature1Desc: {
    en: "Transparent pricing for governance voting power.",
    zh: "治理投票权的透明定价。",
  },
  feature2Name: { en: "Reputation System", zh: "声誉系统" },
  feature2Desc: {
    en: "Build reputation for better rates and more requests.",
    zh: "建立声誉以获得更好的费率和更多请求。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "rent", icon: "wallet", label: t("rent") },
  { id: "market", icon: "cart", label: t("market") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("rent");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-gov-merc";
const { address, connect } = useWallet();

interface Delegate {
  id: number;
  name: string;
  address: string;
  tier: "elite" | "standard";
  reputation: number;
  successRate: number;
  commission: number;
  totalDelegated: number;
  votesCast: number;
  delegateAmount: string;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const rentAmount = ref("100");
const rentPrice = ref("0.5");
const rentDuration = ref(24);
const votingPower = ref(0);
const earned = ref(0);
const activeRentals = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const dataLoading = ref(true);

const durations = [
  { hours: 6, label: "6h" },
  { hours: 24, label: "24h" },
  { hours: 72, label: "3d" },
  { hours: 168, label: "7d" },
];

const delegates = ref<Delegate[]>([]);

const rentStats = computed<StatItem[]>(() => [
  { label: "Your VP", value: formatNum(votingPower.value), variant: "default" },
  { label: "Earned", value: formatNum(earned.value), variant: "success" },
  { label: "Rentals", value: activeRentals.value, variant: "accent" },
]);

const formatNum = (n: number) => formatNumber(n, 1);

const listVotes = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(rentAmount.value);
  if (amount < 10) {
    status.value = { msg: "Min: 10 VP", type: "error" };
    return;
  }
  try {
    status.value = { msg: "Listing votes...", type: "loading" };
    await payGAS("0.1", `list:${rentAmount.value}:${rentPrice.value}:${rentDuration.value}`);
    activeRentals.value++;
    status.value = { msg: "Listed successfully!", type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

const delegateToMerc = async (id: number, amount: string) => {
  if (isLoading.value) return;
  const delegateAmount = parseFloat(amount);
  if (!delegateAmount || delegateAmount < 1) {
    status.value = { msg: "Min: 1 VP", type: "error" };
    return;
  }
  try {
    status.value = { msg: "Delegating votes...", type: "loading" };
    const delegate = delegates.value.find((d) => d.id === id);
    if (delegate) {
      const fee = (delegateAmount * delegate.commission) / 100;
      await payGAS(String(fee), `delegate:${id}:${delegateAmount}`);
      votingPower.value -= delegateAmount;
      status.value = { msg: `Delegated ${delegateAmount} VP to ${delegate.name}!`, type: "success" };
      delegate.delegateAmount = "";
    }
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

// Fetch data from contract
const fetchData = async () => {
  try {
    dataLoading.value = true;
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("govMerc.getData", { appId: APP_ID })) as {
      votingPower: number;
      earned: number;
      activeRentals: number;
      delegates: Delegate[];
    } | null;

    if (data) {
      votingPower.value = data.votingPower;
      earned.value = data.earned;
      activeRentals.value = data.activeRentals;
      delegates.value = data.delegates || [];
    }
  } catch (e) {
    console.warn("[GovMerc] Failed to fetch data:", e);
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());
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

.form-group-neo {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.duration-row-neo {
  display: flex;
  gap: $space-3;
}

.section-title-neo {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: 8px;
  background: black;
  color: white;
  padding: 2px 10px;
  display: inline-block;
}

.delegate-avatar-neo {
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
  &.elite {
    background: var(--brutal-yellow);
  }
}

.delegate-name-neo {
  font-weight: $font-weight-black;
  font-size: 20px;
  border-bottom: 2px solid black;
}
.delegate-address-neo {
  font-family: $font-mono;
  font-size: 10px;
  opacity: 1;
  font-weight: $font-weight-black;
  margin-top: 4px;
}

.elite-badge-neo {
  background: black;
  color: var(--brutal-yellow);
  font-size: 10px;
  font-weight: $font-weight-black;
  padding: 4px 10px;
  border: 2px solid black;
  box-shadow: 4px 4px 0 var(--brutal-yellow);
}

.delegate-metrics-neo {
  background: var(--bg-elevated, #eee);
  padding: $space-4;
  border: 2px solid var(--border-color, black);
  display: flex;
  gap: $space-4;
  box-shadow: inset 4px 4px 0 var(--shadow-color, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, black);
}
.metric-label-neo {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: var(--text-secondary, #666);
}
.metric-value-neo {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 14px;
  color: var(--text-primary, black);
}

.empty-neo {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: $font-weight-black;
  background: var(--bg-elevated, #eee);
  border: 2px dashed var(--border-color, black);
  color: var(--text-primary, black);
}
.status-text {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: $font-weight-black;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
