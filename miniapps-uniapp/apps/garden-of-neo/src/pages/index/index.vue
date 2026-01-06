<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Garden Tab -->
    <view v-if="activeTab === 'garden'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('yourGarden')" variant="success" class="garden-card-brutal">
        <view class="garden-container-brutal">
          <view class="garden-grid-brutal">
            <view
              v-for="plot in plots"
              :key="plot.id"
              class="plot-brutal"
              :class="[{ empty: !plot.plant }, plot.plant ? getGrowthStage(plot.plant.growth) : '']"
              @click="selectPlot(plot)"
            >
              <view v-if="plot.plant" class="plant-box-brutal">
                <text class="plant-icon-brutal" :class="{ ready: plot.plant.growth >= 100 }">
                  {{ plot.plant.icon }}
                </text>
                <view v-if="plot.plant.growth >= 100" class="ready-sticker">READY</view>
              </view>
              <text v-else class="empty-icon-brutal">🕳️</text>
              <view v-if="plot.plant" class="growth-label-brutal">
                <text class="growth-text-brutal">{{ Math.floor(plot.plant.growth) }}%</text>
              </view>
            </view>
          </view>
        </view>
      </NeoCard>

      <NeoCard :title="t('availableSeeds')" class="mb-4">
        <view class="seeds-list">
          <view v-for="seed in seeds" :key="seed.id" class="seed-item-neo" @click="plantSeed(seed)">
            <view class="seed-icon-wrapper">
              <text class="seed-icon">{{ seed.icon }}</text>
            </view>
            <view class="seed-info">
              <text class="seed-name font-bold">{{ seed.name }}</text>
              <text class="seed-time text-xs opacity-60">⏱ {{ seed.growTime }}{{ t("hoursToGrow") }}</text>
            </view>
            <view class="seed-price-tag-neo">
              <text class="seed-price font-black">{{ seed.price }}</text>
              <text class="seed-currency text-xs">GAS</text>
            </view>
          </view>
        </view>
      </NeoCard>

      <NeoCard :title="t('actions')" class="mb-4">
        <view class="action-btns-neo flex gap-3">
          <NeoButton variant="primary" size="md" block :loading="isBusy" @click="refreshGarden">
            🔄 {{ isBusy ? t("refreshing") : t("refreshStatus") }}
          </NeoButton>
          <NeoButton variant="secondary" size="md" block :disabled="isBusy" @click="harvestAll">
            🌾 {{ isHarvesting ? t("harvesting") : t("harvestReady") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content">
      <NeoCard :title="t('gardenStats')">
        <NeoStats :stats="statsData" />
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoButton, NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Garden of Neo", zh: "Neo花园" },
  subtitle: { en: "Grow and trade virtual garden NFTs", zh: "种植和交易虚拟花园NFT" },
  garden: { en: "Garden", zh: "花园" },
  stats: { en: "Stats", zh: "统计" },
  yourGarden: { en: "Your Garden", zh: "你的花园" },
  availableSeeds: { en: "Available Seeds", zh: "可用种子" },
  hoursToGrow: { en: "blocks to mature", zh: "区块成熟" },
  actions: { en: "Actions", zh: "操作" },
  refreshStatus: { en: "Refresh Status", zh: "刷新状态" },
  refreshing: { en: "Refreshing...", zh: "刷新中..." },
  harvesting: { en: "Harvesting...", zh: "收获中..." },
  plantFee: { en: "Plant fee: 0.1 GAS", zh: "种植费用：0.1 GAS" },
  harvestReady: { en: "Harvest Ready Plants", zh: "收获成熟植物" },
  gardenStats: { en: "Garden Stats", zh: "花园统计" },
  plants: { en: "Plants", zh: "植物" },
  ready: { en: "Ready", zh: "成熟" },
  harvested: { en: "Harvested", zh: "已收获" },
  noEmptyPlots: { en: "No empty plots available", zh: "没有空闲地块" },
  plantingSeed: { en: "Planting seed...", zh: "种植中..." },
  planted: { en: "planted!", zh: "已种植！" },
  harvested2: { en: "Harvested", zh: "已收获" },
  harvestedPlants: { en: "plants!", zh: "株植物！" },
  noReady: { en: "No plants ready to harvest", zh: "没有可收获的植物" },
  error: { en: "Error", zh: "错误" },
  connectWallet: { en: "Connect wallet", zh: "连接钱包" },
  missingContract: { en: "Contract not configured", zh: "合约未配置" },
  failedToLoad: { en: "Failed to load garden", zh: "加载花园失败" },
  harvestSuccess: { en: "Plant harvested", zh: "植物已收获" },
  plantSuccess: { en: "Seed planted", zh: "种子已种植" },
  seedFire: { en: "Fire Seed", zh: "火种" },
  seedIce: { en: "Ice Seed", zh: "冰种" },
  seedEarth: { en: "Earth Seed", zh: "土种" },
  seedWind: { en: "Wind Seed", zh: "风种" },
  seedLight: { en: "Light Seed", zh: "光种" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Virtual garden where plants grow with blockchain activity",
    zh: "植物随区块链活动生长的虚拟花园",
  },
  docDescription: {
    en: "Garden of Neo is a blockchain-powered virtual garden. Plant elemental seeds, watch them grow as blocks are mined, and harvest mature plants for rewards.",
    zh: "Neo 花园是一个区块链驱动的虚拟花园。种植元素种子，随着区块挖掘观察它们生长，收获成熟植物获得奖励。",
  },
  step1: { en: "Connect your wallet.", zh: "连接钱包。" },
  step2: { en: "Plant seeds and wait for maturity.", zh: "种植并等待成熟。" },
  step3: { en: "Harvest mature plants.", zh: "收获成熟植物。" },
  step4: { en: "Collect rewards and replant for more.", zh: "收集奖励并重新种植获取更多。" },
  feature1Name: { en: "Block-Based Growth", zh: "基于区块的生长" },
  feature1Desc: {
    en: "Plant growth is tied to Neo blockchain activity.",
    zh: "植物生长与 Neo 区块链活动相关联。",
  },
  feature2Name: { en: "Elemental Seeds", zh: "元素种子" },
  feature2Desc: {
    en: "Choose from Fire, Ice, Earth, Wind, and Light seeds.",
    zh: "从火、冰、土、风、光种子中选择。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "garden", icon: "leaf", label: t("garden") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("garden");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-garden-of-neo";
const PLANT_FEE = "0.1";
const GROWTH_BLOCKS = 100;
const MAX_PLOTS = 9;

const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

interface Plant {
  id: number;
  seedType: number;
  icon: string;
  name: string;
  growth: number;
  color: number;
  isMature: boolean;
  harvested: boolean;
}

interface Plot {
  id: number;
  plant: Plant | null;
}

const createEmptyPlots = (): Plot[] =>
  Array.from({ length: MAX_PLOTS }, (_, idx) => ({
    id: idx + 1,
    plant: null,
  }));

const plots = ref<Plot[]>(createEmptyPlots());

const seeds = computed(() => [
  { id: 1, name: t("seedFire"), icon: "🔥", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 2, name: t("seedIce"), icon: "❄️", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 3, name: t("seedEarth"), icon: "🌱", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 4, name: t("seedWind"), icon: "🌬️", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 5, name: t("seedLight"), icon: "✨", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
]);

const status = ref<{ msg: string; type: string } | null>(null);
const totalHarvested = ref(0);
const selectedPlot = ref<Plot | null>(null);
const dataLoading = ref(false);
const contractHash = ref<string | null>(null);
const isHarvesting = ref(false);

const statsData = computed<StatItem[]>(() => [
  { label: t("plants"), value: totalPlants.value, variant: "default" },
  { label: t("ready"), value: readyToHarvest.value, variant: "accent" },
  { label: t("harvested"), value: totalHarvested.value, variant: "success" },
]);

const totalPlants = computed(() => plots.value.filter((p) => p.plant).length);
const readyToHarvest = computed(
  () => plots.value.filter((p) => p.plant && p.plant.isMature && !p.plant.harvested).length,
);
const isBusy = computed(() => isLoading.value || dataLoading.value || isHarvesting.value);

const getGrowthStage = (growth: number): string => {
  if (growth >= 100) return "stage-mature";
  if (growth >= 75) return "stage-blooming";
  if (growth >= 50) return "stage-growing";
  if (growth >= 25) return "stage-sprouting";
  return "stage-seedling";
};

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => {
    status.value = null;
  }, 3000);
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = (await getContractHash()) || null;
  }
  if (!contractHash.value) {
    throw new Error(t("missingContract"));
  }
};

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const seedByType = (seedType: number) => seeds.value.find((seed) => seed.id === seedType);

const buildPlant = async (plantId: number, seedType: number): Promise<Plant> => {
  const statusRes = await invokeRead({
    contractHash: contractHash.value as string,
    operation: "GetPlantStatus",
    args: [{ type: "Integer", value: plantId }],
  });
  const status = parseInvokeResult(statusRes) || [];
  const size = Number(status[0] || 0);
  const color = Number(status[1] || 0);
  const isMature = Boolean(status[2]);
  const harvestedRes = await invokeRead({
    contractHash: contractHash.value as string,
    operation: "IsHarvested",
    args: [{ type: "Integer", value: plantId }],
  });
  const harvested = Boolean(parseInvokeResult(harvestedRes));
  const seed = seedByType(seedType);
  return {
    id: plantId,
    seedType,
    icon: seed?.icon || "🌱",
    name: seed?.name || `Seed #${seedType}`,
    growth: size,
    color,
    isMature,
    harvested,
  };
};

const loadGarden = async () => {
  await ensureContractHash();
  const seedEvents = await listEvents({ app_id: APP_ID, event_name: "PlantSeeded", limit: 100 });
  const harvestEvents = await listEvents({ app_id: APP_ID, event_name: "PlantHarvested", limit: 100 });
  const harvestedIds = new Set<number>();
  harvestEvents.events.forEach((evt: any) => {
    const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
    if (!ownerMatches(values[0])) return;
    const plantId = Number(values[1] || 0);
    if (plantId > 0) harvestedIds.add(plantId);
  });
  totalHarvested.value = harvestedIds.size;

  if (!address.value) {
    plots.value = createEmptyPlots();
    return;
  }

  const userPlants = seedEvents.events
    .map((evt: any) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return {
        owner: values[0],
        plantId: Number(values[1] || 0),
        seedType: Number(values[2] || 0),
      };
    })
    .filter((entry) => entry.plantId > 0 && ownerMatches(entry.owner))
    .sort((a, b) => b.plantId - a.plantId);

  const plants: Plant[] = [];
  for (const plant of userPlants) {
    plants.push(await buildPlant(plant.plantId, plant.seedType));
  }

  const slots = createEmptyPlots();
  plants.slice(0, slots.length).forEach((plant, idx) => {
    slots[idx].plant = plant;
  });
  plots.value = slots;
};

const refreshGarden = async () => {
  if (dataLoading.value) return;
  try {
    dataLoading.value = true;
    await loadGarden();
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  } finally {
    dataLoading.value = false;
  }
};

const selectPlot = (plot: Plot) => {
  selectedPlot.value = plot;
  if (plot.plant && plot.plant.isMature && !plot.plant.harvested) {
    harvestPlant(plot.plant);
  }
};

const plantSeed = async (seed: { id: number; name: string; icon: string; price: string }) => {
  const emptyPlot = plots.value.find((p) => !p.plant);
  if (!emptyPlot) {
    showStatus(t("noEmptyPlots"), "error");
    return;
  }
  if (isLoading.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    await ensureContractHash();
    showStatus(t("plantingSeed"), "loading");
    const payment = await payGAS(seed.price, `plant:${seed.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "Plant",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: seed.id },
        { type: "Integer", value: receiptId },
      ],
    });
    showStatus(t("plantSuccess"), "success");
    await refreshGarden();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const harvestPlant = async (plant: Plant, skipRefresh = false) => {
  if (isHarvesting.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    await ensureContractHash();
    isHarvesting.value = true;
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "Harvest",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: plant.id },
      ],
    });
    showStatus(t("harvestSuccess"), "success");
    if (!skipRefresh) {
      await refreshGarden();
    }
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isHarvesting.value = false;
  }
};

const harvestAll = async () => {
  const harvestTargets = plots.value
    .map((plot) => plot.plant)
    .filter((plant): plant is Plant => Boolean(plant && plant.isMature && !plant.harvested));
  if (!harvestTargets.length) {
    showStatus(t("noReady"), "error");
    return;
  }
  for (const plant of harvestTargets) {
    await harvestPlant(plant, true);
  }
  await refreshGarden();
};

onMounted(async () => {
  if (!address.value) {
    await connect();
  }
  await refreshGarden();
});

watch(address, async () => {
  await refreshGarden();
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
  background-color: white;
}

.garden-card-brutal {
  border: 6px solid black;
  box-shadow: 12px 12px 0 black;
  rotate: -0.5deg;
  margin-bottom: $space-6;
}

.garden-grid-brutal {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
  padding: $space-2;
}

.plot-brutal {
  aspect-ratio: 1;
  background: white;
  border: 4px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all $transition-fast;
  box-shadow: 6px 6px 0 black;
  
  &.empty {
    border-style: solid;
    background: #f0f0f0;
    box-shadow: 2px 2px 0 black;
    opacity: 0.8;
  }
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 black;
  }

  &.stage-seedling { background: #e0fcf2; }
  &.stage-sprouting { background: #c1f9e5; }
  &.stage-growing { background: var(--brutal-yellow); }
  &.stage-blooming { background: #ff7eb3; }
  &.stage-mature { background: var(--neo-green); }
}

.plant-icon-brutal {
  font-size: 48px;
  &.ready {
    animation: brutal-bounce 0.5s infinite;
  }
}

@keyframes brutal-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
}

.ready-sticker {
  position: absolute;
  top: -10px;
  right: -10px;
  background: black;
  color: var(--neo-green);
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border: 2px solid black;
  rotate: 15deg;
  box-shadow: 2px 2px 0 var(--neo-green);
}

.growth-label-brutal {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: black;
  padding: 1px 4px;
}
.growth-text-brutal {
  color: white;
  font-size: 10px;
  font-weight: 900;
  font-family: $font-mono;
}

.seeds-list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.seed-item-neo {
  display: flex;
  align-items: center;
  gap: $space-6;
  padding: $space-4;
  background: white;
  border: 4px solid black;
  cursor: pointer;
  transition: all $transition-fast;
  box-shadow: 8px 8px 0 black;
  &:active {
    transform: translate(3px, 3px);
    box-shadow: 3px 3px 0 black;
  }
}

.seed-icon-wrapper {
  width: 64px;
  height: 64px;
  background: #f0f0f0;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  rotate: -5deg;
}

.seed-icon { font-size: 32px; }
.seed-info { flex: 1; }
.seed-name { font-size: 18px; font-weight: 900; text-transform: uppercase; font-style: italic; }
.seed-time { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-top: 4px; display: block; background: black; color: white; padding: 2px 6px; align-self: flex-start; }

.seed-price-tag-neo {
  background: var(--brutal-yellow);
  color: black;
  padding: $space-4;
  border: 3px solid black;
  box-shadow: 4px 4px 0 black;
  rotate: 3deg;
}

.seed-price { font-size: 20px; font-weight: 900; line-height: 1; }
.seed-currency { font-size: 12px; font-weight: 900; }

.action-btns-neo {
  display: flex;
  gap: $space-4;
}

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
