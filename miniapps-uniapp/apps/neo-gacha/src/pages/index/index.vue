<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="chain-warning">
            <text class="chain-warning__title">{{ t("wrongChain") }}</text>
            <text class="chain-warning__desc">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">
              {{ t("switchToNeo") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>
      <NeoCard v-if="status" :variant="status.variant" class="mb-4">
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <!-- Marketplace Tab -->
      <view v-if="activeTab === 'market'" class="tab-content">
        <view v-if="selectedMachine">
          <GachaMachine
            :machine="selectedMachine"
            :is-playing="isPlaying"
            :show-result="showResult"
            :result-item="resultItem"
            :error-message="playError"
            :is-owner="selectedMachine?.ownerHash === walletHash"
            @back="selectedMachine = null"
            @play="playSelectedMachine"
            @close-result="resetResult"
            @buy="buySelectedMachine"
          />
        </view>

        <view v-else class="market-grid">
          <NeoCard variant="erobo-neo" class="hero-banner mb-4">
            <view class="hero-content">
              <text class="hero-title">{{ t("title") }}</text>
              <text class="hero-subtitle">{{ t("heroSubtitle") }}</text>
            </view>
            <text class="hero-icon">💊</text>
          </NeoCard>

          <view v-if="isLoadingMachines" class="loading-state">
            {{ t("loadingMachines") }}
          </view>
          <view v-else-if="marketMachines.length === 0" class="empty-state">
            {{ t("noMachines") }}
          </view>
          <view v-else>
            <NeoCard v-if="recommendedMachines.length" variant="erobo" class="section-card">
              <text class="section-title">{{ t("recommended") }}</text>
              <view class="grid-container">
                <GachaCard
                  v-for="machine in recommendedMachines"
                  :key="machine.id"
                  :machine="machine"
                  @select="selectMachine"
                />
              </view>
              <NeoButton size="sm" variant="secondary" @click="activeTab = 'discover'">
                Browse All
              </NeoButton>
            </NeoCard>

            <view class="ranking-grid">
              <NeoCard variant="erobo" class="section-card">
                <text class="section-title">{{ t("topPlays") }}</text>
                <view class="rank-list">
                  <view v-for="machine in topByPlays" :key="machine.id" class="rank-row">
                    <text class="rank-name">{{ machine.name }}</text>
                    <text class="rank-value">{{ machine.plays }}</text>
                  </view>
                </view>
              </NeoCard>
              <NeoCard variant="erobo" class="section-card">
                <text class="section-title">{{ t("topRevenue") }}</text>
                <view class="rank-list">
                  <view v-for="machine in topByRevenue" :key="machine.id" class="rank-row">
                    <text class="rank-name">{{ machine.name }}</text>
                    <text class="rank-value">{{ formatGas(machine.revenueRaw + machine.salesVolumeRaw) }} GAS</text>
                  </view>
                </view>
              </NeoCard>
            </view>

            <NeoCard v-if="forSaleMachines.length" variant="erobo" class="section-card">
              <text class="section-title">{{ t("forSale") }}</text>
              <view class="grid-container">
                <GachaCard
                  v-for="machine in forSaleMachines"
                  :key="machine.id"
                  :machine="machine"
                  @select="selectMachine"
                />
              </view>
            </NeoCard>

            <NeoCard variant="erobo" class="section-card">
              <text class="section-title">{{ t("allMachines") }}</text>
              <view class="grid-container">
                <GachaCard
                  v-for="machine in marketMachines"
                  :key="machine.id"
                  :machine="machine"
                  @select="selectMachine"
                />
              </view>
            </NeoCard>
          </view>
        </view>
      </view>

      <!-- Discover Tab -->
      <view v-if="activeTab === 'discover'" class="tab-content">
        <NeoCard variant="erobo" class="section-card">
          <NeoInput v-model="searchQuery" :placeholder="t('searchPlaceholder')" />
          <view class="chip-row">
            <NeoButton
              size="sm"
              :variant="selectedCategory === null ? 'primary' : 'secondary'"
              @click="selectedCategory = null"
            >
              All
            </NeoButton>
            <NeoButton
              v-for="category in categories"
              :key="category"
              size="sm"
              :variant="selectedCategory === category ? 'primary' : 'secondary'"
              @click="selectedCategory = category"
            >
              {{ category }}
            </NeoButton>
          </view>
          <view class="chip-row">
            <NeoButton size="sm" :variant="sortMode === 'popular' ? 'primary' : 'secondary'" @click="sortMode = 'popular'">
              {{ t("sortPopular") }}
            </NeoButton>
            <NeoButton size="sm" :variant="sortMode === 'newest' ? 'primary' : 'secondary'" @click="sortMode = 'newest'">
              {{ t("sortNewest") }}
            </NeoButton>
            <NeoButton size="sm" :variant="sortMode === 'priceLow' ? 'primary' : 'secondary'" @click="sortMode = 'priceLow'">
              {{ t("sortPriceLow") }}
            </NeoButton>
            <NeoButton size="sm" :variant="sortMode === 'priceHigh' ? 'primary' : 'secondary'" @click="sortMode = 'priceHigh'">
              {{ t("sortPriceHigh") }}
            </NeoButton>
          </view>
        </NeoCard>

        <view v-if="isLoadingMachines" class="loading-state">
          {{ t("loadingMachines") }}
        </view>
        <view v-else-if="sortedMachines.length === 0" class="empty-state">
          {{ t("noMachines") }}
        </view>
        <view v-else class="grid-container">
          <GachaCard
            v-for="machine in sortedMachines"
            :key="machine.id"
            :machine="machine"
            @select="selectMachine"
          />
        </view>
      </view>

      <!-- Creator Studio Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <CreatorStudio :publishing="isPublishing" @publish="publishMachine" />
      </view>

      <!-- Manage Tab -->
      <view v-if="activeTab === 'manage'" class="tab-content scrollable">
        <NeoCard v-if="!address" variant="erobo" class="section-card">
          <text class="status-text">{{ t("connectWallet") }}</text>
          <NeoButton size="sm" variant="secondary" @click="handleWalletConnect">
            {{ t("wpConnect") }}
          </NeoButton>
        </NeoCard>
        <view v-else-if="ownedMachines.length === 0" class="empty-state">
          {{ t("noOwnedMachines") }}
        </view>
        <view v-else class="manage-list">
          <NeoCard v-for="machine in ownedMachines" :key="machine.id" variant="erobo" class="section-card">
            <view class="manage-header">
              <view>
                <text class="manage-title">{{ machine.name }}</text>
                <text class="manage-sub">{{ machine.category || t("general") }}</text>
              </view>
              <view class="badge-row">
                <text class="badge" :class="{ active: machine.active }">
                  {{ machine.active ? t("statusActive") : t("statusInactive") }}
                </text>
                <text class="badge" :class="{ active: machine.listed }">
                  {{ machine.listed ? t("statusListed") : t("statusHidden") }}
                </text>
                <text v-if="machine.forSale" class="badge sale">{{ t("forSale") }}</text>
              </view>
            </view>

            <view v-if="machine.revenueRaw > 0" class="manage-actions" style="background: rgba(255, 235, 59, 0.2); border: 1px dashed #ffd700;">
              <text style="flex: 1; font-weight: bold; color: #d4a017;">
                {{ t("revenueLabel") }}: {{ formatGas(machine.revenueRaw) }} GAS
              </text>
              <NeoButton
                size="sm"
                variant="primary"
                :loading="actionLoading[`withdrawRevenue:${machine.id}`]"
                @click="withdrawMachineRevenue(machine)"
              >
                {{ t("withdrawRevenue") }}
              </NeoButton>
            </view>

            <view class="manage-actions">
              <NeoInput v-model="getMachineInput(machine).price" :label="t('priceGas')" type="number" />
              <NeoButton
                size="sm"
                variant="primary"
                :loading="actionLoading[`price:${machine.id}`]"
                @click="updateMachinePrice(machine)"
              >
                {{ t("updatePrice") }}
              </NeoButton>
              <NeoButton
                size="sm"
                variant="secondary"
                :loading="actionLoading[`active:${machine.id}`]"
                @click="toggleMachineActive(machine)"
              >
                {{ t("toggleActive") }}
              </NeoButton>
              <NeoButton
                size="sm"
                variant="secondary"
                :loading="actionLoading[`listed:${machine.id}`]"
                @click="toggleMachineListed(machine)"
              >
                {{ t("toggleListed") }}
              </NeoButton>
            </view>

            <view class="manage-actions">
              <NeoInput v-model="getMachineInput(machine).salePrice" :label="t('salePriceGas')" type="number" />
              <NeoButton
                size="sm"
                variant="primary"
                :loading="actionLoading[`sale:${machine.id}`]"
                @click="listMachineForSale(machine)"
              >
                {{ t("listForSale") }}
              </NeoButton>
              <NeoButton
                v-if="machine.forSale"
                size="sm"
                variant="secondary"
                :loading="actionLoading[`cancelSale:${machine.id}`]"
                @click="cancelMachineSale(machine)"
              >
                {{ t("cancelSale") }}
              </NeoButton>
            </view>

            <view class="inventory-grid">
              <view v-for="(item, idx) in machine.items" :key="idx" class="inventory-item">
                <view class="inventory-header">
                  <text class="inventory-name">{{ item.name }}</text>
                  <text class="inventory-stock" v-if="item.assetType === 1">
                    {{ t("stockLabel") }}: {{ item.stockDisplay }}
                  </text>
                  <text class="inventory-stock" v-else>
                    {{ t("tokenCountLabel") }}: {{ item.tokenCount }}
                  </text>
                </view>
                <text class="inventory-meta" v-if="item.assetType === 1">
                  {{ t("prizePerWinLabel") }}: {{ item.amountDisplay }}
                </text>
                <text class="inventory-meta" v-else>
                  {{ t("prizeNftLabel", { tokenId: item.tokenId || t("anyToken") }) }}
                </text>
                <view class="inventory-actions">
                  <NeoInput
                    v-if="item.assetType === 1"
                    v-model="getInventoryInput(machine.id, idx + 1).deposit"
                    :placeholder="t('depositAmountPlaceholder')"
                    type="number"
                  />
                  <NeoInput
                    v-if="item.assetType === 2"
                    v-model="getInventoryInput(machine.id, idx + 1).tokenId"
                    :placeholder="t('tokenIdShortPlaceholder')"
                  />
                  <NeoButton
                    size="sm"
                    variant="primary"
                    :loading="actionLoading[`deposit:${machine.id}:${idx + 1}`]"
                    @click="depositItem(machine, item, idx + 1)"
                  >
                    {{ t("deposit") }}
                  </NeoButton>
                </view>
                <view class="inventory-actions">
                  <NeoInput
                    v-if="item.assetType === 1"
                    v-model="getInventoryInput(machine.id, idx + 1).withdraw"
                    :placeholder="t('withdrawAmountPlaceholder')"
                    type="number"
                  />
                  <NeoInput
                    v-if="item.assetType === 2"
                    v-model="getInventoryInput(machine.id, idx + 1).tokenId"
                    :placeholder="t('tokenIdShortPlaceholder')"
                  />
                  <NeoButton
                    size="sm"
                    variant="secondary"
                    :loading="actionLoading[`withdraw:${machine.id}:${idx + 1}`]"
                    @click="withdrawItem(machine, item, idx + 1)"
                  >
                    {{ t("withdraw") }}
                  </NeoButton>
                </view>
              </view>
            </view>
          </NeoCard>
        </view>
      </view>

      <!-- Docs/About Tab -->
      <view v-if="activeTab === 'docs'" class="tab-content scrollable">
        <NeoDoc
          :title="t('title')"
          :subtitle="t('docSubtitle')"
          :description="t('docDescription')"
          :steps="docSteps"
          :features="docFeatures"
        />
      </view>
    </view>
    <Fireworks :active="showFireworks" :duration="3000" />
    <WalletPrompt
      :visible="showWalletPrompt"
      :message="walletMessage"
      @close="showWalletPrompt = false"
      @connect="handleWalletConnect"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { AppLayout, NeoCard, NeoDoc, NeoButton, NeoInput, WalletPrompt } from "@/shared/components";
import Fireworks from "@/shared/components/Fireworks.vue";
import { useI18n } from "@/composables/useI18n";
import { formatNumber } from "@/shared/utils/format";
import { parseInvokeResult, parseStackItem, normalizeScriptHash, addressToScriptHash } from "@/shared/utils/neo";
import GachaCard from "./components/GachaCard.vue";
import GachaMachine from "./components/GachaMachine.vue";
import CreatorStudio from "./components/CreatorStudio.vue";

const { t } = useI18n();

const navTabs = computed(() => [
  { id: "market", icon: "bag", label: t("market") },
  { id: "discover", icon: "compass", label: t("discover") },
  { id: "create", icon: "edit", label: t("create") },
  { id: "manage", icon: "settings", label: t("manage") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("market");

const APP_ID = "miniapp-neo-gacha";
const { address, connect, invokeRead, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

interface MachineItem {
  name: string;
  probability: number;
  displayProbability: number;
  rarity: string;
  assetType: number;
  assetHash: string;
  amountRaw: number;
  amountDisplay: string;
  tokenId: string;
  stockRaw: number;
  stockDisplay: string;
  tokenCount: number;
  decimals: number;
  available: boolean;
  icon?: string;
}

interface Machine {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string;
  tagsList: string[];
  creator: string;
  creatorHash: string;
  owner: string;
  ownerHash: string;
  price: string;
  priceRaw: number;
  itemCount: number;
  totalWeight: number;
  availableWeight: number;
  plays: number;
  revenue: string;
  revenueRaw: number;
  sales: number;
  salesVolume: string;
  salesVolumeRaw: number;
  createdAt: number;
  lastPlayedAt: number;
  active: boolean;
  listed: boolean;
  banned: boolean;
  locked: boolean;
  forSale: boolean;
  salePrice: string;
  salePriceRaw: number;
  inventoryReady: boolean;
  items: MachineItem[];
  topPrize?: string;
  winRate?: number;
}

interface Status {
  msg: string;
  variant: "danger" | "success" | "warning";
}

const machines = ref<Machine[]>([]);
const selectedMachine = ref<Machine | null>(null);
const isLoadingMachines = ref(false);
const isPublishing = ref(false);
const isPlaying = ref(false);
const status = ref<Status | null>(null);
const playError = ref<string | null>(null);
const showResult = ref(false);
const resultItem = ref<MachineItem | null>(null);
const showFireworks = ref(false);
const contractAddress = ref<string | null>(null);
const showWalletPrompt = ref(false);
const walletMessage = ref<string | null>(null);
const searchQuery = ref("");
const selectedCategory = ref<string | null>(null);
const sortMode = ref("popular");
const machineInputs = ref<Record<string, { price: string; salePrice: string }>>({});
const inventoryInputs = ref<Record<string, { deposit: string; withdraw: string; tokenId: string }>>({});
const actionLoading = ref<Record<string, boolean>>({});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
  { name: t("feature3Name"), desc: t("feature3Desc") },
]);

const marketMachines = computed(() =>
  machines.value.filter((machine) => machine.active && machine.listed && !machine.banned),
);

const categories = computed(() => {
  const set = new Set<string>();
  machines.value.forEach((machine) => {
    if (machine.category) set.add(machine.category);
  });
  return Array.from(set.values());
});

const filteredMachines = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return marketMachines.value.filter((machine) => {
    if (selectedCategory.value && machine.category !== selectedCategory.value) return false;
    if (!query) return true;
    const haystack = [
      machine.name,
      machine.creator,
      machine.owner,
      machine.category,
      machine.tags,
      ...(machine.tagsList || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
});

const sortedMachines = computed(() => {
  const items = [...filteredMachines.value];
  switch (sortMode.value) {
    case "newest":
      return items.sort((a, b) => b.createdAt - a.createdAt);
    case "priceLow":
      return items.sort((a, b) => a.priceRaw - b.priceRaw);
    case "priceHigh":
      return items.sort((a, b) => b.priceRaw - a.priceRaw);
    default:
      return items.sort((a, b) => b.plays - a.plays);
  }
});

const recommendedMachines = computed(() =>
  [...marketMachines.value].sort((a, b) => b.plays - a.plays).slice(0, 4),
);
const topByPlays = computed(() => [...marketMachines.value].sort((a, b) => b.plays - a.plays).slice(0, 5));
const topByRevenue = computed(() =>
  [...marketMachines.value]
    .sort((a, b) => b.revenueRaw + b.salesVolumeRaw - (a.revenueRaw + a.salesVolumeRaw))
    .slice(0, 5),
);

const forSaleMachines = computed(() => machines.value.filter((machine) => machine.forSale && !machine.banned));

const walletHash = computed(() => {
  if (!address.value) return "";
  const scriptHash = addressToScriptHash(address.value as string);
  return normalizeScriptHash(scriptHash);
});

const ownedMachines = computed(() =>
  machines.value.filter((machine) => machine.ownerHash && machine.ownerHash === walletHash.value),
);

const setStatus = (msg: string, variant: Status["variant"]) => {
  status.value = { msg, variant };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const numberFrom = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const formatGas = (raw: number) => formatNumber(raw / 1e8, 2);

const gasInputFromRaw = (raw: number) => {
  if (!Number.isFinite(raw) || raw <= 0) return "0";
  const value = (raw / 1e8).toFixed(8);
  return value.replace(/\.?0+$/, "");
};

const toRawAmount = (value: string, decimals: number) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || decimals < 0) return "0";
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor).toString();
};

const formatTokenAmount = (raw: number, decimals: number) => {
  if (!Number.isFinite(raw) || raw <= 0) return "0";
  const factor = Math.pow(10, decimals);
  const precision = Math.min(4, Math.max(0, decimals));
  return formatNumber(raw / factor, precision);
};

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const toHash160 = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^(0x)?[0-9a-fA-F]{40}$/.test(trimmed)) {
    return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  }
  const scriptHash = addressToScriptHash(trimmed);
  return scriptHash ? `0x${scriptHash}` : "";
};

const toDisplayHash = (value: unknown) => {
  const normalized = normalizeScriptHash(String(value || ""));
  return normalized ? `0x${normalized}` : String(value || "");
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const getMachineInput = (machine: Machine) => {
  if (!machineInputs.value[machine.id]) {
    machineInputs.value[machine.id] = {
      price: gasInputFromRaw(machine.priceRaw),
      salePrice: machine.salePriceRaw > 0 ? gasInputFromRaw(machine.salePriceRaw) : "",
    };
  }
  return machineInputs.value[machine.id];
};

const getInventoryInput = (machineId: string, itemIndex: number) => {
  const key = `${machineId}:${itemIndex}`;
  if (!inventoryInputs.value[key]) {
    inventoryInputs.value[key] = { deposit: "", withdraw: "", tokenId: "" };
  }
  return inventoryInputs.value[key];
};

const setActionLoading = (key: string, value: boolean) => {
  actionLoading.value[key] = value;
};

const isItemAvailable = (item: MachineItem) => {
  if (item.assetType === 1) {
    return item.stockRaw >= item.amountRaw && item.amountRaw > 0;
  }
  if (item.assetType === 2) {
    return item.tokenCount > 0;
  }
  return false;
};

/**
 * Convert hex seed to BigInt for deterministic random selection
 */
const hexToBigInt = (hex: string): bigint => {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  return BigInt("0x" + cleanHex);
};

/**
 * Simulate gacha selection locally using the deterministic seed from contract
 * This mirrors the on-chain CalculateExpectedSelection logic
 */
const simulateGachaSelection = (seed: string, items: MachineItem[]): number => {
  const availableItems = items
    .map((item, idx) => ({ item, index: idx + 1 }))
    .filter(({ item }) => isItemAvailable(item));

  if (availableItems.length === 0) return 0;

  const totalWeight = availableItems.reduce((sum, { item }) => sum + item.probability, 0);
  if (totalWeight <= 0) return 0;

  const rand = hexToBigInt(seed);
  const roll = Number(rand % BigInt(totalWeight));

  let cumulative = 0;
  for (const { item, index } of availableItems) {
    cumulative += item.probability;
    if (roll < cumulative) {
      return index;
    }
  }

  return availableItems[availableItems.length - 1].index;
};

const getItemIcon = (item: MachineItem) => {
  const rarity = String(item.rarity || "").toUpperCase();
  if (rarity === "LEGENDARY") return "👑";
  if (rarity === "EPIC") return "💎";
  if (rarity === "RARE") return "🎁";
  const assetType = Number(item.assetType || 0);
  if (assetType === 2) return "🖼️";
  if (assetType === 1) return "🪙";
  return "📦";
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    setStatus(t("contractUnavailable"), "danger");
  }
  return contractAddress.value;
};

const requestWallet = (message: string) => {
  walletMessage.value = message;
  showWalletPrompt.value = true;
};

const handleWalletConnect = async () => {
  await connect();
  showWalletPrompt.value = false;
  fetchMachines();
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt: any) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const waitForResolved = async (playId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: "PlayResolved", limit: 25 });
    const match = res.events.find((evt: any) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      return String(values[3] ?? "") === String(playId);
    });
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

const fetchMachineItems = async (contract: string, machineId: number, itemCount: number) => {
  const items: MachineItem[] = [];
  for (let index = 1; index <= itemCount; index += 1) {
    const itemRes = await invokeRead({
      scriptHash: contract,
      operation: "getMachineItem",
      args: [
        { type: "Integer", value: String(machineId) },
        { type: "Integer", value: String(index) },
      ],
    });
    const itemMap = parseInvokeResult(itemRes) as Record<string, any> | null;
    if (!itemMap || typeof itemMap !== "object") continue;

    const decimals = numberFrom(itemMap.decimals);
    const amountRaw = numberFrom(itemMap.amount);
    const stockRaw = numberFrom(itemMap.stock);
    const item: MachineItem = {
      name: String(itemMap.name || ""),
      probability: numberFrom(itemMap.weight),
      displayProbability: 0,
      rarity: String(itemMap.rarity || t("rarityCommon")),
      assetType: numberFrom(itemMap.assetType),
      assetHash: toDisplayHash(itemMap.assetHash),
      amountRaw,
      amountDisplay: formatTokenAmount(amountRaw, decimals),
      tokenId: String(itemMap.tokenId || ""),
      stockRaw,
      stockDisplay: formatTokenAmount(stockRaw, decimals),
      tokenCount: numberFrom(itemMap.tokenCount),
      decimals,
      available: false,
    };
    item.icon = getItemIcon(item);
    items.push(item);
  }
  return items;
};

const fetchMachines = async () => {
  isLoadingMachines.value = true;
  try {
    const contract = await ensureContractAddress();
    if (!contract) {
      machines.value = [];
      return;
    }

    const totalRes = await invokeRead({ scriptHash: contract, operation: "totalMachines" });
    const total = numberFrom(parseInvokeResult(totalRes));
    const loaded: Machine[] = [];

    for (let machineId = 1; machineId <= total; machineId += 1) {
      const machineRes = await invokeRead({
        scriptHash: contract,
        operation: "getMachine",
        args: [{ type: "Integer", value: String(machineId) }],
      });
      const machineMap = parseInvokeResult(machineRes) as Record<string, any> | null;
      if (!machineMap || typeof machineMap !== "object" || !machineMap.name) continue;

      const itemCount = numberFrom(machineMap.itemCount);
      const items = await fetchMachineItems(contract, machineId, itemCount);
      const availableItems = items.filter((item) => isItemAvailable(item));
      const availableWeight = availableItems.reduce((sum, item) => sum + item.probability, 0);
      const normalizedItems = items.map((item) => {
        const available = isItemAvailable(item);
        const displayProbability =
          availableWeight > 0 && available ? Number(((item.probability / availableWeight) * 100).toFixed(2)) : 0;
        return {
          ...item,
          available,
          displayProbability,
        };
      });

      const topItem = availableItems.length
        ? availableItems.reduce((prev, curr) => (curr.probability < prev.probability ? curr : prev), availableItems[0])
        : items.length
          ? items[0]
          : null;

      const creatorHash = normalizeScriptHash(String(machineMap.creator || ""));
      const ownerHash = normalizeScriptHash(String(machineMap.owner || ""));
      const salePriceRaw = numberFrom(machineMap.salePrice);
      const revenueRaw = numberFrom(machineMap.revenue);
      const salesVolumeRaw = numberFrom(machineMap.salesVolume);

      loaded.push({
        id: String(machineId),
        name: String(machineMap.name || ""),
        description: String(machineMap.description || ""),
        category: String(machineMap.category || ""),
        tags: String(machineMap.tags || ""),
        tagsList: parseTags(String(machineMap.tags || "")),
        creator: toDisplayHash(machineMap.creator),
        creatorHash,
        owner: toDisplayHash(machineMap.owner),
        ownerHash,
        priceRaw: numberFrom(machineMap.price),
        price: formatGas(numberFrom(machineMap.price)),
        itemCount,
        totalWeight: numberFrom(machineMap.totalWeight),
        availableWeight,
        plays: numberFrom(machineMap.plays),
        revenueRaw,
        revenue: formatGas(revenueRaw),
        sales: numberFrom(machineMap.sales),
        salesVolumeRaw,
        salesVolume: formatGas(salesVolumeRaw),
        createdAt: numberFrom(machineMap.createdAt),
        lastPlayedAt: numberFrom(machineMap.lastPlayedAt),
        active: Boolean(machineMap.active),
        listed: Boolean(machineMap.listed),
        banned: Boolean(machineMap.banned),
        locked: Boolean(machineMap.locked),
        forSale: salePriceRaw > 0,
        salePriceRaw,
        salePrice: salePriceRaw > 0 ? formatGas(salePriceRaw) : "0",
        inventoryReady: availableWeight > 0,
        items: normalizedItems,
        topPrize: topItem?.name || "",
        winRate: topItem?.probability || 0,
      });
    }

    machines.value = loaded;
    if (selectedMachine.value) {
      const updated = loaded.find((machine) => machine.id === selectedMachine.value?.id) || null;
      selectedMachine.value = updated;
    }
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    isLoadingMachines.value = false;
  }
};

const selectMachine = (machine: Machine) => {
  selectedMachine.value = machine;
  playError.value = null;
  resetResult();
};

const resetResult = () => {
  showResult.value = false;
  resultItem.value = null;
};

/**
 * Hybrid Mode Play Flow:
 * 1. Pay GAS and call InitiatePlay -> returns [playId, seed]
 * 2. Simulate selection locally using seed (instant feedback)
 * 3. Call SettlePlay with selected index -> verifies and transfers prize
 *
 * Benefits: ~46% gas savings, instant UI feedback, verifiable fairness
 */
const playSelectedMachine = async () => {
  if (!selectedMachine.value || isPlaying.value) return;
  if (!selectedMachine.value.active || !selectedMachine.value.inventoryReady) {
    playError.value = t("inventoryUnavailable");
    return;
  }
  playError.value = null;
  resetResult();

  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }

  try {
    const contract = await ensureContractAddress();
    if (!contract) return;

    isPlaying.value = true;

    // Phase 1: Pay and initiate play (on-chain)
    const payAmount = gasInputFromRaw(selectedMachine.value.priceRaw);
    const payment = await payGAS(payAmount, `gacha:${selectedMachine.value.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    // Call InitiatePlay - returns [playId, seed] for hybrid mode
    const initiateTx = await invokeContract({
      scriptHash: contract,
      operation: "initiatePlay",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: selectedMachine.value.id },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const initiateTxid = String((initiateTx as any)?.txid || (initiateTx as any)?.txHash || "");
    const initiatedEvent = initiateTxid ? await waitForEvent(initiateTxid, "PlayInitiated") : null;
    if (!initiatedEvent) {
      throw new Error(t("playPending"));
    }

    // Extract playId and seed from PlayInitiated event
    const initiatedValues = Array.isArray((initiatedEvent as any)?.state)
      ? (initiatedEvent as any).state.map(parseStackItem)
      : [];
    const playId = String(initiatedValues[2] ?? "");
    const seed = String(initiatedValues[3] ?? "");
    if (!playId || !seed) {
      throw new Error(t("playPending"));
    }

    // Phase 2: Simulate selection locally (instant feedback)
    const selectedIndex = simulateGachaSelection(seed, selectedMachine.value.items);
    if (selectedIndex <= 0) {
      throw new Error(t("noAvailableItems"));
    }

    // Show result immediately for better UX
    const item = selectedMachine.value.items.find((_, idx) => idx + 1 === selectedIndex) || null;
    resultItem.value = item || {
      name: t("unknownPrize"),
      probability: 0,
      displayProbability: 0,
      rarity: "UNKNOWN",
      assetType: 0,
      assetHash: "",
      amountRaw: 0,
      amountDisplay: "0",
      tokenId: "",
      stockRaw: 0,
      stockDisplay: "0",
      tokenCount: 0,
      decimals: 0,
      available: false,
      icon: "🎁",
    };
    showResult.value = true;
    showFireworks.value = true;

    // Phase 3: Settle play (on-chain verification and transfer)
    const settleTx = await invokeContract({
      scriptHash: contract,
      operation: "settlePlay",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: playId },
        { type: "Integer", value: String(selectedIndex) },
      ],
    });

    const settleTxid = String((settleTx as any)?.txid || (settleTx as any)?.txHash || "");
    if (settleTxid) {
      await waitForEvent(settleTxid, "PlayResolved");
    }

    await fetchMachines();
  } catch (e: any) {
    playError.value = e?.message || t("error");
  } finally {
    isPlaying.value = false;
  }
};

const buySelectedMachine = async () => {
  if (!selectedMachine.value) return;
  await buyMachine(selectedMachine.value);
};

const publishMachine = async (machineData: any) => {
  if (isPublishing.value) return;

  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }

  try {
    const contract = await ensureContractAddress();
    if (!contract) return;

    isPublishing.value = true;
    setStatus(t("publishing"), "warning");

    const priceRaw = toFixed8(machineData.price);
    const createTx = await invokeContract({
      scriptHash: contract,
      operation: "createMachine",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "String", value: machineData.name },
        { type: "String", value: machineData.description || "" },
        { type: "String", value: machineData.category || "" },
        { type: "String", value: machineData.tags || "" },
        { type: "Integer", value: priceRaw },
      ],
    });

    const createTxId = String((createTx as any)?.txid || (createTx as any)?.txHash || "");
    const createdEvent = createTxId ? await waitForEvent(createTxId, "MachineCreated") : null;
    if (!createdEvent) {
      throw new Error(t("createPending"));
    }

    const createdValues = Array.isArray((createdEvent as any)?.state)
      ? (createdEvent as any).state.map(parseStackItem)
      : [];
    const machineId = String(createdValues[1] ?? "");
    if (!machineId) {
      throw new Error(t("createPending"));
    }

    for (const item of machineData.items) {
      const assetTypeValue = item.assetType === "nep11" ? 2 : 1;
      const assetHash = toHash160(item.assetHash);
      if (!assetHash) {
        throw new Error(t("invalidAsset"));
      }
      let amountRaw = "0";
      if (assetTypeValue === 1) {
        let decimals = 8;
        try {
          const decimalsRes = await invokeRead({
            scriptHash: assetHash,
            operation: "decimals",
          });
          decimals = numberFrom(parseInvokeResult(decimalsRes));
        } catch {
          decimals = 8;
        }
        amountRaw = toRawAmount(item.amount, decimals);
      }
      const tokenId = assetTypeValue === 2 ? item.tokenId : "";

      const itemTx = await invokeContract({
        scriptHash: contract,
        operation: "addMachineItem",
        args: [
          { type: "Hash160", value: address.value as string },
          { type: "Integer", value: machineId },
          { type: "String", value: item.name },
          { type: "Integer", value: String(item.probability) },
          { type: "String", value: item.rarity },
          { type: "Integer", value: String(assetTypeValue) },
          { type: "Hash160", value: assetHash },
          { type: "Integer", value: amountRaw },
          { type: "String", value: tokenId },
        ],
      });

      const itemTxId = String((itemTx as any)?.txid || (itemTx as any)?.txHash || "");
      if (itemTxId) {
        await waitForEvent(itemTxId, "MachineItemAdded");
      }
    }

    setStatus(t("publishSuccess"), "success");
    await fetchMachines();
    activeTab.value = "manage";
    selectedMachine.value = null;
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    isPublishing.value = false;
  }
};

const updateMachinePrice = async (machine: Machine) => {
  const input = getMachineInput(machine);
  if (!input.price || !address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `price:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    const priceRaw = toFixed8(input.price);
    await invokeContract({
      scriptHash: contract,
      operation: "updateMachine",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
        { type: "String", value: machine.name },
        { type: "String", value: machine.description || "" },
        { type: "String", value: machine.category || "" },
        { type: "String", value: machine.tags || "" },
        { type: "Integer", value: priceRaw },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const toggleMachineActive = async (machine: Machine) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `active:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    await invokeContract({
      scriptHash: contract,
      operation: "setMachineActive",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
        { type: "Boolean", value: !machine.active },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const toggleMachineListed = async (machine: Machine) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `listed:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    await invokeContract({
      scriptHash: contract,
      operation: "setMachineListed",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
        { type: "Boolean", value: !machine.listed },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const listMachineForSale = async (machine: Machine) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const input = getMachineInput(machine);
  if (!input.salePrice) return;
  const key = `sale:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    const salePriceRaw = toFixed8(input.salePrice);
    await invokeContract({
      scriptHash: contract,
      operation: "listMachineForSale",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
        { type: "Integer", value: salePriceRaw },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const cancelMachineSale = async (machine: Machine) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `cancelSale:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    await invokeContract({
      scriptHash: contract,
      operation: "cancelMachineSale",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const buyMachine = async (machine: Machine) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  if (!machine.forSale || machine.salePriceRaw <= 0) return;
  const key = `buy:${machine.id}`;
  if (actionLoading.value[key]) return;
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    const payment = await payGAS(gasInputFromRaw(machine.salePriceRaw), `gacha-sale:${machine.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));
    await invokeContract({
      scriptHash: contract,
      operation: "buyMachine",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: machine.id },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const depositItem = async (machine: Machine, item: MachineItem, index: number) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `deposit:${machine.id}:${index}`;
  if (actionLoading.value[key]) return;
  const input = getInventoryInput(machine.id, index);
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    if (item.assetType === 1) {
      if (!input.deposit) throw new Error(t("depositAmountRequired"));
      const amountRaw = toRawAmount(input.deposit, item.decimals || 8);
      await invokeContract({
        scriptHash: contract,
        operation: "depositItem",
        args: [
          { type: "Hash160", value: address.value as string },
          { type: "Integer", value: machine.id },
          { type: "Integer", value: String(index) },
          { type: "Integer", value: amountRaw },
        ],
      });
    } else if (item.assetType === 2) {
      const tokenId = input.tokenId || item.tokenId;
      if (!tokenId) throw new Error(t("tokenIdRequired"));
      await invokeContract({
        scriptHash: contract,
        operation: "depositItemToken",
        args: [
          { type: "Hash160", value: address.value as string },
          { type: "Integer", value: machine.id },
          { type: "Integer", value: String(index) },
          { type: "String", value: tokenId },
        ],
      });
    }
    input.deposit = "";
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

const withdrawItem = async (machine: Machine, item: MachineItem, index: number) => {
  if (!address.value) {
    requestWallet(t("connectWallet"));
    return;
  }
  const key = `withdraw:${machine.id}:${index}`;
  if (actionLoading.value[key]) return;
  const input = getInventoryInput(machine.id, index);
  try {
    setActionLoading(key, true);
    const contract = await ensureContractAddress();
    if (!contract) return;
    if (item.assetType === 1) {
      if (!input.withdraw) throw new Error(t("withdrawAmountRequired"));
      const amountRaw = toRawAmount(input.withdraw, item.decimals || 8);
      await invokeContract({
        scriptHash: contract,
        operation: "withdrawItem",
        args: [
          { type: "Hash160", value: address.value as string },
          { type: "Integer", value: machine.id },
          { type: "Integer", value: String(index) },
          { type: "Integer", value: amountRaw },
        ],
      });
    } else if (item.assetType === 2) {
      const tokenId = input.tokenId || item.tokenId || "";
      await invokeContract({
        scriptHash: contract,
        operation: "withdrawItemToken",
        args: [
          { type: "Hash160", value: address.value as string },
          { type: "Integer", value: machine.id },
          { type: "Integer", value: String(index) },
          { type: "String", value: tokenId },
        ],
      });
    }
    input.withdraw = "";
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(key, false);
  }
};

watch(showFireworks, (val) => {
  if (val) {
    setTimeout(() => (showFireworks.value = false), 3000);
  }
});

watch(chainType, () => {
  fetchMachines();
});

watch(address, () => {
  fetchMachines();
});


const withdrawMachineRevenue = async (machine: Machine) => {
  const loadingKey = `withdrawRevenue:${machine.id}`;
  if (actionLoading.value[loadingKey]) return;
  setActionLoading(loadingKey, true);
  try {
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "withdrawMachineRevenue",
      args: [{ type: "Integer", value: machine.id }],
    });
    setStatus(t("revenueClaimed"), "success");
    await fetchMachines();
  } catch (e: any) {
    setStatus(e?.message || t("error"), "danger");
  } finally {
    setActionLoading(loadingKey, false);
  }
};

onMounted(() => {
  fetchMachines();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;

.app-container {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  // Subtle pattern background for Gacha
  background-image: 
    radial-gradient(rgba(244, 114, 182, 0.1) 15%, transparent 16%),
    radial-gradient(rgba(34, 211, 238, 0.1) 15%, transparent 16%);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.market-grid, .grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.section-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 800;
  color: $brutal-pink;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  display: inline-block;
}

.hero-banner {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  margin-bottom: 24px;
  
  .hero-content {
    display: flex;
    flex-direction: column;
  }
  .hero-title {
    font-size: 32px;
    font-weight: 900;
    background: linear-gradient(135deg, $brutal-pink 0%, $brutal-blue 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    line-height: 1.2;
    margin-bottom: 8px;
  }
  .hero-subtitle {
     font-size: 12px;
     font-weight: 700;
     color: var(--text-secondary);
     background: rgba(255,255,255,0.05);
     padding: 4px 8px;
     border-radius: 8px;
  }
}

.hero-icon {
  font-size: 40px;
  animation: bounce 2s infinite ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.status-text {
  font-weight: 700;
  text-align: center;
  color: var(--text-primary);
}

/* Manage List and Inventory */
.manage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.manage-title {
  font-weight: 800;
  font-size: 18px;
  color: var(--text-primary);
}

.manage-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.badge-row {
  display: flex;
  gap: 4px;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  text-transform: uppercase;
  
  &.active {
    background: rgba(0, 229, 153, 0.2);
    color: $neo-green;
  }
  &.sale {
    background: rgba(253, 224, 71, 0.2);
    color: $brutal-yellow;
  }
}

.manage-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 12px;
}

.inventory-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.inventory-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}

.inventory-meta {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.inventory-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.ranking-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
}

.rank-name {
  font-weight: 700;
  color: var(--text-primary);
}
.rank-value {
  font-family: $font-mono;
  font-weight: 700;
  background: rgba(34, 211, 238, 0.2);
  color: $brutal-blue;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 14px;
}

.chain-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  
  &__title {
    font-weight: 700;
    color: #ef4444;
  }
  &__desc {
    font-size: 12px;
    opacity: 0.8;
  }
}
</style>
