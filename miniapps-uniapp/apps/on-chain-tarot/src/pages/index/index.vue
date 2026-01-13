<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
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

    <view v-if="activeTab === 'game'" class="tab-content mystical-bg">
      <!-- Mystical Background Decorations -->
      <view class="cosmic-stars">
        <text class="star star-1">✨</text>
        <text class="star star-2">⭐</text>
        <text class="star star-3">✨</text>
        <text class="star star-4">⭐</text>
        <text class="moon-decoration">🌙</text>
      </view>

      <AppStatus :status="status" />

      <GameArea
        v-model:question="question"
        :drawn="drawn"
        :has-drawn="hasDrawn"
        :is-loading="isLoading"
        :t="t as any"
        @draw="draw"
        @reset="reset"
        @flip="flipCard"
      />

      <ReadingDisplay v-if="hasDrawn && allFlipped" :title="t('yourReading')" :reading="getReading()" />
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatisticsTab :readings-count="readingsCount" :t="t as any" />
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
import { createT } from "@/shared/utils/i18n";
import { parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import AppStatus from "./components/AppStatus.vue";
import GameArea from "./components/GameArea.vue";
import ReadingDisplay from "./components/ReadingDisplay.vue";
import StatisticsTab from "./components/StatisticsTab.vue";
import type { Card } from "./components/TarotCard.vue";

const translations = {
  title: { en: "On-Chain Tarot", zh: "链上塔罗" },
  subtitle: { en: "Blockchain-powered divination", zh: "区块链占卜" },
  drawYourCards: { en: "Draw Your Cards", zh: "抽取您的牌" },
  drawCards: { en: "Draw 3 Cards (0.05 GAS)", zh: "抽取 3 张牌 (0.05 GAS)" },
  drawing: { en: "Drawing...", zh: "抽取中..." },
  drawAgain: { en: "Draw Again", zh: "再次抽取" },
  questionPlaceholder: { en: "Ask a question...", zh: "输入你的问题..." },
  yourReading: { en: "Your Reading", zh: "您的解读" },
  cardsDrawn: { en: "Cards drawn!", zh: "牌已抽取！" },
  drawingCards: { en: "Drawing cards...", zh: "正在抽取牌..." },
  past: { en: "Past", zh: "过去" },
  present: { en: "Present", zh: "现在" },
  future: { en: "Future", zh: "未来" },
  readingText: {
    en: "A three-card reading drawn on-chain for transparency.",
    zh: "链上抽取的三张牌解读。",
  },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  readingPending: { en: "Reading pending", zh: "解读确认中" },
  error: { en: "Error", zh: "错误" },
  game: { en: "Game", zh: "游戏" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalGames: { en: "Total Games", zh: "总游戏数" },
  cardsDrawnCount: { en: "Cards Drawn", zh: "抽取卡牌数" },
  totalSpent: { en: "Total Spent", zh: "总花费" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Blockchain-verified tarot readings with verifiable randomness",
    zh: "区块链验证的塔罗牌解读，具有可验证随机性",
  },
  docDescription: {
    en: "On-Chain Tarot provides mystical three-card readings powered by blockchain randomness. Ask your question, pay a small fee, and receive Past-Present-Future cards drawn through verifiable on-chain oracles.",
    zh: "链上塔罗提供由区块链随机性驱动的神秘三牌解读。提出问题，支付少量费用，通过可验证的链上预言机获得过去-现在-未来的牌。",
  },
  step1: { en: "Connect your wallet and enter your question.", zh: "连接钱包并输入你的问题。" },
  step2: { en: "Pay 0.05 GAS to request an on-chain reading.", zh: "支付 0.05 GAS 请求链上解读。" },
  step3: { en: "Wait for the oracle to generate your cards.", zh: "等待预言机生成你的牌。" },
  step4: { en: "Flip each card to reveal your Past, Present, and Future.", zh: "翻转每张牌揭示你的过去、现在和未来。" },
  feature1Name: { en: "Verifiable Randomness", zh: "可验证随机性" },
  feature1Desc: {
    en: "Cards are drawn using on-chain VRF for provably fair results.",
    zh: "使用链上 VRF 抽取卡牌，确保可证明的公平结果。",
  },
  feature2Name: { en: "78-Card Deck", zh: "78 张牌组" },
  feature2Desc: {
    en: "Full Major and Minor Arcana for authentic tarot readings.",
    zh: "完整的大阿卡纳和小阿卡纳，提供真实的塔罗解读。",
  },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const navTabs: NavTab[] = [
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
const APP_ID = "miniapp-onchaintarot";
const { address, connect, invokeContract, chainType, switchChain } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const tarotDeck: Omit<Card, "flipped">[] = [
  { id: 0, name: "The Fool", icon: "🃏" },
  { id: 1, name: "The Magician", icon: "🎩" },
  { id: 2, name: "The High Priestess", icon: "🔮" },
  { id: 3, name: "The Empress", icon: "👑" },
  { id: 4, name: "The Emperor", icon: "⚔️" },
  { id: 5, name: "The Hierophant", icon: "📜" },
  { id: 6, name: "The Lovers", icon: "💕" },
  { id: 7, name: "The Chariot", icon: "🏇" },
  { id: 8, name: "Strength", icon: "🦁" },
  { id: 9, name: "The Hermit", icon: "🕯️" },
  { id: 10, name: "Wheel of Fortune", icon: "☸️" },
  { id: 11, name: "Justice", icon: "⚖️" },
  { id: 12, name: "The Hanged Man", icon: "🙃" },
  { id: 13, name: "Death", icon: "💀" },
  { id: 14, name: "Temperance", icon: "🍷" },
  { id: 15, name: "The Devil", icon: "😈" },
  { id: 16, name: "The Tower", icon: "🗼" },
  { id: 17, name: "The Star", icon: "⭐" },
  { id: 18, name: "The Moon", icon: "🌙" },
  { id: 19, name: "The Sun", icon: "☀️" },
  { id: 20, name: "Judgement", icon: "📯" },
  { id: 21, name: "The World", icon: "🌍" },
  { id: 22, name: "Ace of Wands", icon: "🔥" },
  { id: 23, name: "Two of Wands", icon: "🔥" },
  { id: 24, name: "Three of Wands", icon: "🔥" },
  { id: 25, name: "Four of Wands", icon: "🔥" },
  { id: 26, name: "Five of Wands", icon: "🔥" },
  { id: 27, name: "Six of Wands", icon: "🔥" },
  { id: 28, name: "Seven of Wands", icon: "🔥" },
  { id: 29, name: "Eight of Wands", icon: "🔥" },
  { id: 30, name: "Nine of Wands", icon: "🔥" },
  { id: 31, name: "Ten of Wands", icon: "🔥" },
  { id: 32, name: "Page of Wands", icon: "🔥" },
  { id: 33, name: "Knight of Wands", icon: "🔥" },
  { id: 34, name: "Queen of Wands", icon: "🔥" },
  { id: 35, name: "King of Wands", icon: "🔥" },
  { id: 36, name: "Ace of Cups", icon: "💧" },
  { id: 37, name: "Two of Cups", icon: "💧" },
  { id: 38, name: "Three of Cups", icon: "💧" },
  { id: 39, name: "Four of Cups", icon: "💧" },
  { id: 40, name: "Five of Cups", icon: "💧" },
  { id: 41, name: "Six of Cups", icon: "💧" },
  { id: 42, name: "Seven of Cups", icon: "💧" },
  { id: 43, name: "Eight of Cups", icon: "💧" },
  { id: 44, name: "Nine of Cups", icon: "💧" },
  { id: 45, name: "Ten of Cups", icon: "💧" },
  { id: 46, name: "Page of Cups", icon: "💧" },
  { id: 47, name: "Knight of Cups", icon: "💧" },
  { id: 48, name: "Queen of Cups", icon: "💧" },
  { id: 49, name: "King of Cups", icon: "💧" },
  { id: 50, name: "Ace of Swords", icon: "⚔️" },
  { id: 51, name: "Two of Swords", icon: "⚔️" },
  { id: 52, name: "Three of Swords", icon: "⚔️" },
  { id: 53, name: "Four of Swords", icon: "⚔️" },
  { id: 54, name: "Five of Swords", icon: "⚔️" },
  { id: 55, name: "Six of Swords", icon: "⚔️" },
  { id: 56, name: "Seven of Swords", icon: "⚔️" },
  { id: 57, name: "Eight of Swords", icon: "⚔️" },
  { id: 58, name: "Nine of Swords", icon: "⚔️" },
  { id: 59, name: "Ten of Swords", icon: "⚔️" },
  { id: 60, name: "Page of Swords", icon: "⚔️" },
  { id: 61, name: "Knight of Swords", icon: "⚔️" },
  { id: 62, name: "Queen of Swords", icon: "⚔️" },
  { id: 63, name: "King of Swords", icon: "⚔️" },
  { id: 64, name: "Ace of Pentacles", icon: "🪙" },
  { id: 65, name: "Two of Pentacles", icon: "🪙" },
  { id: 66, name: "Three of Pentacles", icon: "🪙" },
  { id: 67, name: "Four of Pentacles", icon: "🪙" },
  { id: 68, name: "Five of Pentacles", icon: "🪙" },
  { id: 69, name: "Six of Pentacles", icon: "🪙" },
  { id: 70, name: "Seven of Pentacles", icon: "🪙" },
  { id: 71, name: "Eight of Pentacles", icon: "🪙" },
  { id: 72, name: "Nine of Pentacles", icon: "🪙" },
  { id: 73, name: "Ten of Pentacles", icon: "🪙" },
  { id: 74, name: "Page of Pentacles", icon: "🪙" },
  { id: 75, name: "Knight of Pentacles", icon: "🪙" },
  { id: 76, name: "Queen of Pentacles", icon: "🪙" },
  { id: 77, name: "King of Pentacles", icon: "🪙" },
];

const drawn = ref<Card[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const hasDrawn = computed(() => drawn.value.length === 3);
const allFlipped = computed(() => drawn.value.every((c) => c.flipped));
const readingsCount = ref(0);
const contractAddress = ref<string | null>(null);
const question = ref("");

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

const waitForReading = async (readingId: string) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "ReadingCompleted", limit: 25 });
    const match = res.events.find((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[0] ?? "") === String(readingId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = "0xc56f33fc6ec47edbd594472833cf57505d5f99aa";
  }
  if (!contractAddress.value) throw new Error(t("contractUnavailable"));
  return contractAddress.value;
};

const draw = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("drawingCards"), type: "loading" };
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const payment = await payGAS("0.05", `tarot:${Date.now()}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const prompt = question.value.trim() || "tarot";
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "RequestReading",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: prompt.slice(0, 200) },
        { type: "Integer", value: receiptId },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const requestedEvt = txid ? await waitForEvent(txid, "ReadingRequested") : null;
    if (!requestedEvt) throw new Error(t("readingPending"));
    const requestedValues = Array.isArray((requestedEvt as any)?.state)
      ? (requestedEvt as any).state.map(parseStackItem)
      : [];
    const readingId = String(requestedValues[0] ?? "");
    if (!readingId) throw new Error(t("readingPending"));

    const completedEvt = await waitForReading(readingId);
    if (!completedEvt) throw new Error(t("readingPending"));
    const values = Array.isArray((completedEvt as any)?.state) ? (completedEvt as any).state.map(parseStackItem) : [];
    const cards = Array.isArray(values[2]) ? values[2].map((v) => Number(v)) : [];
    drawn.value = cards.map((cardId: number) => {
      const card = tarotDeck.find((item) => item.id === cardId);
      if (!card) {
        return { id: cardId, name: `Card ${cardId}`, icon: "🂠", flipped: false };
      }
      return { ...card, flipped: false };
    });
    readingsCount.value += 1;
    question.value = "";
    status.value = { msg: t("cardsDrawn"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const flipCard = (index: number) => {
  if (drawn.value[index]) {
    drawn.value[index].flipped = true;
  }
};

const reset = () => {
  drawn.value = [];
  status.value = null;
};

const getReading = () => {
  if (drawn.value.length !== 3) return t("readingText");
  const [past, present, future] = drawn.value;
  return `${t("past")}: ${past.name} · ${t("present")}: ${present.name} · ${t("future")}: ${future.name}`;
};

const loadReadingCount = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "ReadingCompleted", limit: 50 });
    readingsCount.value = res.events.length;
  } catch {
    readingsCount.value = Math.max(readingsCount.value, 0);
  }
};

onMounted(async () => {
  await loadReadingCount();
});
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
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: transparent;
}

.mystical-bg {
  min-height: 100%;
  position: relative;
}

.cosmic-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.3;
  overflow: hidden;
}

.star {
  position: absolute;
  font-size: 24px;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
  animation: twinkle 3s infinite;
}
.star-1 {
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}
.star-2 {
  top: 20%;
  right: 20%;
  animation-delay: 1s;
}
.star-3 {
  bottom: 10%;
  left: 10%;
  animation-delay: 2s;
}
.star-4 {
  bottom: 15%;
  right: 15%;
  animation-delay: 1.5s;
}

.moon-decoration {
  position: absolute;
  top: 5%;
  right: 10%;
  font-size: 60px;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2));
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
