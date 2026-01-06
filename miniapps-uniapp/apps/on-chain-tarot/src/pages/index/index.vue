<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'game'" class="tab-content mystical-bg">
      <!-- Mystical Background Decorations -->
      <view class="cosmic-stars">
        <text class="star star-1">✨</text>
        <text class="star star-2">⭐</text>
        <text class="star star-3">✨</text>
        <text class="star star-4">⭐</text>
        <text class="moon-decoration">🌙</text>
      </view>

      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <NeoCard :title="t('drawYourCards')" variant="accent" class="mystical-card">
        <view class="question-input">
          <NeoInput v-model="question" :placeholder="t('questionPlaceholder')" />
        </view>
        <view class="card-spread-container">
          <view class="spread-labels">
            <text class="spread-label">{{ t("past") }}</text>
            <text class="spread-label">{{ t("present") }}</text>
            <text class="spread-label">{{ t("future") }}</text>
          </view>

          <view class="cards-row">
            <view
              v-for="(card, i) in drawn"
              :key="i"
              :class="['tarot-card', { flipped: card.flipped, 'card-glow': card.flipped }]"
              @click="flipCard(i)"
            >
              <view class="card-inner">
                <!-- Card Front (Revealed) -->
                <view v-if="card.flipped" class="card-front">
                  <view class="card-border-decoration">
                    <text class="corner-star top-left">✦</text>
                    <text class="corner-star top-right">✦</text>
                    <text class="corner-star bottom-left">✦</text>
                    <text class="corner-star bottom-right">✦</text>
                  </view>
                  <text class="card-face">{{ card.icon }}</text>
                  <text class="card-name">{{ card.name }}</text>
                </view>

                <!-- Card Back (Hidden) -->
                <view v-else class="card-back">
                  <view class="card-back-pattern">
                    <text class="pattern-moon">🌙</text>
                    <text class="pattern-stars">✨</text>
                    <text class="pattern-center">🔮</text>
                    <text class="pattern-stars">✨</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="action-buttons">
          <NeoButton v-if="!hasDrawn" variant="primary" size="lg" block :loading="isLoading" @click="draw">
            {{ t("drawCards") }}
          </NeoButton>
          <NeoButton v-else variant="secondary" size="lg" block @click="reset">
            {{ t("drawAgain") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="hasDrawn && allFlipped" :title="t('yourReading')" variant="default" class="reading-card">
        <view class="fortune-container">
          <text class="fortune-icon">🔮</text>
          <text class="reading-text">{{ getReading() }}</text>
          <view class="mystical-divider">
            <text>✦ ✦ ✦</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="t('statistics')" variant="default">
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGames") }}</text>
          <text class="stat-value">{{ readingsCount }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("cardsDrawnCount") }}</text>
          <text class="stat-value">{{ readingsCount * 3 }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalSpent") }}</text>
          <text class="stat-value">{{ (readingsCount * 0.05).toFixed(2) }} GAS</text>
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
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

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
const APP_ID = "miniapp-onchaintarot";
const { address, connect, invokeContract, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

interface Card {
  id: number;
  name: string;
  icon: string;
  flipped: boolean;
}

const tarotDeck: Card[] = [
  { id: 0, name: "The Fool", icon: "🃏", flipped: false },
  { id: 1, name: "The Magician", icon: "🎩", flipped: false },
  { id: 2, name: "The High Priestess", icon: "🔮", flipped: false },
  { id: 3, name: "The Empress", icon: "👑", flipped: false },
  { id: 4, name: "The Emperor", icon: "⚔️", flipped: false },
  { id: 5, name: "The Hierophant", icon: "📜", flipped: false },
  { id: 6, name: "The Lovers", icon: "💕", flipped: false },
  { id: 7, name: "The Chariot", icon: "🏇", flipped: false },
  { id: 8, name: "Strength", icon: "🦁", flipped: false },
  { id: 9, name: "The Hermit", icon: "🕯️", flipped: false },
  { id: 10, name: "Wheel of Fortune", icon: "☸️", flipped: false },
  { id: 11, name: "Justice", icon: "⚖️", flipped: false },
  { id: 12, name: "The Hanged Man", icon: "🙃", flipped: false },
  { id: 13, name: "Death", icon: "💀", flipped: false },
  { id: 14, name: "Temperance", icon: "🍷", flipped: false },
  { id: 15, name: "The Devil", icon: "😈", flipped: false },
  { id: 16, name: "The Tower", icon: "🗼", flipped: false },
  { id: 17, name: "The Star", icon: "⭐", flipped: false },
  { id: 18, name: "The Moon", icon: "🌙", flipped: false },
  { id: 19, name: "The Sun", icon: "☀️", flipped: false },
  { id: 20, name: "Judgement", icon: "📯", flipped: false },
  { id: 21, name: "The World", icon: "🌍", flipped: false },
  { id: 22, name: "Ace of Wands", icon: "🔥", flipped: false },
  { id: 23, name: "Two of Wands", icon: "🔥", flipped: false },
  { id: 24, name: "Three of Wands", icon: "🔥", flipped: false },
  { id: 25, name: "Four of Wands", icon: "🔥", flipped: false },
  { id: 26, name: "Five of Wands", icon: "🔥", flipped: false },
  { id: 27, name: "Six of Wands", icon: "🔥", flipped: false },
  { id: 28, name: "Seven of Wands", icon: "🔥", flipped: false },
  { id: 29, name: "Eight of Wands", icon: "🔥", flipped: false },
  { id: 30, name: "Nine of Wands", icon: "🔥", flipped: false },
  { id: 31, name: "Ten of Wands", icon: "🔥", flipped: false },
  { id: 32, name: "Page of Wands", icon: "🔥", flipped: false },
  { id: 33, name: "Knight of Wands", icon: "🔥", flipped: false },
  { id: 34, name: "Queen of Wands", icon: "🔥", flipped: false },
  { id: 35, name: "King of Wands", icon: "🔥", flipped: false },
  { id: 36, name: "Ace of Cups", icon: "💧", flipped: false },
  { id: 37, name: "Two of Cups", icon: "💧", flipped: false },
  { id: 38, name: "Three of Cups", icon: "💧", flipped: false },
  { id: 39, name: "Four of Cups", icon: "💧", flipped: false },
  { id: 40, name: "Five of Cups", icon: "💧", flipped: false },
  { id: 41, name: "Six of Cups", icon: "💧", flipped: false },
  { id: 42, name: "Seven of Cups", icon: "💧", flipped: false },
  { id: 43, name: "Eight of Cups", icon: "💧", flipped: false },
  { id: 44, name: "Nine of Cups", icon: "💧", flipped: false },
  { id: 45, name: "Ten of Cups", icon: "💧", flipped: false },
  { id: 46, name: "Page of Cups", icon: "💧", flipped: false },
  { id: 47, name: "Knight of Cups", icon: "💧", flipped: false },
  { id: 48, name: "Queen of Cups", icon: "💧", flipped: false },
  { id: 49, name: "King of Cups", icon: "💧", flipped: false },
  { id: 50, name: "Ace of Swords", icon: "⚔️", flipped: false },
  { id: 51, name: "Two of Swords", icon: "⚔️", flipped: false },
  { id: 52, name: "Three of Swords", icon: "⚔️", flipped: false },
  { id: 53, name: "Four of Swords", icon: "⚔️", flipped: false },
  { id: 54, name: "Five of Swords", icon: "⚔️", flipped: false },
  { id: 55, name: "Six of Swords", icon: "⚔️", flipped: false },
  { id: 56, name: "Seven of Swords", icon: "⚔️", flipped: false },
  { id: 57, name: "Eight of Swords", icon: "⚔️", flipped: false },
  { id: 58, name: "Nine of Swords", icon: "⚔️", flipped: false },
  { id: 59, name: "Ten of Swords", icon: "⚔️", flipped: false },
  { id: 60, name: "Page of Swords", icon: "⚔️", flipped: false },
  { id: 61, name: "Knight of Swords", icon: "⚔️", flipped: false },
  { id: 62, name: "Queen of Swords", icon: "⚔️", flipped: false },
  { id: 63, name: "King of Swords", icon: "⚔️", flipped: false },
  { id: 64, name: "Ace of Pentacles", icon: "🪙", flipped: false },
  { id: 65, name: "Two of Pentacles", icon: "🪙", flipped: false },
  { id: 66, name: "Three of Pentacles", icon: "🪙", flipped: false },
  { id: 67, name: "Four of Pentacles", icon: "🪙", flipped: false },
  { id: 68, name: "Five of Pentacles", icon: "🪙", flipped: false },
  { id: 69, name: "Six of Pentacles", icon: "🪙", flipped: false },
  { id: 70, name: "Seven of Pentacles", icon: "🪙", flipped: false },
  { id: 71, name: "Eight of Pentacles", icon: "🪙", flipped: false },
  { id: 72, name: "Nine of Pentacles", icon: "🪙", flipped: false },
  { id: 73, name: "Ten of Pentacles", icon: "🪙", flipped: false },
  { id: 74, name: "Page of Pentacles", icon: "🪙", flipped: false },
  { id: 75, name: "Knight of Pentacles", icon: "🪙", flipped: false },
  { id: 76, name: "Queen of Pentacles", icon: "🪙", flipped: false },
  { id: 77, name: "King of Pentacles", icon: "🪙", flipped: false },
];

const drawn = ref<Card[]>([]);
const status = ref<{ msg: string; type: string } | null>(null);
const hasDrawn = computed(() => drawn.value.length === 3);
const allFlipped = computed(() => drawn.value.every((c) => c.flipped));
const readingsCount = ref(0);
const contractHash = ref<string | null>(null);
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

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) throw new Error(t("contractUnavailable"));
  return contractHash.value;
};

const draw = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("drawingCards"), type: "loading" };
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractHash();

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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  position: relative;
  background: #fff;
}

.cosmic-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.1;
  overflow: hidden;
}

.star {
  position: absolute;
  font-size: 24px;
}
.star-1 { top: 10%; left: 15%; }
.star-2 { top: 20%; right: 20%; }
.star-3 { bottom: 10%; left: 10%; }
.star-4 { bottom: 15%; right: 15%; }
.moon-decoration {
  position: absolute;
  top: 5%;
  right: 10%;
  font-size: 60px;
}

.status-msg {
  text-align: center;
  padding: $space-4;
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  font-style: italic;
  &.success {
    background: var(--neo-green);
    color: black;
  }
  &.error {
    background: #ff7e7e;
    color: black;
  }
  &.loading {
    background: #ffde59;
    color: black;
  }
}

.mystical-card {
  border: 4px solid black;
  box-shadow: 12px 12px 0 black;
  background: white;
  padding: $space-4;
}

.question-input {
  margin-bottom: $space-6;
}

.spread-labels {
  display: flex;
  justify-content: space-around;
  margin-bottom: $space-4;
}

.spread-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: black;
  color: white;
  padding: 4px 12px;
  border: 2px solid black;
  font-style: italic;
  transform: skew(-10deg);
}

.cards-row {
  display: flex;
  justify-content: center;
  gap: $space-4;
  margin-bottom: $space-8;
}

.tarot-card {
  width: 100px;
  height: 160px;
  background: #f0f0f0;
  border: 4px solid black;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 6px 6px 0 black;

  &.flipped {
    background: white;
    border-color: black;
    box-shadow: 10px 10px 0 #cc99ff;
    transform: translateY(-8px);
  }
  &:not(.flipped):hover {
    transform: scale(1.05) rotate(2deg);
    background: #e0e0e0;
  }
}

.card-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-back-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.pattern-center {
  font-size: 44px;
}

.card-face {
  font-size: 60px;
  display: block;
}
.card-name {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  text-align: center;
  color: black;
  padding: 6px;
  background: #cc99ff;
  border-top: 3px solid black;
  border-bottom: 3px solid black;
  width: 100%;
  margin-top: 8px;
  font-style: italic;
}

.reading-card {
  border: 4px solid black;
  box-shadow: 12px 12px 0 black;
  background: #cc99ff;
}
.fortune-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-6;
  padding: $space-6;
}
.fortune-icon {
  font-size: 64px;
}
.reading-text {
  font-family: $font-mono;
  font-size: 16px;
  font-weight: $font-weight-black;
  text-align: center;
  display: block;
  line-height: 1.4;
  text-transform: uppercase;
}

.mystical-divider {
  color: black;
  font-weight: $font-weight-black;
  letter-spacing: 6px;
  font-size: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-6 0;
  border-bottom: 4px solid black;
  align-items: center;
  &:last-child {
    border-bottom: none;
  }
}

.stat-label {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: black;
}
.stat-value {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 18px;
  color: black;
  background: #ffde59;
  padding: 4px 12px;
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
  font-style: italic;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
