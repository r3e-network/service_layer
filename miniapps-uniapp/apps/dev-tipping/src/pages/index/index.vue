<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'developers' || activeTab === 'send' || activeTab === 'stats'" class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
              t("switchToNeo")
            }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'erobo-neo'" class="mb-4">
        <text class="text-center font-bold text-glass">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="activeTab === 'developers'" class="tab-content">
        <NeoCard variant="erobo">
          <view v-for="dev in developers" :key="dev.id" class="dev-card-glass" @click="selectDev(dev)">
            <view class="dev-card-header">
              <view class="dev-avatar-glass">
                <text class="avatar-emoji">👨‍💻</text>
                <view class="avatar-badge-glass">{{ dev.rank }}</view>
              </view>
              <view class="dev-info">
                <text class="dev-name-glass">{{ dev.name }}</text>
                <text class="dev-projects-glass">
                  <text class="project-icon">🧩</text>
                  {{ dev.role }}
                </text>
                <text class="dev-contributions-glass">{{ dev.tipCount }} {{ t("tipsCount") }}</text>
              </view>
            </view>
            <view class="dev-card-footer-glass">
              <view class="tip-stats">
                <text class="tip-label-glass">{{ t("totalTips") }}</text>
                <text class="tip-amount-glass">{{ formatNum(dev.totalTips) }} GAS</text>
              </view>
              <view class="tip-action">
                <text class="tip-icon text-glass">💚</text>
              </view>
            </view>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'send'" class="tab-content">
        <NeoCard variant="erobo-neo">
          <view class="form-group">
            <!-- Developer Selection -->
            <view class="input-section">
              <text class="input-label-glass">{{ t("selectDeveloper") }}</text>
              <view class="dev-selector">
                <view
                  v-for="dev in developers"
                  :key="dev.id"
                  :class="['dev-select-item-glass', { active: selectedDevId === dev.id }]"
                  @click="selectedDevId = dev.id"
                >
                  <text class="dev-select-name-glass">{{ dev.name }}</text>
                  <text class="dev-select-role-glass">{{ dev.role }}</text>
                </view>
              </view>
            </view>

            <!-- Tip Amount with Presets -->
            <view class="input-section">
              <text class="input-label-glass">{{ t("tipAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="preset in presetAmounts"
                  :key="preset"
                  :class="['preset-btn-glass', { active: tipAmount === preset.toString() }]"
                  @click="tipAmount = preset.toString()"
                >
                  <text class="preset-value-glass">{{ preset }}</text>
                  <text class="preset-unit-glass">GAS</text>
                </view>
              </view>
              <NeoInput v-model="tipAmount" type="number" :placeholder="t('customAmount')" suffix="GAS" />
            </view>

            <!-- Optional Message -->
            <view class="input-section">
              <text class="input-label-glass">{{ t("optionalMessage") }}</text>
              <NeoInput v-model="tipMessage" :placeholder="t('messagePlaceholder')" />
            </view>
            <view class="input-section">
              <text class="input-label-glass">{{ t("tipperName") }}</text>
              <NeoInput v-model="tipperName" :placeholder="t('tipperNamePlaceholder')" :disabled="anonymous" />
            </view>
            <view class="input-section">
              <text class="input-label-glass">{{ t("anonymousLabel") }}</text>
              <view class="toggle-row">
                <NeoButton size="sm" :variant="anonymous ? 'primary' : 'secondary'" @click="anonymous = true">
                  {{ t("anonymousOn") }}
                </NeoButton>
                <NeoButton size="sm" :variant="anonymous ? 'secondary' : 'primary'" @click="anonymous = false">
                  {{ t("anonymousOff") }}
                </NeoButton>
              </view>
            </view>

            <!-- Send Button -->
            <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="sendTip">
              <text v-if="!isLoading">💚 {{ t("sendTipBtn") }}</text>
              <text v-else>{{ t("sending") }}</text>
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'stats'" class="tab-content">
        <NeoCard variant="erobo">
          <view class="stats-grid-neo">
            <view class="stat-item-neo">
              <text class="stat-label-neo">{{ t("totalDonated") }}</text>
              <text class="stat-value-neo">{{ formatNum(totalDonated) }} GAS</text>
            </view>
          </view>
        </NeoCard>

        <!-- Recent Tips in Stats -->
        <NeoCard v-if="recentTips.length > 0" variant="erobo-neo">
          <view class="recent-tips-glass">
            <view v-for="tip in recentTips" :key="tip.id" class="recent-tip-item-glass">
              <text class="recent-tip-emoji">✨</text>
              <view class="recent-tip-info">
                <text class="recent-tip-to-glass">{{ tip.to }}</text>
                <text class="recent-tip-time-glass">{{ tip.time }}</text>
              </view>
              <text class="recent-tip-amount-glass">{{ tip.amount }} GAS</text>
            </view>
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
    <Fireworks :active="status?.type === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useEvents, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";
import Fireworks from "../../../../../shared/components/Fireworks.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";


const { t } = useI18n();

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-dev-tipping";
const MIN_TIP = 0.001;
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { list: listEvents } = useEvents();
const { payGAS } = usePayments(APP_ID);
const isLoading = ref(false);

const activeTab = ref<string>("send");
const navTabs = computed<NavTab[]>(() => [
  { id: "send", label: t("sendTip"), icon: "💰" },
  { id: "developers", label: t("developers"), icon: "👨‍💻" },
  { id: "stats", label: t("stats"), icon: "chart" },
  { id: "docs", icon: "book", label: t("docs") },
]);

const selectedDevId = ref<number | null>(null);
const tipAmount = ref("1");
const tipMessage = ref("");
const tipperName = ref("");
const anonymous = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const totalDonated = ref(0);

// Preset tip amounts
const presetAmounts = [1, 2, 5, 10];

interface Developer {
  id: number;
  name: string;
  role: string;
  wallet: string;
  totalTips: number;
  tipCount: number;
  balance: number;
  rank: string;
}

interface RecentTip {
  id: string;
  to: string;
  amount: string;
  time: string;
}

const developers = ref<Developer[]>([]);
const recentTips = ref<RecentTip[]>([]);

const formatNum = (n: number) => formatNumber(n, 2);
const toNumber = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};
const toGas = (value: any) => {
  const num = toNumber(value);
  return num / 1e8;
};
const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const contractAddress = ref<string | null>(null);
const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) throw new Error(t("contractUnavailable"));
  return contractAddress.value;
};

const loadDevelopers = async () => {
  try {
    const contract = await ensureContractAddress();
    const totalRes = await invokeRead({ contractAddress: contract, operation: "totalDevelopers", args: [] });
    const total = toNumber(parseInvokeResult(totalRes));
    if (!total) {
      developers.value = [];
      totalDonated.value = 0;
      return;
    }
    const ids = Array.from({ length: total }, (_, i) => i + 1);
    const devs = await Promise.all(
      ids.map(async (id) => {
        const detailsRes = await invokeRead({
          contractAddress: contract,
          operation: "getDeveloperDetails",
          args: [{ type: "Integer", value: id }],
        });
        const parsed = parseInvokeResult(detailsRes);
        const details =
          parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
        const name = String(details.name || "").trim();
        const role = String(details.role || "").trim();
        const wallet = String(details.wallet || "").trim();
        const totalReceived = toGas(details.totalReceived ?? 0);
        const tipCount = toNumber(details.tipCount);
        const balance = toGas(details.balance ?? 0);
        if (!wallet) return null;
        return {
          id,
          name: name || t("defaultDevName", { id }),
          role: role || t("defaultDevRole"),
          wallet,
          totalTips: totalReceived,
          tipCount,
          balance,
          rank: "",
        };
      }),
    );
    const donatedRes = await invokeRead({ contractAddress: contract, operation: "totalDonated", args: [] });
    totalDonated.value = toGas(parseInvokeResult(donatedRes));

    // Filter before sorting to avoid null errors
    const validDevs = devs.filter((d): d is Developer => d !== null);
    
    validDevs.sort((a, b) => b.totalTips - a.totalTips);
    validDevs.forEach((dev, idx) => {
      dev.rank = `#${idx + 1}`;
    });
    developers.value = validDevs;
  } catch {
  }
};

const loadRecentTips = async () => {
  const res = await listEvents({ app_id: APP_ID, event_name: "TipSent", limit: 20 });
  const devMap = new Map(developers.value.map((dev) => [dev.id, dev.name]));
  recentTips.value = res.events.map((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const devId = toNumber(values[1] ?? 0);
    const amount = toGas(values[2]);
    const to = devMap.get(devId) || t("defaultDevName", { id: devId });
    return {
      id: evt.id,
      to,
      amount: amount.toFixed(2),
      time: new Date(evt.created_at || Date.now()).toLocaleString(),
    };
  });
};

const refreshData = async () => {
  try {
    await loadDevelopers();
    await loadRecentTips();
  } catch {
  }
};

const selectDev = (dev: Developer) => {
  selectedDevId.value = dev.id;
  status.value = { msg: `${t("selected")} ${dev.name}`, type: "success" };
  activeTab.value = "send";
};

const sendTip = async () => {
  if (!selectedDevId.value || !tipAmount.value || isLoading.value) return;
  isLoading.value = true;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractAddress();
    const amount = Number.parseFloat(tipAmount.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(t("invalidAmount"));
    }
    if (amount < MIN_TIP) {
      throw new Error(t("minTip"));
    }
    const amountInt = toFixed8(tipAmount.value);

    const payment = await payGAS(String(amount), `tip:${selectedDevId.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    await invokeContract({
      contractAddress: contract,
      operation: "tip",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: String(selectedDevId.value) },
        { type: "Integer", value: amountInt },
        { type: "String", value: tipMessage.value || "" },
        { type: "String", value: tipperName.value || "" },
        { type: "Boolean", value: anonymous.value },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    status.value = { msg: t("tipSent"), type: "success" };
    tipAmount.value = "1";
    tipMessage.value = "";
    tipperName.value = "";
    anonymous.value = false;
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$cafe-bg: #1c1917;
$cafe-neon: #f97316; /* Orange-500 */
$cafe-glass: rgba(41, 37, 36, 0.8);
$cafe-text: #fed7aa; /* Orange-100 */
$cafe-border: #431407;

:global(page) {
  background: $cafe-bg;
}

.app-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  gap: 16px;
  background-color: $cafe-bg;
  /* Cyber Cafe Pattern */
  background-image: 
    linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDIwaDQwTTIwIDB2NDAiIHN0cm9rZT0iIzQzMTQwNyIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjUiLz4KPC9zdmc+');
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Cyber Cafe Component Overrides */
:deep(.neo-card) {
  background: linear-gradient(135deg, $cafe-glass 0%, rgba(20, 15, 10, 0.9) 100%) !important;
  border: 1px solid $cafe-neon !important;
  border-radius: 16px !important;
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.15) !important;
  color: $cafe-text !important;
  backdrop-filter: blur(10px);
  
  &.variant-danger {
    border-color: #ef4444 !important;
    background: rgba(69, 10, 10, 0.8) !important;
  }
}

:deep(.neo-button) {
  border-radius: 8px !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.variant-primary {
    background: $cafe-neon !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.4) !important;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 0 5px rgba(249, 115, 22, 0.2) !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $cafe-neon !important;
    color: $cafe-neon !important;
  }
}

:deep(input), :deep(.neo-input) {
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(249, 115, 22, 0.3) !important;
  color: $cafe-text !important;
  border-radius: 8px !important;
  font-family: 'JetBrains Mono', monospace !important;
  
  &:focus {
    border-color: $cafe-neon !important;
    box-shadow: 0 0 0 1px $cafe-neon !important;
  }
}

/* Custom Dev Card Styles */
.dev-card-glass {
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(249, 115, 22, 0.2);
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    background: rgba(249, 115, 22, 0.1);
  }
}

.dev-card-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.dev-avatar-glass {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #292524, #000);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $cafe-neon;
  font-size: 28px;
  position: relative;
}

.avatar-badge-glass {
  position: absolute;
  bottom: -6px;
  right: -6px;
  background: $cafe-neon;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.dev-info {
  flex: 1;
}

.dev-name-glass {
  font-size: 16px;
  font-weight: 800;
  color: white;
  font-family: 'JetBrains Mono', monospace;
  display: block;
}
.dev-projects-glass {
  font-size: 10px;
  color: $cafe-neon;
  border: 1px solid rgba(249, 115, 22, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
  font-weight: bold;
  text-transform: uppercase;
}
.dev-contributions-glass {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-top: 4px;
}

.dev-card-footer-glass {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(249, 115, 22, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.tip-label-glass {
  font-size: 10px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.tip-amount-glass {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  color: $cafe-neon;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
}

.dev-select-item-glass {
  padding: 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  &.active {
    border-color: $cafe-neon;
    background: rgba(249, 115, 22, 0.1);
  }
}
.dev-select-name-glass {
  color: white;
  font-weight: bold;
  font-family: 'JetBrains Mono', monospace;
}
.dev-select-role-glass {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}

.preset-amounts {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 12px;
}

.preset-btn-glass {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  
  &.active {
    background: $cafe-neon;
    border-color: $cafe-neon;
    color: #fff;
    box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
    .preset-value-glass, .preset-unit-glass { color: #fff; }
  }
}

.preset-value-glass {
  font-size: 16px;
  font-weight: bold;
  color: white;
}
.preset-unit-glass {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.recent-tip-item-glass {
  background: rgba(0,0,0,0.3);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 2px solid $cafe-neon;
}
.recent-tip-to-glass {
  color: white;
  font-weight: bold;
  font-size: 14px;
}
.recent-tip-time-glass {
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
}
.recent-tip-amount-glass {
  margin-left: auto;
  color: $cafe-neon;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
}

.stat-item-neo {
  text-align: center;
}
.stat-label-neo {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.stat-value-neo {
  font-size: 28px;
  color: $cafe-neon;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
}

.input-label-glass {
  color: $cafe-text;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  display: block;
}

.form-group { display: flex; flex-direction: column; gap: 20px; }
.input-section { display: flex; flex-direction: column; }
.toggle-row { display: flex; gap: 10px; }

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
