<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Rent Tab -->
    <view v-if="activeTab === 'rent'" class="tab-content scrollable">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <NeoCard variant="accent">
        <view class="stats-grid">
          <view class="stat-box">
            <text class="stat-value">{{ formatNum(votingPower) }}</text>
            <text class="stat-label">Your VP</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ formatNum(earned) }}</text>
            <text class="stat-label">Earned</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ activeRentals }}</text>
            <text class="stat-label">Rentals</text>
          </view>
        </view>
      </NeoCard>

      <NeoCard title="Rent Out Your Votes">
        <view class="form-group">
          <NeoInput v-model="rentAmount" type="number" placeholder="Voting power to rent" label="VP Amount" />
          <NeoInput v-model="rentPrice" type="number" placeholder="Price per vote" suffix="GAS" label="Price" />
          <view class="duration-row">
            <view
              v-for="d in durations"
              :key="d.hours"
              :class="['duration-btn', rentDuration === d.hours && 'active']"
              @click="rentDuration = d.hours"
            >
              <text>{{ d.label }}</text>
            </view>
          </view>
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="listVotes">
            {{ isLoading ? "Listing..." : "List for Rent" }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Market Tab -->
    <view v-if="activeTab === 'market'" class="tab-content scrollable">
      <NeoCard title="Delegate Marketplace">
        <view class="delegates-list">
          <text v-if="delegates.length === 0" class="empty">No delegates available</text>
          <view v-for="(d, i) in delegates" :key="i" :class="['delegate-card', d.tier]">
            <view class="delegate-header">
              <view class="delegate-avatar" :class="d.tier">
                <text class="avatar-text">{{ d.name.substring(0, 2).toUpperCase() }}</text>
              </view>
              <view class="delegate-info">
                <text class="delegate-name">{{ d.name }}</text>
                <text class="delegate-address">{{ d.address }}</text>
              </view>
              <view v-if="d.tier === 'elite'" class="elite-badge">
                <text class="badge-text">ELITE</text>
              </view>
            </view>

            <view class="delegate-stats">
              <view class="stat-item">
                <text class="stat-label">Reputation</text>
                <text class="stat-value reputation">{{ d.reputation }}%</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">Success Rate</text>
                <text class="stat-value success">{{ d.successRate }}%</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">Commission</text>
                <text class="stat-value commission">{{ d.commission }}%</text>
              </view>
            </view>

            <view class="delegate-metrics">
              <view class="metric">
                <text class="metric-label">Total Delegated</text>
                <text class="metric-value">{{ formatNum(d.totalDelegated) }} VP</text>
              </view>
              <view class="metric">
                <text class="metric-label">Votes Cast</text>
                <text class="metric-value">{{ d.votesCast }}</text>
              </view>
            </view>

            <view class="delegate-actions">
              <NeoInput v-model="d.delegateAmount" type="number" placeholder="Amount to delegate" size="sm" />
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
import { formatNumber } from "@/shared/utils/format";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";

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
  error: { en: "Error", zh: "错误" },

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
  { id: "rent", icon: "wallet", label: t("rent") },
  { id: "market", icon: "cart", label: t("market") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("rent");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
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
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  margin-bottom: $space-5;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
  }
  &.loading {
    background: var(--brutal-yellow);
    color: $neo-black;
    border-color: $neo-black;
  }
}

// Form layout
.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// Stats grid
.stats-grid {
  display: flex;
  gap: $space-3;
}

.stat-box {
  flex: 1;
  text-align: center;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--neo-green);
  box-shadow: 3px 3px 0 var(--neo-green);
  padding: $space-4;
  transition: transform $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--neo-green);
  }
}

.stat-value {
  color: var(--neo-green);
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  display: block;
  line-height: $line-height-tight;
}

.stat-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: $space-1;
}

// Duration selector
.duration-row {
  display: flex;
  gap: $space-2;
}

.duration-btn {
  flex: 1;
  padding: $space-3;
  text-align: center;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &.active {
    background: var(--neo-green);
    color: $neo-black;
    border-color: $neo-black;
    box-shadow: 3px 3px 0 $neo-black;
  }
}

// Delegates list
.delegates-list {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.empty {
  color: var(--text-muted);
  text-align: center;
  padding: $space-8;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 1px;
}

// Delegate card
.delegate-card {
  padding: $space-5;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--neo-purple);
  box-shadow: 4px 4px 0 var(--neo-purple);
  transition: all $transition-fast;

  &.elite {
    border-color: var(--brutal-yellow);
    box-shadow: 4px 4px 0 var(--brutal-yellow);
  }

  &:active {
    transform: translate(3px, 3px);
    box-shadow: 1px 1px 0 var(--neo-purple);

    &.elite {
      box-shadow: 1px 1px 0 var(--brutal-yellow);
    }
  }
}

// Delegate header
.delegate-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;
  padding-bottom: $space-4;
  border-bottom: $border-width-sm solid var(--border-color);
  position: relative;
}

.delegate-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--neo-purple);
  border: $border-width-md solid $neo-black;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.elite {
    background: var(--brutal-yellow);
    box-shadow: 0 0 12px var(--brutal-yellow);
  }
}

.avatar-text {
  color: $neo-black;
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
}

.delegate-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.delegate-name {
  color: var(--text-primary);
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delegate-address {
  color: var(--text-muted);
  font-family: $font-mono;
  font-size: $font-size-xs;
}

.elite-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--brutal-yellow);
  color: $neo-black;
  padding: $space-1 $space-3;
  border: $border-width-sm solid $neo-black;
  box-shadow: 2px 2px 0 $neo-black;
}

.badge-text {
  font-weight: $font-weight-black;
  font-size: $font-size-xs;
  letter-spacing: 1px;
}

// Delegate stats
.delegate-stats {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.stat-item .stat-label {
  display: block;
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: $space-1;
}

.stat-item .stat-value {
  display: block;
  font-weight: $font-weight-black;
  font-size: $font-size-lg;
  font-family: $font-mono;

  &.reputation {
    color: var(--neo-purple);
  }

  &.success {
    color: var(--neo-green);
  }

  &.commission {
    color: var(--brutal-yellow);
  }
}

// Delegate metrics
.delegate-metrics {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.metric-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  color: var(--text-primary);
  font-weight: $font-weight-black;
  font-size: $font-size-md;
  font-family: $font-mono;
}

// Delegate actions
.delegate-actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: $border-width-sm solid var(--border-color);
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
</style>
