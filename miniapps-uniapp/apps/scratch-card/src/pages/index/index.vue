<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'accent' : 'success'"
        class="mb-4"
      >
        <text class="text-center font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Main Scratch Card -->
      <view class="scratch-card-container">
        <NeoCard class="prize-tiers-card">
          <view class="prize-tiers flex justify-around">
            <view class="tier-item">
              <AppIcon name="trophy" :size="32" class="mb-1" />
              <text class="tier-label">10 GAS</text>
            </view>
            <view class="tier-item">
              <AppIcon name="gem" :size="32" class="mb-1" />
              <text class="tier-label">2 GAS</text>
            </view>
            <view class="tier-item">
              <AppIcon name="coin" :size="32" class="mb-1" />
              <text class="tier-label">1 GAS</text>
            </view>
          </view>
        </NeoCard>

        <view :class="['scratch-card', { revealed: revealed, scratching: isScratching }]">
          <!-- Scratch Layer (Top) -->
          <view v-if="!revealed" class="scratch-layer" @click="scratch">
            <view class="metallic-overlay"></view>
            <view class="scratch-instruction">
              <AppIcon name="ticket" :size="48" class="mb-2 scratch-icon" />
              <text class="scratch-text">{{ t("tapToScratch") }}</text>
            </view>
          </view>

          <!-- Prize Layer (Bottom) -->
          <view :class="['prize-layer', { win: prize > 0, 'no-win': revealed && prize === 0 }]">
            <view v-if="revealed" class="prize-content">
              <view v-if="prize > 0" class="win-display">
                <AppIcon :name="getPrizeSymbol(prize)" :size="80" class="prize-symbol" />
                <text class="prize-amount">{{ prize }} GAS</text>
                <view class="sparkles">
                  <AppIcon name="sparkle" :size="24" class="sparkle" />
                  <AppIcon name="sparkle" :size="24" class="sparkle" />
                  <AppIcon name="sparkle" :size="24" class="sparkle" />
                </view>
              </view>
              <view v-else class="no-win-display">
                <AppIcon name="x" :size="60" class="no-win-icon" />
                <text class="no-win-text">{{ t("noWin") }}</text>
              </view>
            </view>
            <view v-else class="prize-placeholder">
              <text class="placeholder-text">???</text>
            </view>
          </view>
        </view>

        <NeoButton
          v-if="revealed || !hasCard"
          variant="primary"
          size="lg"
          block
          :loading="isLoading"
          @click="buyCard"
          class="mt-4"
        >
          <view class="flex items-center justify-center gap-2">
            <text>{{ isLoading ? t("buying") : t("buyCard") }}</text>
            <AppIcon name="ticket" :size="20" />
          </view>
        </NeoButton>
      </view>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoStats :title="t('statistics')" :stats="statsItems" />
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

    <!-- Win Celebration Modal -->
    <view v-if="showCelebration" class="celebration-modal" @click="showCelebration = false">
      <view class="celebration-content">
        <text class="celebration-title">🎉 {{ t("congratulations") }} 🎉</text>
        <text class="celebration-prize">{{ prize }} GAS</text>
        <view class="celebration-sparkles">
          <AppIcon name="sparkle" :size="40" class="big-sparkle" />
          <AppIcon name="trophy" :size="48" class="big-sparkle" />
          <AppIcon name="sparkle" :size="40" class="big-sparkle" />
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, AppIcon, NeoButton, NeoCard, NeoStats, type StatItem } from "@/shared/components";

const translations = {
  title: { en: "Scratch Card", zh: "刮刮卡" },
  subtitle: { en: "Instant win prizes", zh: "即时赢取奖品" },
  tapToScratch: { en: "Tap to Scratch", zh: "点击刮开" },
  prizeWin: { en: "🎉 {0} GAS!", zh: "🎉 {0} GAS！" },
  noWin: { en: "No Win", zh: "未中奖" },
  buying: { en: "Buying...", zh: "购买中..." },
  buyCard: { en: "Buy Card (1 GAS)", zh: "购买卡片 (1 GAS)" },
  yourStats: { en: "Your Stats", zh: "您的统计" },
  scratched: { en: "Scratched", zh: "已刮开" },
  wonGas: { en: "Won (GAS)", zh: "赢得 (GAS)" },
  cardPurchased: { en: "Card purchased!", zh: "卡片已购买！" },
  waitingReveal: { en: "Waiting for RNG...", zh: "等待随机数..." },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  lastPrize: { en: "Last Prize", zh: "最近奖品" },
  congratulations: { en: "CONGRATULATIONS!", zh: "恭喜中奖！" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Instant win scratch cards with on-chain randomness",
    zh: "使用链上随机数的即时中奖刮刮卡",
  },
  docDescription: {
    en: "Scratch Card offers instant-win gaming with provably fair results. Purchase cards, scratch to reveal prizes, and win GAS instantly. All randomness is generated on-chain for transparency.",
    zh: "刮刮卡提供可证明公平结果的即时中奖游戏。购买卡片，刮开揭示奖品，即时赢取 GAS。所有随机数都在链上生成以确保透明。",
  },
  step1: {
    en: "Connect your Neo wallet and purchase a scratch card for 1 GAS",
    zh: "连接您的 Neo 钱包并以 1 GAS 购买刮刮卡",
  },
  step2: {
    en: "Tap the card to scratch and reveal your prize",
    zh: "点击卡片刮开并揭示您的奖品",
  },
  step3: {
    en: "Win prizes ranging from 0.1 to 100 GAS instantly",
    zh: "即时赢取 0.1 到 100 GAS 的奖品",
  },
  step4: {
    en: "Winnings are automatically sent to your wallet",
    zh: "奖金自动发送到您的钱包",
  },
  feature1Name: { en: "Instant Prizes", zh: "即时奖品" },
  feature1Desc: {
    en: "No waiting - prizes are revealed and paid out immediately.",
    zh: "无需等待 - 奖品立即揭晓并支付。",
  },
  feature2Name: { en: "Provably Fair", zh: "可证明公平" },
  feature2Desc: {
    en: "On-chain randomness ensures every scratch is verifiably fair.",
    zh: "链上随机数确保每次刮开都可验证公平。",
  },
};
const t = createT(translations);

const navTabs = [
  { id: "game", icon: "game", label: t("game") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-scratchcard";
const { address, connect, invokeContract, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const hasCard = ref(false);
const revealed = ref(false);
const prize = ref(0);
const pendingPrize = ref<number | null>(null);
const cardsScratched = ref(0);
const totalWon = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const isScratching = ref(false);
const showCelebration = ref(false);
const contractHash = ref<string | null>(null);

const statsItems = computed<StatItem[]>(() => [
  { label: t("totalGames"), value: cardsScratched.value },
  { label: t("wonGas"), value: `${totalWon.value} GAS`, variant: "success" },
  { label: t("lastPrize"), value: revealed.value ? `${prize.value} GAS` : "-" },
]);

const getPrizeSymbol = (prizeAmount: number): string => {
  if (prizeAmount >= 10) return "trophy";
  if (prizeAmount >= 2) return "gem";
  if (prizeAmount >= 1) return "coin";
  return "ticket";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toFixed8 = (value: string | number) => {
  const num = Number.parseFloat(String(value));
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const waitForReveal = async (cardId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "CardRevealed", limit: 25 });
    const match = res.events.find((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[3] ?? "") === String(cardId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const buyCard = async () => {
  if (isLoading.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    if (!contractHash.value) {
      contractHash.value = (await getContractHash()) as string;
    }
    if (!contractHash.value) {
      throw new Error(t("contractUnavailable"));
    }

    const payment = await payGAS("1", "scratchcard:buy");
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }
    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "BuyCard",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: "1" },
        { type: "Integer", value: toFixed8("1") },
        { type: "Integer", value: Number(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    pendingPrize.value = null;
    if (txid) {
      const purchaseEvt = await waitForEvent(txid, "CardPurchased");
      const purchaseValues = Array.isArray((purchaseEvt as any)?.state)
        ? (purchaseEvt as any).state.map(parseStackItem)
        : [];
      const cardId = String(purchaseValues[3] ?? "");
      if (cardId) {
        const revealEvt = await waitForReveal(cardId);
        const revealValues = Array.isArray((revealEvt as any)?.state)
          ? (revealEvt as any).state.map(parseStackItem)
          : [];
        const prizeRaw = revealValues[2];
        pendingPrize.value = Number(prizeRaw || 0) / 1e8;
      }
    }

    hasCard.value = true;
    revealed.value = false;
    prize.value = 0;
    showCelebration.value = false;
    status.value = { msg: t("cardPurchased"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const scratch = async () => {
  if (!hasCard.value || revealed.value || isScratching.value) return;

  if (pendingPrize.value === null) {
    status.value = { msg: t("waitingReveal"), type: "loading" };
    return;
  }

  isScratching.value = true;

  try {
    // Delay reveal for animation
    setTimeout(() => {
      prize.value = pendingPrize.value || 0;
      revealed.value = true;
      cardsScratched.value++;
      if (prize.value > 0) {
        totalWon.value += prize.value;
        setTimeout(() => {
          showCelebration.value = true;
        }, 300);
      }
      hasCard.value = false;
      isScratching.value = false;
      pendingPrize.value = null;
    }, 600);
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
    isScratching.value = false;
  }
};
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

.scratch-card-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.prize-tiers {
  display: flex;
  justify-content: space-around;
  padding: $space-2;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.tier-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.scratch-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1.6;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  overflow: hidden;
  &.scratching {
    animation: shake-card 0.3s infinite;
  }
}

.scratch-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--brutal-blue);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: pointer;
}

.scratch-text {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: white;
}

.prize-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  &.win {
    background: var(--brutal-yellow);
  }
}

.prize-amount {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: $font-size-3xl;
  color: var(--neo-green);
}

.celebration-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.celebration-content {
  background: var(--brutal-yellow);
  padding: $space-8;
  border: $border-width-lg solid var(--neo-purple);
  text-align: center;
  box-shadow: 10px 10px 0 var(--neo-purple);
}

.celebration-title {
  font-weight: $font-weight-black;
  font-size: $font-size-2xl;
  display: block;
  margin-bottom: $space-4;
}
.celebration-prize {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: $font-size-4xl;
}

@keyframes shake-card {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.celebration-sparkles {
  display: flex;
  gap: $space-4;
  margin-top: $space-4;
}

.big-sparkle {
  animation: pulse-celeb 1s infinite;
}

@keyframes pulse-celeb {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>
