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
              <NeoInput v-model="tipperName" :placeholder="t('tipperNamePlaceholder')" />
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useEvents, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Dev Tipping", zh: "开发者打赏" },
  subtitle: { en: "Support developers", zh: "支持开发者" },
  topDevelopers: { en: "Top Developers", zh: "顶级开发者" },
  tipsCount: { en: "tips", zh: "打赏次数" },
  totalTips: { en: "Total Tips", zh: "总打赏" },
  sendTip: { en: "Send Tip", zh: "发送打赏" },
  selectDeveloper: { en: "Select Developer", zh: "选择开发者" },
  tipAmount: { en: "Tip Amount", zh: "打赏金额" },
  customAmount: { en: "Custom amount...", zh: "自定义金额..." },
  optionalMessage: { en: "Optional Message", zh: "可选消息" },
  messagePlaceholder: { en: "Say thanks...", zh: "说声谢谢..." },
  tipperName: { en: "Your Name (optional)", zh: "您的昵称（可选）" },
  tipperNamePlaceholder: { en: "Anonymous", zh: "匿名" },
  sending: { en: "Sending...", zh: "发送中..." },
  sendTipBtn: { en: "Send Tip", zh: "发送打赏" },
  selected: { en: "Selected", zh: "已选择" },
  tipSent: { en: "Tip sent successfully!", zh: "打赏发送成功！" },
  invalidAmount: { en: "Invalid amount", zh: "无效金额" },
  minTip: { en: "Minimum tip is 0.001 GAS", zh: "最低打赏为 0.001 GAS" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  error: { en: "Error", zh: "错误" },
  recentTips: { en: "Recent Tips", zh: "最近打赏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalDonated: { en: "Total Donated", zh: "总打赏额" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Support developers with direct GAS tips",
    zh: "用 GAS 打赏直接支持开发者",
  },
  docDescription: {
    en: "Dev Tipping lets you show appreciation to Neo developers by sending GAS tips directly to their wallets. Support open source projects and track your contribution history.",
    zh: "Dev Tipping 让您通过直接向开发者钱包发送 GAS 打赏来表达感谢。支持开源项目并跟踪您的贡献历史。",
  },
  step1: {
    en: "Connect your Neo wallet",
    zh: "连接您的 Neo 钱包",
  },
  step2: {
    en: "Find a developer or project to support",
    zh: "找到要支持的开发者或项目",
  },
  step3: {
    en: "Enter tip amount and optional message",
    zh: "输入打赏金额和可选留言",
  },
  step4: {
    en: "Confirm transaction - tips go directly to developer",
    zh: "确认交易 - 打赏直接发送给开发者",
  },
  feature1Name: { en: "Direct Payments", zh: "直接支付" },
  feature1Desc: {
    en: "100% of your tip goes directly to the developer's wallet.",
    zh: "您的打赏 100% 直接进入开发者钱包。",
  },
  feature2Name: { en: "Contribution Tracking", zh: "贡献追踪" },
  feature2Desc: {
    en: "All tips are recorded on-chain with full transparency.",
    zh: "所有打赏都记录在链上，完全透明。",
  },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

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
const navTabs: NavTab[] = [
  { id: "send", label: "Send Tip", icon: "💰" },
  { id: "developers", label: "Developers", icon: "👨‍💻" },
  { id: "stats", label: t("stats"), icon: "chart" },
  { id: "docs", icon: "book", label: t("docs") },
];

const selectedDevId = ref<number | null>(null);
const tipAmount = ref("1");
const tipMessage = ref("");
const tipperName = ref("");
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
        const [nameRes, roleRes, walletRes, totalTipsRes, tipCountRes, balanceRes] = await Promise.all([
          invokeRead({ contractAddress: contract, operation: "getDevName", args: [{ type: "Integer", value: id }] }),
          invokeRead({ contractAddress: contract, operation: "getDevRole", args: [{ type: "Integer", value: id }] }),
          invokeRead({ contractAddress: contract, operation: "getDevWallet", args: [{ type: "Integer", value: id }] }),
          invokeRead({ contractAddress: contract, operation: "getDevTotalTips", args: [{ type: "Integer", value: id }] }),
          invokeRead({ contractAddress: contract, operation: "getDevTipCount", args: [{ type: "Integer", value: id }] }),
          invokeRead({ contractAddress: contract, operation: "getDevBalance", args: [{ type: "Integer", value: id }] }),
        ]);
        const name = String(parseInvokeResult(nameRes) ?? "").trim();
        const role = String(parseInvokeResult(roleRes) ?? "").trim();
        const wallet = String(parseInvokeResult(walletRes) ?? "").trim();
        return {
          id,
          name: name || `Dev #${id}`,
          role: role || "Neo Developer",
          wallet,
          totalTips: toGas(parseInvokeResult(totalTipsRes)),
          tipCount: toNumber(parseInvokeResult(tipCountRes)),
          balance: toGas(parseInvokeResult(balanceRes)),
          rank: "",
        };
      }),
    );
    const donatedRes = await invokeRead({ contractAddress: contract, operation: "totalDonated", args: [] });
    totalDonated.value = toGas(parseInvokeResult(donatedRes));
    devs.sort((a, b) => b.totalTips - a.totalTips);
    devs.forEach((dev, idx) => {
      dev.rank = `#${idx + 1}`;
    });
    developers.value = devs;
  } catch (e) {
    console.warn("Failed to load developers from contract", e);
  }
};

const loadRecentTips = async () => {
  const res = await listEvents({ app_id: APP_ID, event_name: "TipSent", limit: 20 });
  const devMap = new Map(developers.value.map((dev) => [dev.id, dev.name]));
  recentTips.value = res.events.map((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const devId = toNumber(values[1] ?? 0);
    const amount = toGas(values[2]);
    const to = devMap.get(devId) || `Dev #${devId}`;
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
  } catch (e) {
    console.warn("Failed to load dev tipping data", e);
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
      throw new Error(t("error"));
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
        { type: "Integer", value: String(receiptId) },
      ],
    });

    status.value = { msg: t("tipSent"), type: "success" };
    tipAmount.value = "1";
    tipMessage.value = "";
    tipperName.value = "";
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

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.dev-card-glass {
  padding: $space-6;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: $space-6;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  
  &:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(0.98);
  }
}

.dev-card-header {
  display: flex;
  gap: $space-5;
  margin-bottom: $space-4;
}

.dev-avatar-glass {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-emoji {
  font-size: 32px;
}
.avatar-badge-glass {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: $font-weight-black;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.dev-info {
  flex: 1;
}
.dev-name-glass {
  font-size: 18px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
  color: white;
}
.dev-projects-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  opacity: 0.8;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  color: rgba(255, 255, 255, 0.8);
}
.dev-contributions-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: #a78bfa;
  text-transform: uppercase;
  display: block;
  margin-top: 4px;
}

.dev-card-footer-glass {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: $space-4;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.tip-label-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
  text-transform: uppercase;
  color: white;
}
.tip-amount-glass {
  font-family: $font-mono;
  font-weight: $font-weight-bold;
  color: #34d399;
  font-size: 16px;
  margin-left: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}
.input-label-glass {
  font-size: 12px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  display: block;
}

.dev-selector {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dev-select-item-glass {
  padding: $space-3;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: #34d399;
  }
}
.dev-select-name-glass {
  color: white;
  font-weight: $font-weight-bold;
}
.dev-select-role-glass {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-3;
  margin-bottom: $space-4;
}
.preset-btn-glass {
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  
  &.active {
    background: rgba(245, 158, 11, 0.3);
    border-color: #fbbf24;
    color: #fbbf24;
  }
}
.preset-value-glass {
  font-weight: $font-weight-black;
  font-size: 18px;
  display: block;
  line-height: 1;
}
.preset-unit-glass {
  font-size: 10px;
  font-weight: $font-weight-bold;
  opacity: 0.6;
}

.recent-tips-glass {
  margin-top: $space-8;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: $space-6;
}
.recent-tips-title-glass {
  font-size: 14px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  margin-bottom: $space-4;
  color: rgba(255, 255, 255, 0.8);
  display: inline-block;
}
.recent-tip-item-glass {
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: $space-4;
  display: flex;
  align-items: center;
  gap: $space-4;
  color: white;
}

.stats-grid-neo {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;
}
.stat-item-neo {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}
.stat-label-neo {
  font-size: 12px;
  opacity: 0.6;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.stat-value-neo {
  font-size: 24px;
  font-weight: 800;
  color: #34d399;
}
.recent-tip-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.recent-tip-to-glass {
  font-weight: $font-weight-bold;
  font-size: 14px;
  text-transform: uppercase;
  color: white;
}
.recent-tip-time-glass {
  font-size: 10px;
  font-weight: $font-weight-medium;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.7);
}
.recent-tip-amount-glass {
  font-family: $font-mono;
  font-weight: $font-weight-bold;
  color: #34d399;
  font-size: 14px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
