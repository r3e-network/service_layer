<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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

      <ReadingDisplay v-if="hasDrawn && allFlipped" :reading="getReading()" />
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
import { useI18n } from "@/composables/useI18n";
import { parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import AppStatus from "./components/AppStatus.vue";
import GameArea from "./components/GameArea.vue";
import ReadingDisplay from "./components/ReadingDisplay.vue";
import StatisticsTab from "./components/StatisticsTab.vue";
import type { Card } from "./components/TarotCard.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "game", icon: "game", label: t("game") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);
const activeTab = ref("game");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-onchaintarot";
const { address, connect, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
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
    contractAddress.value = await getContractAddress();
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

    const prompt = question.value.trim() || t("defaultQuestion");
    // Contract signature: RequestReading(user, question, spreadType, category, receiptId)
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "requestReading",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: prompt.slice(0, 200) },
        { type: "Integer", value: "0" }, // spreadType: 0 = single card
        { type: "Integer", value: "0" }, // category: 0 = general
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

$mystic-bg-top: #2c0b4a;
$mystic-bg-bottom: #0f0518;
$mystic-accent: #9b51e0;
$mystic-gold: #ffd700;

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
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at 50% 20%, $mystic-bg-top 0%, $mystic-bg-bottom 100%);
  background-attachment: fixed;
}

.cosmic-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.6;
  overflow: hidden;
  z-index: 0;
}

.star {
  position: absolute;
  font-size: 20px; /* Smaller, more subtle stars */
  color: #fff;
  text-shadow: 0 0 5px #fff, 0 0 10px $mystic-accent;
  animation: twinkle 4s infinite ease-in-out;
}
.star-1 { top: 10%; left: 15%; animation-delay: 0s; font-size: 16px; }
.star-2 { top: 25%; right: 20%; animation-delay: 1.2s; font-size: 12px; }
.star-3 { bottom: 15%; left: 10%; animation-delay: 2.5s; font-size: 14px; }
.star-4 { bottom: 30%; right: 10%; animation-delay: 3.8s; font-size: 18px; }

.moon-decoration {
  position: absolute;
  top: 40px;
  right: 20px;
  font-size: 80px;
  filter: drop-shadow(0 0 30px rgba(155, 81, 224, 0.4));
  opacity: 0.8;
  animation: float 6s ease-in-out infinite;
  z-index: 0;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Enhancing components for Mystical Feel */
:deep(.neo-card) {
  background: rgba(20, 5, 40, 0.6) !important;
  border: 1px solid rgba(155, 81, 224, 0.3) !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  color: #e0d0ff !important;
}

:deep(.neo-button) {
  background: linear-gradient(135deg, #5b247a 0%, #1b1464 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  box-shadow: 0 0 15px rgba(155, 81, 224, 0.4) !important;
  
  &:active {
    transform: scale(0.98);
  }
}
</style>
