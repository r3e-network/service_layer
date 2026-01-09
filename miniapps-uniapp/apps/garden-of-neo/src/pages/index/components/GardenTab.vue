<template>
  <view class="tab-container">
    <NeoCard v-if="localStatus" :variant="localStatus.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
      <text class="status-text font-bold uppercase">{{ localStatus.msg }}</text>
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
              <view v-if="plot.plant.growth >= 100" class="ready-sticker">{{ t("ready") }}</view>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { NeoButton, NeoCard } from "@/shared/components";

const props = defineProps<{
  t: (key: string) => string;
  contractHash: string | null;
  ensureContractHash: () => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "update:stats", stats: { totalPlants: number; readyToHarvest: number; totalHarvested: number }): void;
}>();

const APP_ID = "miniapp-garden-of-neo";
const PLANT_FEE = "0.1";
const GROWTH_BLOCKS = 100;
const MAX_PLOTS = 9;

const { address, connect, invokeRead, invokeContract } = useWallet();
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

const createEmptyPlots = (): Plot[] => Array.from({ length: MAX_PLOTS }, (_, idx) => ({ id: idx + 1, plant: null }));

const plots = ref<Plot[]>(createEmptyPlots());

const seeds = computed(() => [
  { id: 1, name: props.t("seedFire"), icon: "🔥", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 2, name: props.t("seedIce"), icon: "❄️", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 3, name: props.t("seedEarth"), icon: "🌱", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 4, name: props.t("seedWind"), icon: "🌬️", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
  { id: 5, name: props.t("seedLight"), icon: "✨", price: PLANT_FEE, growTime: GROWTH_BLOCKS },
]);

const localStatus = ref<{ msg: string; type: string } | null>(null);
const totalHarvested = ref(0);
const selectedPlot = ref<Plot | null>(null);
const dataLoading = ref(false);
const isHarvesting = ref(false);

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
  localStatus.value = { msg, type };
  setTimeout(() => {
    localStatus.value = null;
  }, 3000);
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
    contractHash: props.contractHash!,
    operation: "GetPlantStatus",
    args: [{ type: "Integer", value: plantId }],
  });
  const status = parseInvokeResult(statusRes) || [];
  const size = Number(status[0] || 0);
  const color = Number(status[1] || 0);
  const isMature = Boolean(status[2]);

  const harvestedRes = await invokeRead({
    contractHash: props.contractHash!,
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
  await props.ensureContractHash();
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
    emitUpdateStats();
    return;
  }

  const userPlants = seedEvents.events
    .map((evt: any) => {
      const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
      return { owner: values[0], plantId: Number(values[1] || 0), seedType: Number(values[2] || 0) };
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
  emitUpdateStats();
};

function emitUpdateStats() {
  emit("update:stats", {
    totalPlants: totalPlants.value,
    readyToHarvest: readyToHarvest.value,
    totalHarvested: totalHarvested.value,
  });
}

const refreshGarden = async () => {
  if (dataLoading.value) return;
  try {
    dataLoading.value = true;
    await loadGarden();
  } catch (e: any) {
    showStatus(e.message || props.t("failedToLoad"), "error");
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
    showStatus(props.t("noEmptyPlots"), "error");
    return;
  }
  if (isBusy.value) return;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(props.t("connectWallet"));
    await props.ensureContractHash();

    showStatus(props.t("plantingSeed"), "loading");
    const payment = await payGAS(seed.price, `plant:${seed.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error("Missing payment receipt");

    await invokeContract({
      scriptHash: props.contractHash!,
      operation: "Plant",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: seed.id },
        { type: "Integer", value: receiptId },
      ],
    });
    showStatus(props.t("plantSuccess"), "success");
    await refreshGarden();
  } catch (e: any) {
    showStatus(e.message || props.t("error"), "error");
  }
};

const harvestPlant = async (plant: Plant, skipRefresh = false) => {
  if (isHarvesting.value) return;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(props.t("connectWallet"));
    await props.ensureContractHash();

    isHarvesting.value = true;
    await invokeContract({
      scriptHash: props.contractHash!,
      operation: "Harvest",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: plant.id },
      ],
    });
    showStatus(props.t("harvestSuccess"), "success");
    if (!skipRefresh) await refreshGarden();
  } catch (e: any) {
    showStatus(e.message || props.t("error"), "error");
  } finally {
    isHarvesting.value = false;
  }
};

const harvestAll = async () => {
  const harvestTargets = plots.value
    .map((plot) => plot.plant)
    .filter((plant): plant is Plant => Boolean(plant && plant.isMature && !plant.harvested));

  if (!harvestTargets.length) {
    showStatus(props.t("noReady"), "error");
    return;
  }
  for (const plant of harvestTargets) {
    await harvestPlant(plant, true);
  }
  await refreshGarden();
};

onMounted(async () => {
  if (address.value) {
    await refreshGarden();
  }
});

watch(address, async () => {
  await refreshGarden();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-container {
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  background-color: var(--bg-card, white);
  color: var(--text-primary, black);
}

.garden-card-brutal {
  border: 6px solid var(--border-color, black);
  box-shadow: 12px 12px 0 var(--shadow-color, black);
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
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all $transition-fast;
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  color: var(--text-primary, black);

  &.empty {
    border-style: solid;
    background: var(--bg-elevated, #f0f0f0);
    box-shadow: 2px 2px 0 var(--shadow-color, black);
    opacity: 0.8;
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--shadow-color, black);
  }

  &.stage-seedling {
    background: #e0fcf2;
  }
  &.stage-sprouting {
    background: #c1f9e5;
  }
  &.stage-growing {
    background: var(--brutal-yellow);
  }
  &.stage-blooming {
    background: #ff7eb3;
  }
  &.stage-mature {
    background: var(--neo-green);
  }
}

.plant-icon-brutal {
  font-size: 48px;
  &.ready {
    animation: brutal-bounce 0.5s infinite;
  }
}

@keyframes brutal-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
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
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  cursor: pointer;
  transition: all $transition-fast;
  box-shadow: 8px 8px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
  &:active {
    transform: translate(3px, 3px);
    box-shadow: 3px 3px 0 var(--shadow-color, black);
  }
}

.seed-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--bg-elevated, #f0f0f0);
  border: 3px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  rotate: -5deg;
}

.seed-icon {
  font-size: 32px;
}
.seed-info {
  flex: 1;
}
.seed-name {
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
}
.seed-time {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 4px;
  display: block;
  background: black;
  color: white;
  padding: 2px 6px;
  align-self: flex-start;
}

.seed-price-tag-neo {
  background: var(--brutal-yellow);
  color: black;
  padding: $space-4;
  border: 3px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);
  rotate: 3deg;
}

.seed-price {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}
.seed-currency {
  font-size: 12px;
  font-weight: 900;
}

.action-btns-neo {
  display: flex;
  gap: $space-4;
}
</style>
