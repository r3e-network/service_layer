<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'create' || activeTab === 'claim'" class="app-container">
      <view class="header-brutal">
        <text class="title-brutal">{{ t("title") }}</text>
        <view class="subtitle-wrap">
          <text class="subtitle-brutal">{{ t("subtitle") }}</text>
        </view>
        <view class="decorations-brutal">
          <view class="decoration-item rotate-[-15deg]"><AppIcon name="sparkle" :size="32" class="text-yellow" /></view>
          <view class="decoration-item rotate-[10deg]"><AppIcon name="gift" :size="32" class="text-white" /></view>
          <view class="decoration-item rotate-[-5deg]"><AppIcon name="sparkle" :size="32" class="text-yellow" /></view>
        </view>
      </view>

      <!-- Lucky Message Display -->
      <view v-if="luckyMessage" class="lucky-overlay-brutal" @click="luckyMessage = null">
        <view class="lucky-card-brutal">
          <text class="lucky-header-brutal">🎉 {{ t("congratulations") }} 🎉</text>
          <view class="lucky-amount-box">
            <text class="lucky-amount-brutal">{{ luckyMessage.amount }}</text>
            <text class="lucky-currency-brutal">GAS</text>
          </view>
          <text class="lucky-from-brutal">{{ t("from").replace("{0}", luckyMessage.from) }}</text>
          <view class="coins-rain">
            <view v-for="i in 12" :key="i" class="coin-brutal" :style="{ animationDelay: `${i * 0.15}s`, left: `${Math.random() * 100}%` }">
              <AppIcon name="money" :size="24" class="text-yellow" />
            </view>
          </view>
          <NeoButton variant="primary" size="lg" block class="mt-8 border-4 border-black shadow-brutal-sm">
            <text class="font-black italic uppercase">{{ t("confirm") || "OK" }}</text>
          </NeoButton>
        </view>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'success' ? 'success' : 'danger'" class="status-card">
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="activeTab === 'create'" class="tab-content">
        <NeoCard :title="t('createEnvelope')" variant="accent" class="create-card">
          <view class="input-group">
            <NeoInput v-model="amount" type="number" :placeholder="t('totalGasPlaceholder')" suffix="GAS" />
            <NeoInput v-model="count" type="number" :placeholder="t('packetsPlaceholder')" />
            <NeoInput v-model="expiryHours" type="number" :placeholder="t('expiryPlaceholder')" suffix="h" />
          </view>
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="create" class="send-button">
            <view class="btn-content">
              <AppIcon name="envelope" :size="24" />
              <text class="button-text">{{ t("sendRedEnvelope") }}</text>
            </view>
          </NeoButton>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'claim'" class="tab-content">
        <NeoCard :title="t('availableEnvelopes')" variant="default">
          <view v-if="loadingEnvelopes" class="empty-state">{{ t("loadingEnvelopes") }}</view>
          <view v-else-if="!envelopes.length" class="empty-state">{{ t("noEnvelopes") }}</view>
          <view v-else class="envelope-list">
            <view
              v-for="env in envelopes"
              :key="env.id"
              class="hongbao-wrapper"
              :class="{ disabled: !env.canClaim }"
              @click="claim(env)"
            >
              <view class="hongbao-card" :class="{ 'hongbao-opening': openingId === env.id }">
                <view class="hongbao-front">
                  <view class="hongbao-top">
                    <text class="hongbao-pattern">福</text>
                  </view>
                  <view class="hongbao-seal">
                    <AppIcon name="money" :size="20" class="text-yellow" />
                  </view>
                  <view class="hongbao-info">
                    <text class="hongbao-from">{{ env.from }}</text>
                    <text class="hongbao-remaining">
                      {{ t("remaining").replace("{0}", String(env.remaining)).replace("{1}", String(env.total)) }}
                    </text>
                    <text
                      class="hongbao-status"
                      :class="{
                        'status-ready': env.canClaim,
                        'status-pending': !env.ready && !env.expired,
                        'status-expired': env.expired,
                      }"
                    >
                      {{ env.expired ? t("expired") : env.ready ? t("ready") : t("notReady") }}
                    </text>
                  </view>
                  <view class="sparkles">
                    <view class="sparkle"><AppIcon name="sparkle" :size="16" /></view>
                    <view class="sparkle"><AppIcon name="sparkle" :size="16" /></view>
                    <view class="sparkle"><AppIcon name="sparkle" :size="16" /></view>
                  </view>
                </view>
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoInput, NeoCard, NeoDoc, AppIcon } from "@/shared/components";

const translations = {
  title: { en: "Red Envelope", zh: "红包" },
  subtitle: { en: "Lucky red packets", zh: "幸运红包" },
  createTab: { en: "Create", zh: "创建" },
  claimTab: { en: "Claim", zh: "领取" },
  createEnvelope: { en: "Create Envelope", zh: "创建红包" },
  totalGasPlaceholder: { en: "Total GAS", zh: "总 GAS" },
  packetsPlaceholder: { en: "Number of packets", zh: "红包数量" },
  expiryPlaceholder: { en: "Expiry (hours)", zh: "过期时长 (小时)" },
  creating: { en: "Creating...", zh: "创建中..." },
  sendRedEnvelope: { en: "Send Red Envelope", zh: "发送红包" },
  availableEnvelopes: { en: "Available Envelopes", zh: "可用红包" },
  from: { en: "From {0}", zh: "来自 {0}" },
  remaining: { en: "{0}/{1} left", zh: "剩余 {0}/{1}" },
  envelopeSent: { en: "Envelope sent!", zh: "红包已发送！" },
  claimedFrom: { en: "Claimed from {0}!", zh: "已领取来自 {0} 的红包！" },
  congratulations: { en: "Congratulations", zh: "恭喜发财" },
  error: { en: "Error", zh: "错误" },
  docs: { en: "Docs", zh: "文档" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  envelopePending: { en: "Envelope pending on-chain", zh: "红包创建确认中" },
  claimPending: { en: "Claim pending", zh: "领取确认中" },
  envelopeNotReady: { en: "Envelope not ready yet", zh: "红包尚未准备好" },
  envelopeExpired: { en: "Envelope expired", zh: "红包已过期" },
  envelopeEmpty: { en: "Envelope is empty", zh: "红包已领完" },
  alreadyClaimed: { en: "You already claimed this envelope", zh: "你已领取过该红包" },
  invalidAmount: { en: "Enter at least 0.1 GAS", zh: "至少 0.1 GAS" },
  invalidPackets: { en: "Enter 1-100 packets", zh: "请输入 1-100 个红包" },
  invalidPerPacket: { en: "Each packet must be at least 0.01 GAS", zh: "每个红包至少 0.01 GAS" },
  invalidExpiry: { en: "Enter a valid expiry in hours", zh: "请输入有效的过期小时数" },
  ready: { en: "Ready", zh: "可领取" },
  notReady: { en: "Preparing", zh: "准备中" },
  expired: { en: "Expired", zh: "已过期" },
  confirm: { en: "Confirm", zh: "确认" },
  loadingEnvelopes: { en: "Loading envelopes...", zh: "加载红包中..." },
  noEnvelopes: { en: "No envelopes available yet", zh: "暂无可领取红包" },
  docSubtitle: { en: "Social lucky packets on Neo N3.", zh: "Neo N3 上的社交幸运红包。" },
  docDescription: {
    en: "Red Envelope is a social MiniApp that lets you send and claim GAS in lucky packets. It uses NeoHub's secure RNG to fairly distribute GAS across recipients.",
    zh: "红包是一个社交小程序，让你以幸运包的形式发送和领取 GAS。它使用 NeoHub 的安全随机数生成器来公平地在接收者之间分配 GAS。",
  },
  step1: { en: "Enter the total GAS and number of packets to create.", zh: "输入要创建的总 GAS 和红包数量。" },
  step2: { en: "Click 'Send Red Envelope' to authorize the payment.", zh: "点击「发送红包」授权支付。" },
  step3: {
    en: "Recipients can claim their portion randomly until empty!",
    zh: "接收者可以随机领取他们的份额，直到领完为止！",
  },
  step4: { en: "Share the envelope ID with friends to let them claim.", zh: "与朋友分享红包 ID 让他们领取。" },
  feature1Name: { en: "Secure Distribution", zh: "安全分配" },
  feature1Desc: {
    en: "Random amounts are calculated on-chain/TEE for fairness.",
    zh: "随机金额在链上/TEE 中计算以确保公平。",
  },
  feature2Name: { en: "Instant Claim", zh: "即时领取" },
  feature2Desc: { en: "GAS is transferred directly to your Neo wallet.", zh: "GAS 直接转移到你的 Neo 钱包。" },
};
const t = createT(translations);

const APP_ID = "miniapp-redenvelope";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref<string>("create");
const navTabs = [
  { id: "create", label: t("createTab"), icon: "envelope" },
  { id: "claim", label: t("claimTab"), icon: "gift" },
  { id: "docs", label: t("docs"), icon: "book" },
];

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const amount = ref("");
const count = ref("");
const expiryHours = ref("24");
const status = ref<{ msg: string; type: "success" | "error" } | null>(null);
const luckyMessage = ref<{ amount: number; from: string } | null>(null);
const openingId = ref<string | null>(null);
const contractHash = ref<string | null>(null);
const loadingEnvelopes = ref(false);

type EnvelopeItem = {
  id: string;
  creator: string;
  from: string;
  total: number;
  remaining: number;
  totalAmount: number;
  ready: boolean;
  expired: boolean;
  canClaim: boolean;
};

const envelopes = ref<EnvelopeItem[]>([]);

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const fromFixed8 = (value: string | number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return num / 1e8;
};

const formatHash = (value: string) => {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
};

const parseEnvelopeData = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      creator: String(data[0] ?? ""),
      totalAmount: Number(data[1] ?? 0),
      packetCount: Number(data[2] ?? 0),
      claimedCount: Number(data[3] ?? 0),
      remainingAmount: Number(data[4] ?? 0),
      bestLuckAddress: String(data[5] ?? ""),
      bestLuckAmount: Number(data[6] ?? 0),
      ready: Boolean(data[7]),
      expiryTime: Number(data[8] ?? 0),
    };
  }
  if (typeof data === "object") {
    return {
      creator: String(data.creator ?? ""),
      totalAmount: Number(data.totalAmount ?? 0),
      packetCount: Number(data.packetCount ?? 0),
      claimedCount: Number(data.claimedCount ?? 0),
      remainingAmount: Number(data.remainingAmount ?? 0),
      bestLuckAddress: String(data.bestLuckAddress ?? ""),
      bestLuckAmount: Number(data.bestLuckAmount ?? 0),
      ready: Boolean(data.ready ?? false),
      expiryTime: Number(data.expiryTime ?? 0),
    };
  }
  return null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    throw new Error(t("contractUnavailable"));
  }
  return contractHash.value;
};

const loadEnvelopes = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) return;
  loadingEnvelopes.value = true;
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "EnvelopeCreated", limit: 25 });
    const seen = new Set<string>();
    const list = await Promise.all(
      res.events.map(async (evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        const envelopeId = String(values[0] ?? "");
        if (!envelopeId || seen.has(envelopeId)) return null;
        seen.add(envelopeId);

        const creator = String(values[1] ?? "");
        const eventTotal = Number(values[2] ?? 0);
        const eventPackets = Number(values[3] ?? 0);

        const envRes = await invokeRead({
          contractHash: contractHash.value!,
          operation: "GetEnvelope",
          args: [{ type: "Integer", value: envelopeId }],
        });
        const parsed = parseEnvelopeData(parseInvokeResult(envRes));
        const packetCount = Number(parsed?.packetCount ?? eventPackets ?? 0);
        const claimedCount = Number(parsed?.claimedCount ?? 0);
        const remainingPackets = Math.max(0, packetCount - claimedCount);
        const ready = Boolean(parsed?.ready);
        const expiryTime = Number(parsed?.expiryTime ?? 0);
        const expired = expiryTime > 0 && Date.now() > expiryTime * 1000;
        const totalAmount = fromFixed8(parsed?.totalAmount ?? eventTotal);
        const canClaim = ready && !expired && remainingPackets > 0;

        return {
          id: envelopeId,
          creator,
          from: formatHash(creator),
          total: packetCount,
          remaining: remainingPackets,
          totalAmount,
          ready,
          expired,
          canClaim,
        } as EnvelopeItem;
      }),
    );
    envelopes.value = list.filter(Boolean).sort((a, b) => Number(b!.id) - Number(a!.id)) as EnvelopeItem[];
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  } finally {
    loadingEnvelopes.value = false;
  }
};

const create = async () => {
  if (isLoading.value) return;
  try {
    status.value = null;
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractHash();

    const totalValue = Number(amount.value);
    const packetCount = Number(count.value);
    if (!Number.isFinite(totalValue) || totalValue < 0.1) throw new Error(t("invalidAmount"));
    if (!Number.isFinite(packetCount) || packetCount < 1 || packetCount > 100) throw new Error(t("invalidPackets"));
    if (totalValue < packetCount * 0.01) throw new Error(t("invalidPerPacket"));

    const expiryValue = Number(expiryHours.value);
    if (!Number.isFinite(expiryValue) || expiryValue <= 0) throw new Error(t("invalidExpiry"));
    const expirySeconds = Math.round(expiryValue * 3600);

    const payment = await payGAS(amount.value, `redenvelope:${count.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "CreateEnvelope",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: toFixed8(amount.value) },
        { type: "Integer", value: String(packetCount) },
        { type: "Integer", value: String(expirySeconds) },
        { type: "Integer", value: receiptId },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const createdEvt = txid ? await waitForEvent(txid, "EnvelopeCreated") : null;
    if (!createdEvt) {
      throw new Error(t("envelopePending"));
    }

    status.value = { msg: t("envelopeSent"), type: "success" };
    amount.value = "";
    count.value = "";
    await loadEnvelopes();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

const claim = async (env: EnvelopeItem) => {
  if (openingId.value) return;
  try {
    status.value = null;
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractHash();

    if (env.expired) throw new Error(t("envelopeExpired"));
    if (!env.ready) throw new Error(t("envelopeNotReady"));
    if (env.remaining <= 0) throw new Error(t("envelopeEmpty"));

    const hasClaimedRes = await invokeRead({
      contractHash: contract,
      operation: "HasClaimed",
      args: [
        { type: "Integer", value: env.id },
        { type: "Hash160", value: address.value },
      ],
    });
    if (Boolean(parseInvokeResult(hasClaimedRes))) {
      throw new Error(t("alreadyClaimed"));
    }

    openingId.value = env.id;
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "Claim",
      args: [
        { type: "Integer", value: env.id },
        { type: "Hash160", value: address.value },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const claimedEvt = txid ? await waitForEvent(txid, "EnvelopeClaimed") : null;
    if (!claimedEvt) {
      throw new Error(t("claimPending"));
    }
    const values = Array.isArray((claimedEvt as any)?.state) ? (claimedEvt as any).state.map(parseStackItem) : [];
    const claimedAmount = fromFixed8(Number(values[2] ?? 0));
    const remaining = Number(values[3] ?? env.remaining);

    luckyMessage.value = {
      amount: Number(claimedAmount.toFixed(2)),
      from: env.from,
    };

    env.remaining = Math.max(0, remaining);
    env.canClaim = env.remaining > 0 && env.ready && !env.expired;

    status.value = { msg: t("claimedFrom").replace("{0}", env.from), type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  } finally {
    openingId.value = null;
  }
};

onMounted(async () => {
  await loadEnvelopes();
});

watch(activeTab, async (tab) => {
  if (tab === "claim") {
    await loadEnvelopes();
  }
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  background-color: white;
}

.header-brutal {
  text-align: center;
  margin-bottom: $space-8;
  background: var(--brutal-red);
  border: 6px solid black;
  padding: $space-10 $space-6;
  box-shadow: 12px 12px 0 black;
  position: relative;
  overflow: hidden;
  rotate: -1deg;
}

.title-brutal {
  font-size: 48px;
  font-weight: 900;
  text-transform: uppercase;
  color: white;
  line-height: 0.85;
  margin-bottom: $space-4;
  display: block;
  font-style: italic;
  letter-spacing: -2px;
}

.subtitle-wrap {
  display: inline-block;
  background: var(--brutal-yellow);
  padding: 4px 12px;
  border: 4px solid black;
  rotate: 2deg;
}

.subtitle-brutal {
  font-size: 14px;
  font-weight: 900;
  color: black;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.decorations-brutal {
  display: flex;
  justify-content: center;
  gap: $space-8;
  margin-top: $space-6;
}

.lucky-overlay-brutal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lucky-card-brutal {
  background: var(--brutal-red);
  border: 8px solid black;
  padding: $space-12 $space-8;
  text-align: center;
  box-shadow: 18px 18px 0 var(--brutal-yellow);
  width: 85%;
  max-width: 360px;
  position: relative;
  rotate: 1deg;
}

.lucky-header-brutal {
  font-size: 20px;
  font-weight: 900;
  color: var(--brutal-yellow);
  display: block;
  text-transform: uppercase;
  margin-bottom: $space-6;
  background: black;
  padding: 8px;
  border: 3px solid black;
}

.lucky-amount-box {
  margin: $space-8 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lucky-amount-brutal {
  font-size: 80px;
  font-weight: 900;
  color: white;
  font-family: $font-mono;
  line-height: 0.8;
  font-style: italic;
}

.lucky-currency-brutal {
  font-size: 24px;
  font-weight: 900;
  color: var(--brutal-yellow);
  text-transform: uppercase;
  margin-top: 8px;
}

.lucky-from-brutal {
  font-size: 14px;
  font-weight: 900;
  color: white;
  background: black;
  padding: 6px 12px;
  border: 2px solid black;
  display: inline-block;
}

.create-card {
  border: 6px solid black;
  box-shadow: 12px 12px 0 black;
  background: white;
  padding: $space-6;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  margin-bottom: $space-8;
}

.envelope-list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.hongbao-wrapper {
  background: white;
  border: 4px solid black;
  padding: $space-6;
  cursor: pointer;
  box-shadow: 8px 8px 0 black;
  transition: all $transition-fast;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0 black;
  }
  &.disabled {
    opacity: 0.5;
    filter: grayscale(1);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
  }
}

.hongbao-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: $space-4;
}

.hongbao-pattern {
  font-size: 36px;
  font-weight: 900;
  color: white;
  border: 3px solid black;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brutal-red);
  flex-shrink: 0;
  box-shadow: 4px 4px 0 black;
  rotate: -3deg;
}

.hongbao-info {
  flex: 1;
  padding: 0 $space-4;
}
.hongbao-from {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 12px;
  display: block;
  border-left: 4px solid black;
  padding-left: 8px;
  margin-bottom: 4px;
}
.hongbao-remaining {
  font-size: 12px;
  font-weight: $font-weight-black;
  background: #eee;
  padding: 2px 6px;
}

.hongbao-status {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 2px solid black;
  box-shadow: 3px 3px 0 black;
  &.status-ready {
    background: var(--brutal-green);
  }
  &.status-pending {
    background: var(--brutal-yellow);
  }
  &.status-expired {
    background: var(--brutal-red);
    color: white;
  }
}

.status-card {
  text-align: center;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
}
.status-text {
  font-weight: $font-weight-black;
  font-size: 12px;
  text-transform: uppercase;
}

.empty-state {
  text-align: center;
  padding: $space-10;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.5;
  border: 2px dashed black;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
