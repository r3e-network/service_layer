<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Games Tab (Main) -->
    <view v-if="activeTab === 'game'" class="tab-content scrollable">
      
      <!-- Unscratched Tickets Reminder -->
      <view v-if="unscratchedTickets.length > 0" class="mb-6 px-1">
        <NeoCard variant="accent" class="border-gold">
          <view class="flex justify-between items-center">
            <view>
              <text class="font-bold text-lg mb-1">{{ t("ticketsWaiting") }}</text>
              <text class="text-sm opacity-80">{{ t("ticketsWaitingDesc", { count: unscratchedTickets.length }) }}</text>
            </view>
            <NeoButton size="sm" variant="primary" @click="playUnscratched(unscratchedTickets[0])">
              {{ t("playNow") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <view class="grid-layout">
        <NeoCard 
          v-for="game in instantTypes" 
          :key="game.key" 
          :variant="getCardVariant(game.price)"
          class="game-card h-full relative overflow-hidden group"
          :class="{'border-gold': game.price >= 3}"
        >
          <!-- Shiny hover effect (simulated via CSS in NeoCard but explicit here gives more control) -->
          
          <view class="game-header text-center mb-2 z-10 relative">
            <text class="game-title text-xl font-bold block mb-1" :style="{ color: game.color, textShadow: `0 0 15px ${game.color}40` }">
              {{ game.name }}
            </text>
            <text class="game-price text-xs font-bold px-2 py-0.5 rounded-full bg-white/10" :style="{ color: game.color }">
              {{ game.priceDisplay }}
            </text>
          </view>
          
          <!-- Premium Ticket Visual -->
          <view class="game-visual mb-4 relative h-28 rounded-lg overflow-hidden flex items-center justify-center my-3 bg-black/20">
            <!-- Dynamic Gradient Background -->
            <view class="absolute inset-0 opacity-20" :style="{ background: `linear-gradient(135deg, ${game.color} 0%, transparent 100%)` }" />
            
            <!-- Icon Stack -->
            <view class="relative z-10 flex flex-col items-center transform transition-transform group-hover:scale-110">
               <!-- Main Icon -->
               <AppIcon name="ticket" :size="48" :style="{ color: game.color }" class="mb-1 drop-shadow-md" />
               <!-- Tier Label -->
               <text class="text-[10px] font-black uppercase tracking-widest opacity-60" :style="{ color: game.color }">
                 {{ game.key.replace('neo-', '') }}
               </text>
            </view>
            
            <!-- Decorative Elements -->
            <view class="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20" :style="{ background: game.color }" />
            <view class="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-10" :style="{ background: game.color }" />
          </view>

          <view class="game-stats mb-4 text-center z-10 relative">
             <text class="block text-[10px] uppercase opacity-50 mb-1 tracking-wider">{{ t("maxPrize") }}</text>
             <text class="block text-2xl font-black text-white glow-text leading-none">
               {{ game.maxJackpotDisplay }}
             </text>
          </view>

          <NeoButton 
            class="w-full z-10 relative" 
            :variant="getButtonVariant(game.price)"
            :loading="isLoading && buyingType === game.type"
            :disabled="isLoading"
            @click="handleBuy(game)"
          >
            {{ t("buyTicket") }}
          </NeoButton>

          <text class="text-center text-[10px] mt-3 opacity-40 block">{{ game.description }}</text>
        </NeoCard>
      </view>
    </view>

    <!-- Winners Tab -->
    <view v-if="activeTab === 'winners'" class="tab-content scrollable">
       <NeoCard variant="erobo">
        <view class="winners-list">
          <text v-if="winners.length === 0" class="empty-text text-center text-glass py-8">{{ t("noWinners") }}</text>
          <view v-for="(w, i) in winners" :key="i" class="winner-item glass-panel mb-2 p-3 flex justify-between items-center rounded-lg bg-white/5">
            <view class="flex items-center gap-3">
              <view class="winner-medal w-8 h-8 flex items-center justify-center rounded-full bg-black/20">
                <text>{{ i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🎖️" }}</text>
              </view>
              <view>
                 <text class="block text-sm font-bold">{{ shortenAddress(w.address) }}</text>
                 <text class="block text-xs opacity-60">Round #{{ w.round }}</text>
              </view>
            </view>
            <text class="text-green-400 font-bold">{{ formatNum(w.prize) }} GAS</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-grid mb-6 grid grid-cols-2 gap-4">
        <NeoCard variant="erobo-neo" class="stat-box text-center">
          <text class="block text-2xl font-bold mb-1">{{ totalTickets }}</text>
          <text class="block text-xs opacity-60">{{ t("totalTickets") }}</text>
        </NeoCard>
        <NeoCard variant="erobo" class="stat-box text-center">
           <text class="block text-2xl font-bold mb-1 text-gold">{{ formatNum(prizePool) }}</text>
           <text class="block text-xs opacity-60">{{ t("totalPaidOut") }}</text>
        </NeoCard>
      </view>
      
      <NeoCard variant="erobo" class="p-4">
        <text class="section-title block mb-4 font-bold border-b border-white/10 pb-2">{{ t("yourStats") }}</text>
        <view class="flex justify-between mb-2">
          <text class="opacity-80">{{ t("ticketsBought") }}</text>
          <text class="font-bold">{{ userTickets }}</text>
        </view>
        <view class="flex justify-between">
          <text class="opacity-80">{{ t("totalWinnings") }}</text>
          <text class="font-bold text-green-400">{{ formatNum(userWinnings) }} GAS</text>
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

    <!-- Scratch Modal -->
    <ScratchModal 
      v-if="activeTicket"
      :is-open="!!activeTicket"
      :type-info="activeTicketTypeInfo"
      :ticket-id="activeTicket.id"
      :on-reveal="onReveal"
      @close="closeModal"
    />

    <Fireworks :active="showFireworks" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useEvents } from "@neo/uniapp-sdk";
import { formatNumber, formatAddress } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoButton, NeoCard, NeoStats } from "@/shared/components";
import Fireworks from "@/shared/components/Fireworks.vue";
import ScratchModal from "./components/ScratchModal.vue";
import { useLotteryTypes, LotteryType, type LotteryTypeInfo } from "../../shared/composables/useLotteryTypes";
import { useScratchCard, type ScratchTicket } from "../../shared/composables/useScratchCard";

const { t } = useI18n();

// Core Composables
const { instantTypes, getLotteryType } = useLotteryTypes();
  const { 
    buyTicket, 
    revealTicket, 
    loadPlayerTickets, 
    unscratchedTickets, 
    playerTickets,
    isLoading 
  } = useScratchCard();
  const { address, switchChain, chainType, invokeRead, getContractAddress } = useWallet();
  const { list: listEvents } = useEvents();

  const APP_ID = "miniapp-lottery";

// UI State
const activeTab = ref("game");
const buyingType = ref<LotteryType | null>(null);
const activeTicket = ref<ScratchTicket | null>(null);
const showFireworks = ref(false);

const navTabs = computed(() => [
  { id: "game", icon: "game", label: t("game") },
  { id: "winners", icon: "award", label: t("winners") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") }
]);

interface Winner {
  address: string;
  round: number;
  prize: number;
}

  // Computed Data
  const winners = ref<Winner[]>([]);
  const platformStats = ref<{ totalTickets: string; prizePool: string } | null>(null);
  const totalTickets = computed(() => platformStats.value?.totalTickets ?? "0");
  const prizePool = computed(() => platformStats.value?.prizePool ?? "0");

const userTickets = computed(() => playerTickets.value.length);
const userWinnings = computed(() => playerTickets.value.reduce((acc, t) => acc + (t.prize || 0), 0));

const activeTicketTypeInfo = computed(() => {
  if (!activeTicket.value) return instantTypes.value[0]; // Fallback
  return getLotteryType(activeTicket.value.type) || instantTypes.value[0];
});

const docSteps = computed(() => [t('step1'), t('step2'), t('step3'), t('step4')]);
const docFeatures: any[] = [];

// Helper Methods
const formatNum = (n: number | string) => formatNumber(n, 2);
const shortenAddress = (addr: string) => formatAddress(addr);

const getCardVariant = (price: number) => {
  if (price >= 5) return 'erobo-neo'; // Diamond/High tier
  return 'erobo';
};

const getButtonVariant = (price: number) => {
  if (price === 1) return 'primary'; // Bronze
  if (price === 2) return 'secondary'; // Silver
  if (price >= 5) return 'primary'; // High stakes
  return 'primary';
};

const loadPlatformStats = async () => {
  try {
    const contract = await getContractAddress();
    if (!contract) return;
    const res = await invokeRead({
      contractAddress: contract,
      operation: "getPlatformStats",
      args: [],
    });
    const parsed = parseInvokeResult(res);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const stats = parsed as Record<string, unknown>;
      platformStats.value = {
        totalTickets: String(stats.totalTickets ?? stats.TotalTickets ?? "0"),
        prizePool: String(stats.prizePool ?? stats.PrizePool ?? "0"),
      };
    }
  } catch {
  }
};

const loadWinners = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "RoundCompleted", limit: 10 });
    const parsed = (res.events || [])
      .map((evt: any) => {
        const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
        const round = Number(values[0] ?? 0);
        const address = String(values[1] ?? "");
        const prize = Number(values[2] ?? 0);
        if (!address || prize <= 0) return null;
        return { address, round, prize };
      })
      .filter(Boolean) as Winner[];
    winners.value = parsed;
  } catch (e) {
    winners.value = [];
  }
};

// Actions
const handleBuy = async (gameType: LotteryTypeInfo) => {
  if (!address.value) {
    // Prompt connect
    return;
  }
  
  buyingType.value = gameType.type;
  try {
    const result = await buyTicket(gameType.type);
    // Find the new ticket object from the store
    const newTicket = playerTickets.value.find(t => t.id === result.ticketId);
    if (newTicket) {
      activeTicket.value = newTicket;
    }
  } catch {
  } finally {
    buyingType.value = null;
  }
};

const playUnscratched = (ticket: ScratchTicket) => {
  activeTicket.value = ticket;
};

const onReveal = async (ticketId: string) => {
  const res = await revealTicket(ticketId);
  if (res.isWinner) {
    showFireworks.value = true;
    setTimeout(() => showFireworks.value = false, 3000);
  }
  loadPlatformStats();
  loadWinners();
  return res;
};

const closeModal = () => {
  activeTicket.value = null;
};

// Lifecycle
onMounted(() => {
  if (address.value) {
    loadPlayerTickets();
  }
  loadPlatformStats();
  loadWinners();
});
</script>

<style scoped>
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding-bottom: 20px;
}

.game-card {
  transition: transform 0.2s;
}

.game-card:active {
  transform: scale(0.98);
}

.glow-text {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.text-gold {
  color: #fbbf24;
}

.border-gold {
  border: 1px solid rgba(251, 191, 36, 0.4);
}
</style>
