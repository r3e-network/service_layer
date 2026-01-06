<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'developers' || activeTab === 'send'" class="app-container">
      <view class="header">
        <text class="title">{{ t("title") }}</text>
        <text class="subtitle">{{ t("subtitle") }}</text>
      </view>
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4">
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="activeTab === 'developers'" class="tab-content">
        <NeoCard :title="t('topDevelopers')" variant="accent">
          <view v-for="dev in developers" :key="dev.id" class="dev-card" @click="selectDev(dev)">
            <view class="dev-card-header">
              <view class="dev-avatar">
                <text class="avatar-emoji">👨‍💻</text>
                <view class="avatar-badge">{{ dev.rank }}</view>
              </view>
              <view class="dev-info">
                <text class="dev-name">{{ dev.name }}</text>
                <text class="dev-projects">
                  <text class="project-icon">🧩</text>
                  {{ dev.role }}
                </text>
                <text class="dev-contributions">{{ dev.tipCount }} {{ t("tipsCount") }}</text>
              </view>
            </view>
            <view class="dev-card-footer">
              <view class="tip-stats">
                <text class="tip-label">{{ t("totalTips") }}</text>
                <text class="tip-amount">{{ formatNum(dev.totalTips) }} GAS</text>
              </view>
              <view class="tip-action">
                <text class="tip-icon">💚</text>
              </view>
            </view>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'send'" class="tab-content">
        <NeoCard :title="t('sendTip')" variant="accent">
          <view class="form-group">
            <!-- Developer Selection -->
            <view class="input-section">
              <text class="input-label">{{ t("selectDeveloper") }}</text>
              <view class="dev-selector">
                <view
                  v-for="dev in developers"
                  :key="dev.id"
                  :class="['dev-select-item', { active: selectedDevId === dev.id }]"
                  @click="selectedDevId = dev.id"
                >
                  <text class="dev-select-name">{{ dev.name }}</text>
                  <text class="dev-select-role">{{ dev.role }}</text>
                </view>
              </view>
            </view>

            <!-- Tip Amount with Presets -->
            <view class="input-section">
              <text class="input-label">{{ t("tipAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="preset in presetAmounts"
                  :key="preset"
                  :class="['preset-btn', { active: tipAmount === preset.toString() }]"
                  @click="tipAmount = preset.toString()"
                >
                  <text class="preset-value">{{ preset }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="tipAmount" type="number" :placeholder="t('customAmount')" suffix="GAS" />
            </view>

            <!-- Optional Message -->
            <view class="input-section">
              <text class="input-label">{{ t("optionalMessage") }}</text>
              <NeoInput v-model="tipMessage" :placeholder="t('messagePlaceholder')" />
            </view>
            <view class="input-section">
              <text class="input-label">{{ t("tipperName") }}</text>
              <NeoInput v-model="tipperName" :placeholder="t('tipperNamePlaceholder')" />
            </view>

            <!-- Send Button -->
            <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="sendTip">
              <text v-if="!isLoading">💚 {{ t("sendTipBtn") }}</text>
              <text v-else>{{ t("sending") }}</text>
            </NeoButton>

            <!-- Recent Tips -->
            <view v-if="recentTips.length > 0" class="recent-tips">
              <text class="recent-tips-title">{{ t("recentTips") }}</text>
              <view v-for="tip in recentTips" :key="tip.id" class="recent-tip-item">
                <text class="recent-tip-emoji">✨</text>
                <view class="recent-tip-info">
                  <text class="recent-tip-to">{{ tip.to }}</text>
                  <text class="recent-tip-time">{{ tip.time }}</text>
                </view>
                <text class="recent-tip-amount">{{ tip.amount }} GAS</text>
              </view>
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
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
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
  error: { en: "Error", zh: "错误" },
  recentTips: { en: "Recent Tips", zh: "最近打赏" },

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
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-dev-tipping";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();
const contractHash = ref<string | null>(null);

const activeTab = ref<string>("developers");
const navTabs: NavTab[] = [
  { id: "developers", label: "Developers", icon: "👨‍💻" },
  { id: "send", label: "Send Tip", icon: "💰" },
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
const toGas = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};
const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = (await getContractHash()) as string;
  }
  if (!contractHash.value) {
    throw new Error("Contract not configured");
  }
};

const loadDevelopers = async () => {
  await ensureContractHash();
  const hash = contractHash.value as string;
  const totalRes = await invokeRead({ contractHash: hash, operation: "TotalDevelopers" });
  const total = Number(parseInvokeResult(totalRes) ?? 0);
  const list: Developer[] = [];
  for (let id = 1; id <= total; id += 1) {
    const [nameRes, roleRes, walletRes, tipsRes, countRes, balanceRes] = await Promise.all([
      invokeRead({ contractHash: hash, operation: "GetDevName", args: [{ type: "Integer", value: id }] }),
      invokeRead({ contractHash: hash, operation: "GetDevRole", args: [{ type: "Integer", value: id }] }),
      invokeRead({
        contractHash: hash,
        operation: "GetDevWallet",
        args: [{ type: "Integer", value: id }],
      }),
      invokeRead({
        contractHash: hash,
        operation: "GetDevTotalTips",
        args: [{ type: "Integer", value: id }],
      }),
      invokeRead({
        contractHash: hash,
        operation: "GetDevTipCount",
        args: [{ type: "Integer", value: id }],
      }),
      invokeRead({
        contractHash: hash,
        operation: "GetDevBalance",
        args: [{ type: "Integer", value: id }],
      }),
    ]);
    list.push({
      id,
      name: String(parseInvokeResult(nameRes) || `Dev #${id}`),
      role: String(parseInvokeResult(roleRes) || ""),
      wallet: String(parseInvokeResult(walletRes) || ""),
      totalTips: toGas(parseInvokeResult(tipsRes)),
      tipCount: Number(parseInvokeResult(countRes) ?? 0),
      balance: toGas(parseInvokeResult(balanceRes)),
      rank: "",
    });
  }
  list.sort((a, b) => b.totalTips - a.totalTips);
  list.forEach((dev, idx) => {
    dev.rank = `#${idx + 1}`;
  });
  developers.value = list;
  const totalDonatedRes = await invokeRead({ contractHash: hash, operation: "TotalDonated" });
  totalDonated.value = toGas(parseInvokeResult(totalDonatedRes));
};

const loadRecentTips = async () => {
  const res = await listEvents({ app_id: APP_ID, event_name: "TipSent", limit: 20 });
  const devMap = new Map(developers.value.map((dev) => [dev.id, dev.name]));
  recentTips.value = res.events.map((evt) => {
    const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
    const devId = Number(values[1] ?? 0);
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 20 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const sendTip = async () => {
  if (!selectedDevId.value || !tipAmount.value || isLoading.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractHash();
    const hash = contractHash.value as string;
    const payment = await payGAS(tipAmount.value, `tip:${selectedDevId.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: hash,
      operation: "Tip",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: selectedDevId.value },
        { type: "Integer", value: toFixed8(tipAmount.value) },
        { type: "String", value: tipMessage.value || "" },
        { type: "String", value: tipperName.value || "" },
        { type: "Integer", value: Number(receiptId) },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      await waitForEvent(txid, "TipSent");
    }
    status.value = { msg: t("tipSent"), type: "success" };
    tipAmount.value = "1";
    tipMessage.value = "";
    tipperName.value = "";
    await refreshData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  refreshData();
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

.dev-card {
  padding: $space-6;
  background: white;
  border: 4px solid black;
  margin-bottom: $space-6;
  cursor: pointer;
  box-shadow: 10px 10px 0 black;
  transition: all $transition-fast;
  &:active { transform: translate(4px, 4px); box-shadow: 6px 6px 0 black; }
}

.dev-card-header { display: flex; gap: $space-5; margin-bottom: $space-4; }
.dev-avatar {
  width: 60px; height: 60px; background: var(--brutal-yellow); border: 4px solid black;
  display: flex; align-items: center; justify-content: center; position: relative;
  box-shadow: 4px 4px 0 black;
}

.avatar-emoji { font-size: 32px; }
.avatar-badge {
  position: absolute; top: -10px; right: -10px; background: black; color: white;
  padding: 2px 8px; font-size: 10px; font-weight: $font-weight-black; border: 2px solid black;
}

.dev-info { flex: 1; }
.dev-name { font-size: 20px; font-weight: $font-weight-black; text-transform: uppercase; display: block; border-bottom: 2px solid black; margin-bottom: 4px; }
.dev-projects { font-size: 10px; font-weight: $font-weight-black; opacity: 0.6; text-transform: uppercase; background: #eee; padding: 2px 6px; display: inline-block; }
.dev-contributions { font-size: 10px; font-weight: $font-weight-black; color: var(--neo-purple); text-transform: uppercase; display: block; margin-top: 4px; }

.dev-card-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: $space-4; border-top: 4px solid black; }
.tip-label { font-size: 10px; font-weight: $font-weight-black; opacity: 1; text-transform: uppercase; }
.tip-amount { font-family: $font-mono; font-weight: $font-weight-black; color: black; background: var(--neo-green); padding: 4px 10px; border: 2px solid black; font-size: 16px; margin-left: 8px; }

.form-group { display: flex; flex-direction: column; gap: $space-6; }
.input-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; color: black; margin-bottom: 8px; display: block; }

.preset-amounts { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-3; margin-bottom: $space-4; }
.preset-btn {
  padding: $space-4; background: white; border: 3px solid black;
  text-align: center; cursor: pointer;
  box-shadow: 4px 4px 0 black;
  &.active { background: var(--brutal-yellow); transform: translate(2px, 2px); box-shadow: 2px 2px 0 black; }
  transition: all $transition-fast;
}
.preset-value { font-weight: $font-weight-black; font-size: 18px; display: block; line-height: 1; }
.preset-unit { font-size: 10px; font-weight: $font-weight-black; opacity: 0.8; }

.recent-tips { margin-top: $space-8; border-top: 6px solid black; padding-top: $space-6; }
.recent-tips-title { font-size: 14px; font-weight: $font-weight-black; text-transform: uppercase; margin-bottom: $space-4; background: black; color: white; padding: 4px 12px; display: inline-block; }
.recent-tip-item {
  padding: $space-4; background: white; border: 3px solid black;
  margin-bottom: $space-4; display: flex; align-items: center; gap: $space-4;
  box-shadow: 4px 4px 0 black;
}
.recent-tip-info { flex: 1; display: flex; flex-direction: column; }
.recent-tip-to { font-weight: $font-weight-black; font-size: 14px; text-transform: uppercase; }
.recent-tip-time { font-size: 10px; font-weight: $font-weight-black; opacity: 0.5; }
.recent-tip-amount { font-family: $font-mono; font-weight: $font-weight-black; color: black; background: var(--neo-green); padding: 2px 8px; border: 1px solid black; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
