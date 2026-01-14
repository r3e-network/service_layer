<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold status-msg">{{ status.msg }}</text>
      </NeoCard>



      <!-- Lock Period Selector & Deposit -->
      <NeoCard class="deposit-card" variant="erobo-neo">
        <view class="lock-period-selector">
          <text class="selector-label">{{ t("lockPeriod") }}</text>
          <view class="period-options">
            <view
              v-for="period in lockPeriods"
              :key="period.days"
              :class="['period-option-glass', { active: selectedPeriod === period.days }]"
              @click="selectedPeriod = period.days"
            >
              <text class="period-days">{{ period.days }}d</text>
            </view>
          </view>
        </view>

        <view class="projected-returns-glass">
          <text class="returns-label">{{ t("unlockDate") }}</text>
          <view class="returns-display">
            <text class="returns-value">{{ unlockDateLabel }}</text>
          </view>
        </view>

        <NeoInput v-model="amount" type="number" :placeholder="t('amountPlaceholder')" suffix="NEO" />
        <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="createCapsule">
          {{ isLoading ? t("processing") : t("deposit") }}
        </NeoButton>
        <text class="note">{{ t("minLock").replace("{days}", String(MIN_LOCK_DAYS)) }}</text>
      </NeoCard>

      <!-- Your Summary -->
      <NeoCard variant="erobo-neo" class="position-card">
        <view class="position-stats">
          <view class="position-row primary">
            <text class="label">{{ t("deposited") }}</text>
            <text class="value">{{ fmt(position.deposited, 0) }} NEO</text>
          </view>
          <view class="position-row earned">
            <text class="label">{{ t("earned") }}</text>
            <text class="value growth">+{{ fmt(position.earned, 4) }} GAS</text>
          </view>
          <view class="position-row projection">
            <text class="label">{{ t("capsulesCount") }}</text>
            <text class="value">{{ position.capsules }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <!-- Capsule Visualization -->
      <NeoCard variant="erobo" class="vault-card">
        <view class="capsule-container-glass">
          <view class="capsule-visual">
            <view class="capsule-body-glass">
              <view class="capsule-fill-glass" :style="{ height: fillPercentage + '%' }">
                <view class="capsule-shimmer"></view>
              </view>
              <view class="capsule-label">
                <text class="capsule-apy">{{ fmt(vault.totalLocked, 0) }}</text>
                <text class="capsule-apy-label">{{ t("totalLocked") }}</text>
              </view>
            </view>
          </view>
          <view class="vault-stats-grid">
            <view class="stat-item-glass">
              <text class="stat-label">{{ t("totalLocked") }}</text>
              <text class="stat-value tvl">{{ fmt(vault.totalLocked, 0) }}</text>
              <text class="stat-unit">NEO</text>
            </view>
            <view class="stat-item-glass">
              <text class="stat-label">{{ t("totalCapsules") }}</text>
              <text class="stat-value freq">{{ vault.totalCapsules }}</text>
            </view>
          </view>
        </view>
      </NeoCard>

      <!-- Active Capsules -->
      <NeoCard variant="erobo" class="capsules-card">
        <view v-for="(capsule, idx) in activeCapsules" :key="idx" class="capsule-item-glass">
          <view class="capsule-header">
            <view class="capsule-icon">💊</view>
            <view class="capsule-info">
              <text class="capsule-amount">{{ fmt(capsule.amount, 0) }} NEO</text>
              <text class="capsule-period">{{ capsule.unlockDate }}</text>
            </view>
            <view class="capsule-actions">
              <view class="capsule-status">
                <view class="status-badge" :class="capsule.status === 'Ready' ? 'ready' : 'locked'">
                  <text class="status-badge-text">{{ capsule.status === 'Ready' ? t("ready") : t("locked") }}</text>
                </view>
              </view>
              <NeoButton
                v-if="capsule.status === 'Ready'"
                size="sm"
                variant="primary"
                :loading="isLoading"
                @click="unlockCapsule(capsule.id)"
              >
                {{ t("unlock") }}
              </NeoButton>
            </view>
          </view>
          <view class="capsule-progress">
            <view class="progress-bar-glass">
              <view class="progress-fill-glass" :style="{ width: capsule.status === 'Ready' ? '100%' : '0%' }"></view>
            </view>
            <text class="progress-text">{{ capsule.status === 'Ready' ? t("ready") : t("locked") }}</text>
          </view>
          <view class="capsule-footer">
            <view class="countdown">
              <text class="countdown-label">{{ t("maturesIn") }}</text>
              <text class="countdown-value">{{ capsule.remaining }}</text>
            </view>
            <view class="rewards">
              <text class="rewards-label">{{ t("rewards") }}</text>
              <text class="rewards-value">+{{ fmt(capsule.compound, 4) }} GAS</text>
            </view>
          </view>
        </view>
        <text v-if="activeCapsules.length === 0" class="empty-text">{{ t("noCapsules") }}</text>
      </NeoCard>

      <!-- Statistics -->
      <NeoCard variant="erobo-neo">
        <view class="stats-grid-glass">
          <view class="stat-box-glass">
            <text class="stat-label">{{ t("totalCapsules") }}</text>
            <text class="stat-value">{{ stats.totalCapsules }}</text>
          </view>
          <view class="stat-box-glass">
            <text class="stat-label">{{ t("totalLocked") }}</text>
            <text class="stat-value">{{ fmt(stats.totalLocked, 0) }} NEO</text>
          </view>
          <view class="stat-box-glass">
            <text class="stat-label">{{ t("totalAccrued") }}</text>
            <text class="stat-value">{{ fmt(stats.totalAccrued, 4) }} GAS</text>
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
import { useWallet } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

const isLoading = ref(false);

const translations = {
  title: { en: "Compound Capsule", zh: "复利胶囊" },
  vaultStats: { en: "Vault Overview", zh: "金库概览" },
  totalLocked: { en: "Total Locked", zh: "总锁定量" },
  totalCapsules: { en: "Total Capsules", zh: "胶囊总数" },
  yourPosition: { en: "Your Summary", zh: "你的概览" },
  deposited: { en: "Locked (NEO)", zh: "已锁定 (NEO)" },
  earned: { en: "Accrued GAS", zh: "累计 GAS" },
  capsulesCount: { en: "Capsules", zh: "胶囊数量" },
  createCapsule: { en: "Create Capsule", zh: "创建胶囊" },
  lockPeriod: { en: "Lock Period", zh: "锁定期限" },
  unlockDate: { en: "Unlock Date", zh: "解锁日期" },
  amountPlaceholder: { en: "Amount (NEO)", zh: "金额 (NEO)" },
  processing: { en: "Creating...", zh: "创建中..." },
  deposit: { en: "Create Capsule", zh: "创建胶囊" },
  minLock: { en: "Minimum lock: {days} days", zh: "最短锁定：{days} 天" },
  enterValidAmount: { en: "Enter a whole-number NEO amount", zh: "请输入整数 NEO 金额" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  connectWallet: { en: "Please connect your wallet", zh: "请连接钱包" },
  capsuleCreated: { en: "Capsule created", zh: "胶囊已创建" },
  capsuleUnlocked: { en: "Capsule unlocked", zh: "胶囊已解锁" },
  unlockFailed: { en: "Unlock failed", zh: "解锁失败" },
  main: { en: "Overview", zh: "概览" },
  stats: { en: "My Capsules", zh: "我的胶囊" },
  activeCapsules: { en: "Your Capsules", zh: "你的胶囊" },
  maturesIn: { en: "Time remaining", zh: "剩余时间" },
  rewards: { en: "Accrued GAS", zh: "累计 GAS" },
  ready: { en: "Ready", zh: "可解锁" },
  locked: { en: "Locked", zh: "已锁定" },
  unlock: { en: "Unlock", zh: "解锁" },
  noCapsules: { en: "No capsules yet", zh: "暂无胶囊" },
  statistics: { en: "Totals", zh: "合计" },
  totalAccrued: { en: "Total Accrued", zh: "累计收益" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Time-locked NEO capsules with auto-compounding",
    zh: "自动复利的 NEO 时间锁胶囊",
  },
  docDescription: {
    en: "Compound Capsule locks NEO in a time capsule until maturity. When it unlocks, you receive your principal back and any accrued GAS.",
    zh: "Compound Capsule 将 NEO 锁定至到期。解锁时返还本金及累计 GAS。",
  },
  step1: {
    en: "Connect your Neo wallet",
    zh: "连接您的 Neo 钱包",
  },
  step2: {
    en: "Choose a lock period and NEO amount",
    zh: "选择锁定期限和 NEO 金额",
  },
  step3: {
    en: "Create the capsule on-chain",
    zh: "在链上创建胶囊",
  },
  step4: {
    en: "Unlock when the capsule matures",
    zh: "到期后解锁胶囊",
  },
  feature1Name: { en: "Time Lock", zh: "时间锁" },
  feature1Desc: {
    en: "NEO stays locked until the unlock date.",
    zh: "NEO 将锁定至解锁日期。",
  },
  feature2Name: { en: "Auto-Compounding", zh: "自动复利" },
  feature2Desc: {
    en: "Accrued GAS is released on unlock.",
    zh: "解锁时释放累计 GAS。",
  },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};
const t = createT(translations);

const navTabs = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

type StatusType = "success" | "error";
type Status = { msg: string; type: StatusType };
type Vault = { totalLocked: number; totalCapsules: number };
type Position = { deposited: number; earned: number; capsules: number };
type Capsule = {
  id: string;
  amount: number;
  unlockTime: number;
  unlockDate: string;
  remaining: string;
  compound: number;
  status: "Ready" | "Locked";
};

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const { address, connect, chainType, switchChain, getContractAddress, invokeContract } = useWallet() as any;
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("contractUnavailable"));
  return contractAddress.value;
};

const MIN_LOCK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const vault = ref<Vault>({ totalLocked: 0, totalCapsules: 0 });
const position = ref<Position>({ deposited: 0, earned: 0, capsules: 0 });
const stats = ref({ totalCapsules: 0, totalLocked: 0, totalAccrued: 0 });
const activeCapsules = ref<Capsule[]>([]);
const amount = ref<string>("");
const status = ref<Status | null>(null);
const selectedPeriod = ref<number>(30);

const lockPeriods = [{ days: 7 }, { days: 30 }, { days: 90 }, { days: 180 }];

const fillPercentage = computed(() => (vault.value.totalLocked > 0 ? 100 : 0));

const unlockDateLabel = computed(() => {
  const unlockTime = Date.now() + selectedPeriod.value * DAY_MS;
  return new Date(unlockTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});

const fmt = (n: number, d = 2) => formatNumber(n, d);
const formatCountdown = (ms: number) => {
  if (ms <= 0) return t("ready");
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
const formatUnlockDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Fetch capsules from smart contract
const fetchData = async () => {
  try {
    const contract = await ensureContractAddress();
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      console.warn("[CompoundCapsule] SDK not available");
      return;
    }

    const totalResult = (await sdk.invoke("invokeRead", {
      contract,
      method: "TotalCapsules",
      args: [],
    })) as any;

    const totalCapsules = parseInt(totalResult?.stack?.[0]?.value || "0");
    const userCapsules: Capsule[] = [];
    let totalLocked = 0;
    let userLocked = 0;
    let userAccrued = 0;
    const now = Date.now();
    const userAddress = address.value;

    for (let i = 1; i <= totalCapsules; i++) {
      const capsuleResult = (await sdk.invoke("invokeRead", {
        contract,
        method: "GetCapsule",
        args: [{ type: "Integer", value: i.toString() }],
      })) as any;

      if (capsuleResult?.stack?.[0]) {
        const data = capsuleResult.stack[0].value;
        const owner = data?.owner;
        const principal = parseInt(data?.principal || "0");
        const unlockTime = parseInt(data?.unlockTime || "0");
        const compoundRaw = parseInt(data?.compound || "0");

        totalLocked += principal;

        if (userAddress && owner === userAddress) {
          const isReady = unlockTime <= now;
          const compound = compoundRaw / 1e8;
          userCapsules.push({
            id: i.toString(),
            amount: principal,
            unlockTime,
            unlockDate: formatUnlockDate(unlockTime),
            remaining: isReady ? t("ready") : formatCountdown(unlockTime - now),
            compound,
            status: isReady ? "Ready" : "Locked",
          });

          userLocked += principal;
          userAccrued += compound;
        }
      }
    }

    vault.value = { totalLocked, totalCapsules };
    activeCapsules.value = userCapsules;
    position.value = { deposited: userLocked, earned: userAccrued, capsules: userCapsules.length };
    stats.value = { totalCapsules: userCapsules.length, totalLocked: userLocked, totalAccrued: userAccrued };
  } catch (e) {
    console.warn("[CompoundCapsule] Failed to fetch data:", e);
  }
};

onMounted(() => {
  connect().finally(() => fetchData());
});

const createCapsule = async (): Promise<void> => {
  if (isLoading.value) return;
  const amt = Number(amount.value);
  if (!Number.isFinite(amt) || amt <= 0 || !Number.isInteger(amt)) {
    status.value = { msg: t("enterValidAmount"), type: "error" };
    return;
  }

  if (selectedPeriod.value < MIN_LOCK_DAYS) {
    status.value = { msg: t("minLock").replace("{days}", String(MIN_LOCK_DAYS)), type: "error" };
    return;
  }

  isLoading.value = true;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }

    const contract = await ensureContractAddress();
    const unlockTime = Date.now() + selectedPeriod.value * DAY_MS;

    await invokeContract({
      scriptHash: contract,
      operation: "CreateCapsule",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: String(amt) },
        { type: "Integer", value: String(unlockTime) },
      ],
    });

    status.value = { msg: t("capsuleCreated"), type: "success" };
    amount.value = "";
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("contractUnavailable"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const unlockCapsule = async (capsuleId: string) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }

    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "UnlockCapsule",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: capsuleId },
      ],
    });

    status.value = { msg: t("capsuleUnlocked"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("unlockFailed"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-msg { font-size: 14px; color: white; letter-spacing: 0.05em; }

.capsule-container-glass { display: flex; align-items: center; gap: 24px; }
.capsule-body-glass {
  width: 60px; height: 100px; background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 30px; position: relative; overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 229, 153, 0.2);
}
.capsule-fill-glass {
  position: absolute; bottom: 0; left: 0; width: 100%;
  background: linear-gradient(to top, #00e599, rgba(0, 229, 153, 0.3));
  border-top: 1px solid rgba(255, 255, 255, 0.5); transition: height 0.5s ease;
}
.capsule-label {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;
}
.capsule-apy { font-weight: 800; font-size: 14px; color: white; text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.capsule-apy-label { font-size: 8px; font-weight: 700; color: white; text-transform: uppercase; }

.vault-stats-grid { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.stat-item-glass {
  padding: 12px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
}
.stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: rgba(255, 255, 255, 0.5); letter-spacing: 0.1em; }
.stat-value { font-weight: 800; font-family: $font-mono; font-size: 16px; color: white; }
.stat-unit { font-size: 10px; color: rgba(255, 255, 255, 0.5); margin-left: 4px; }

.position-row {
  display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.position-row .label { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.position-row .value { font-size: 13px; font-weight: 700; color: white; font-family: $font-mono; }
.position-row.earned .value { color: #00e599; }

.period-options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
.period-option-glass {
  padding: 12px 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.1); }
  &.active {
    background: rgba(0, 229, 153, 0.1); border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.2);
  }
}
.period-days { font-weight: 700; font-size: 13px; color: white; display: block; }

.projected-returns-glass {
  background: rgba(0, 0, 0, 0.2); padding: 12px; border-radius: 12px; margin-bottom: 16px; text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.returns-label { font-size: 10px; color: rgba(255, 255, 255, 0.5); display: block; margin-bottom: 4px; }
.returns-value { font-size: 20px; font-weight: 800; color: white; font-family: $font-mono; }
.note { font-size: 10px; color: rgba(255, 255, 255, 0.4); text-align: center; display: block; margin-top: 12px; }

.capsule-item-glass {
  padding: 16px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 16px; border-radius: 16px;
}
.capsule-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.capsule-icon { font-size: 24px; }
.capsule-info { flex: 1; }
.capsule-amount { font-size: 16px; font-weight: 700; color: white; display: block; }
.capsule-period { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.capsule-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.capsule-status { display: flex; }

.status-badge {
  padding: 4px 8px; border-radius: 99px; border: 1px solid transparent;
  &.ready { background: rgba(0, 229, 153, 0.1); border-color: rgba(0, 229, 153, 0.3); }
  &.locked { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.1); }
}
.status-badge-text {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  .ready & { color: #00E599; }
  .locked & { color: rgba(255, 255, 255, 0.5); }
}

.progress-bar-glass {
  height: 6px; background: rgba(255, 255, 255, 0.1); margin: 8px 0; border-radius: 99px; overflow: hidden;
}
.progress-fill-glass { height: 100%; background: #00e599; border-radius: 99px; }
.progress-text {
  font-size: 10px; color: rgba(255, 255, 255, 0.5); font-weight: 600; text-align: right; display: block;
}

.capsule-footer {
  display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.countdown-label, .rewards-label { font-size: 10px; color: rgba(255, 255, 255, 0.5); display: block; }
.countdown-value, .rewards-value { font-size: 12px; font-weight: 700; color: white; font-family: $font-mono; }
.rewards-value { color: #00e599; }

.stats-grid-glass { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.stat-box-glass {
  padding: 12px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px;
}

.empty-text {
  font-size: 12px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  text-align: center;
  display: block;
  padding: 20px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
