<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
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

    <ActiveProposalsTab
      v-if="activeTab === 'active' && chainType !== 'evm'"
      :proposals="activeProposals"
      :status="status"
      :loading="loadingProposals"
      :voting-power="votingPower"
      :is-candidate="isCandidate"
      :candidate-loaded="candidateLoaded"
      :t="t as any"
      @create="activeTab = 'create'"
      @select="selectProposal"
    />

    <HistoryProposalsTab
      v-if="activeTab === 'history'"
      :proposals="historyProposals"
      :t="t as any"
      @select="selectProposal"
    />

    <CreateProposalTab
      v-if="activeTab === 'create'"
      ref="createTabRef"
      :t="t as any"
      :status="status"
      @submit="createProposal"
    />

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

    <ProposalDetailsModal
      v-if="selectedProposal"
      :proposal="selectedProposal"
      :address="address"
      :is-candidate="isCandidate"
      :has-voted="!!hasVotedMap[selectedProposal.id]"
      :is-voting="isVoting"
      :t="t as any"
      @close="selectedProposal = null"
      @vote="castVote"
      @execute="executeProposal"
    />
    <Fireworks :active="status?.type === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoDoc } from "@/shared/components";
import Fireworks from "../../../../../shared/components/Fireworks.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";
import ActiveProposalsTab from "./components/ActiveProposalsTab.vue";
import HistoryProposalsTab from "./components/HistoryProposalsTab.vue";
import CreateProposalTab from "./components/CreateProposalTab.vue";
import ProposalDetailsModal from "./components/ProposalDetailsModal.vue";

const { t } = useI18n();
const APP_ID = "miniapp-council-governance";

// Detect host URL for API calls (miniapp runs in iframe)
const getApiBase = () => {
  try {
    if (window.parent !== window) {
      const parentOrigin = document.referrer ? new URL(document.referrer).origin : "";
      if (parentOrigin) return parentOrigin;
    }
  } catch {
    // Fallback
  }
  return "";
};
const API_HOST = getApiBase();

const navTabs = computed(() => [
  { id: "active", icon: "vote", label: t("active") },
  { id: "create", icon: "file", label: t("create") },
  { id: "history", icon: "history", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
]);
const activeTab = ref("active");

const { address, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const contractAddress = ref<string | null>(null);
const selectedProposal = ref<Proposal | null>(null);
const status = ref<{ msg: string; type: "success" | "error" | "info" } | null>(null);
const loadingProposals = ref(false);
const candidateLoaded = ref(false);
const isCandidate = ref(false);
const votingPower = ref(0);
const hasVotedMap = ref<Record<number, boolean>>({});
const isVoting = ref(false);
const createTabRef = ref<any>(null);
const currentChainId = ref<"neo-n3-mainnet" | "neo-n3-testnet">("neo-n3-mainnet");

// Detect network from host origin
const detectNetwork = () => {
  try {
    const origin = window.parent !== window ? document.referrer : window.location.origin;
    if (origin.includes("testnet") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      currentChainId.value = "neo-n3-testnet";
    } else {
      currentChainId.value = "neo-n3-mainnet";
    }
  } catch {
    currentChainId.value = "neo-n3-mainnet";
  }
};

const STATUS_ACTIVE = 1;

interface Proposal {
  id: number;
  type: number;
  title: string;
  description: string;
  policyMethod?: string;
  policyValue?: string;
  yesVotes: number;
  noVotes: number;
  expiryTime: number;
  status: number;
}

type VoteChoice = "for" | "against";

const proposals = ref<Proposal[]>([]);
const STATUS_EXPIRED = 5;

const activeProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) === STATUS_ACTIVE));
const historyProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) !== STATUS_ACTIVE));

const resolveStatus = (proposal: Proposal) => {
  if (proposal.status === STATUS_ACTIVE && proposal.expiryTime < Date.now()) {
    return STATUS_EXPIRED;
  }
  return proposal.status;
};

const showStatus = (msg: string, type: "success" | "error" | "info" = "info") => {
  status.value = { msg, type };
  setTimeout(() => {
    status.value = null;
  }, 4000);
};

const ensureContractAddress = async (showMessage = true) => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    if (showMessage) {
      showStatus(t("contractUnavailable"), "error");
    }
    return false;
  }
  return true;
};

const readMethod = async (operation: string, args: any[] = []) => {
  const hasHash = await ensureContractAddress(false);
  if (!hasHash) {
    throw new Error(t("contractUnavailable"));
  }
  const result = await invokeRead({ contractHash: contractAddress.value as string, operation, args });
  return parseInvokeResult(result);
};

const hasVoted = (proposalId: number) => Boolean(hasVotedMap.value[proposalId]);

const selectProposal = async (p: Proposal) => {
  selectedProposal.value = p;
  if (address.value) {
    await refreshHasVoted([p.id]);
  }
};

const castVote = async (proposalId: number, voteType: VoteChoice) => {
  if (isVoting.value) return;
  const proposal = activeProposals.value.find((p) => p.id === proposalId);
  if (!proposal || resolveStatus(proposal) !== STATUS_ACTIVE) return;
  const voter = address.value;
  if (!voter) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!isCandidate.value) {
    showStatus(t("notCandidate"), "error");
    return;
  }
  if (hasVoted(proposalId)) {
    showStatus(t("alreadyVoted"), "error");
    return;
  }
  const hasHash = await ensureContractAddress();
  if (!hasHash) return;

  try {
    isVoting.value = true;
    const support = voteType === "for";
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "vote",
      args: [
        { type: "Hash160", value: voter },
        { type: "Integer", value: proposalId },
        { type: "Boolean", value: support },
      ],
    });
    showStatus(t("voteRecorded"), "success");
    await loadProposals();
    await refreshHasVoted([proposalId]);
    selectedProposal.value = null;
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isVoting.value = false;
  }
};

const createProposal = async (proposalData: any) => {
  const title = proposalData.title.trim();
  const description = proposalData.description.trim();
  if (!title || !description) {
    showStatus(t("fillAllFields"), "error");
    return;
  }
  let policyValueNumber: number | null = null;
  if (proposalData.type === 1) {
    const rawPolicyValue = String(proposalData.policyValue).trim();
    if (!proposalData.policyMethod || !rawPolicyValue) {
      showStatus(t("policyFieldsRequired"), "error");
      return;
    }
    const parsed = Number(rawPolicyValue);
    if (!Number.isFinite(parsed)) {
      showStatus(t("invalidPolicyValue"), "error");
      return;
    }
    policyValueNumber = parsed;
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!isCandidate.value) {
    showStatus(t("notCandidate"), "error");
    return;
  }
  const hasHash = await ensureContractAddress();
  if (!hasHash) return;

  const policyDataS =
    proposalData.type === 1 ? JSON.stringify({ method: proposalData.policyMethod, value: policyValueNumber }) : "";

  try {
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "createProposal",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: proposalData.type },
        { type: "String", value: title },
        { type: "String", value: description },
        { type: "ByteString", value: policyDataS },
        { type: "Integer", value: proposalData.duration },
      ],
    });
    showStatus(t("proposalSubmitted"), "success");
    if (createTabRef.value?.reset) {
      createTabRef.value.reset();
    }
    await loadProposals();
    activeTab.value = "active";
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const executeProposal = async (proposalId: number) => {
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  const hasHash = await ensureContractAddress();
  if (!hasHash) return;

  try {
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "executeProposal",
      args: [{ type: "Integer", value: proposalId }],
    });
    showStatus(t("executed"), "success");
    await loadProposals();
    selectedProposal.value = null;
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const parseProposal = (data: Record<string, any>): Proposal => {
  const policyByteString = String(data.policyData || "");
  let policyMethod: string | undefined;
  let policyValue: string | undefined;
  if (policyByteString) {
    try {
      const parsed = JSON.parse(policyByteString);
      policyMethod = parsed.method;
      policyValue = parsed.value;
    } catch {
      policyValue = policyByteString;
    }
  }

  return {
    id: Number(data.id || 0),
    type: Number(data.type || 0),
    title: String(data.title || ""),
    description: String(data.description || ""),
    policyMethod,
    policyValue,
    yesVotes: Number(data.yesVotes || 0),
    noVotes: Number(data.noVotes || 0),
    expiryTime: Number(data.expiryTime || 0) * 1000,
    status: Number(data.status || 0),
  };
};

const CACHE_KEY = "council_proposals_cache";

const loadProposals = async () => {
  const hasHash = await ensureContractAddress();
  if (!hasHash) return;

  // 1. Load from cache first
  try {
    const cached = uni.getStorageSync(CACHE_KEY);
    if (cached) {
      proposals.value = JSON.parse(cached);
    }
  } catch {
  }

  try {
    loadingProposals.value = true;
    const count = Number((await readMethod("getProposalCount")) || 0);
    const list: Proposal[] = [];

    // Process in parallel to speed up initial load if many proposals exist
    const fetchProposal = async (id: number) => {
      const proposalData = await readMethod("getProposal", [{ type: "Integer", value: id }]);
      if (proposalData) {
        return parseProposal(proposalData);
      }
      return null;
    };

    // Parallel fetch for fresh data
    const results = await Promise.all(Array.from({ length: count }, (_, i) => i + 1).map(fetchProposal));

    list.push(...(results.filter((p) => p !== null) as Proposal[]));
    proposals.value = list.sort((a, b) => b.id - a.id);

    // 2. Save to cache
    uni.setStorageSync(CACHE_KEY, JSON.stringify(proposals.value));
  } catch (e: any) {
    if (proposals.value.length === 0) {
      showStatus(e.message || t("failedToLoadProposals"), "error");
    } else {
    }
  } finally {
    loadingProposals.value = false;
  }
};

const refreshCandidateStatus = async () => {
  if (!address.value) {
    isCandidate.value = false;
    votingPower.value = 0;
    candidateLoaded.value = true;
    return;
  }
  try {
    // Call API to check if address is in top 21 council members
    const res = await uni.request({
      url: `${API_HOST}/api/neo/council-members?chain_id=${currentChainId.value}&address=${address.value}`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      const data = res.data as { isCouncilMember?: boolean; chainId: string };
      isCandidate.value = Boolean(data.isCouncilMember);
      votingPower.value = isCandidate.value ? 1 : 0;
    } else {
      isCandidate.value = false;
      votingPower.value = 0;
    }
  } catch {
    isCandidate.value = false;
    votingPower.value = 0;
  } finally {
    candidateLoaded.value = true;
  }
};

const refreshHasVoted = async (proposalIds?: number[]) => {
  if (!address.value) return;
  const hasHash = await ensureContractAddress(false);
  if (!hasHash) return;
  const currentAddress = address.value;
  const currentHash = contractAddress.value as string;
  const ids = proposalIds ?? proposals.value.map((p) => p.id);
  const updates: Record<number, boolean> = { ...hasVotedMap.value };
  await Promise.all(
    ids.map(async (id) => {
      const res = await invokeRead({
        contractHash: currentHash,
        operation: "hasVoted",
        args: [
          { type: "Hash160", value: currentAddress },
          { type: "Integer", value: id },
        ],
      });
      updates[id] = Boolean(parseInvokeResult(res));
    }),
  );
  hasVotedMap.value = updates;
};

onMounted(async () => {
  detectNetwork();
  await ensureContractAddress(false);
  await loadProposals();
  await refreshCandidateStatus();
  await refreshHasVoted();
});

watch(address, async () => {
  await refreshCandidateStatus();
  await refreshHasVoted();
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

$senate-bg: #f5f5f0;
$senate-gold: #c5a059;
$senate-slate: #2c3e50;
$senate-marble: #e6e6e6;
$senate-font: "Cinzel", serif;

:global(page) {
  background: $senate-bg;
}

.tab-content {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $senate-bg;
  /* Marble texture simulation */
  background-image: 
    url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJ4Ij48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI3gpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4='),
    linear-gradient(to bottom, #ffffff, #f0f0e8);
  min-height: 100vh;
}

/* Senate Component Overrides */
:deep(.neo-card) {
  background: #ffffff !important;
  border: 1px solid #dcdcdc !important;
  border-top: 4px solid $senate-gold !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05) !important;
  border-radius: 2px !important;
  color: $senate-slate !important;
  
  &.variant-danger {
    background: #fff0f0 !important;
    border-color: #e74c3c !important;
    color: #c0392b !important;
  }
}

:deep(.neo-button) {
  font-family: $senate-font !important;
  border-radius: 2px !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: linear-gradient(to bottom, $senate-slate, #1a252f) !important;
    color: $senate-gold !important;
    border: 1px solid $senate-gold !important;
    
    &:active {
      transform: translateY(1px);
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $senate-slate !important;
    color: $senate-slate !important;
  }
}

/* Typography Overrides */
:deep(text), :deep(view) {
  font-family: 'Times New Roman', serif;
}
:deep(.neo-card text.font-bold) {
  font-family: $senate-font !important;
  color: $senate-slate !important;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
