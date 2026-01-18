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

    <!-- Vote Tab -->
    <view v-if="activeTab === 'vote' && chainType !== 'evm'" class="tab-content scrollable">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : 'success'"
        class="mb-4 text-center font-bold"
      >
        <text>{{ status.msg }}</text>
      </NeoCard>

      <!-- Candidate List -->
      <CandidateList
        :candidates="candidates"
        :selected-candidate="selectedCandidate"
        :user-voted-public-key="normalizedUserVotedPublicKey"
        :total-votes="totalNetworkVotes"
        :is-loading="candidatesLoading"
        @select="selectCandidate"
        @view-details="openCandidateDetail"
      />

      <!-- Vote Form -->
      <NeoCard variant="erobo">
        <view class="vote-form">
          <NeoCard v-if="selectedCandidate" variant="erobo-neo" flat class="selected-candidate-card glass-panel">
            <text class="selected-label">{{ t("votingFor") }}</text>
            <view class="candidate-badge">
              <text class="candidate-name">{{
                selectedCandidate.name || shortenAddress(selectedCandidate.address)
              }}</text>
              <text class="candidate-key">{{ shortenAddress(selectedCandidate.publicKey) }}</text>
            </view>
          </NeoCard>

          <NeoCard v-else variant="warning" flat class="no-candidate-card">
            <text class="warning-text text-center">{{ t("selectCandidateFirst") }}</text>
          </NeoCard>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :disabled="!selectedCandidate || !address || isLoading"
            :loading="isLoading"
            @click="handleVote"
          >
            {{ t("voteNow") }}
          </NeoButton>

          <view v-if="!address" class="connect-hint">
            <text class="hint-text">{{ t("connectWallet") }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Info Tab -->
    <InfoTab v-if="activeTab === 'info'" :address="address" />

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

    <!-- Candidate Detail Modal -->
    <CandidateDetailModal
      v-if="showDetailModal"
      :candidate="detailCandidate"
      :rank="detailRank"
      :total-votes="totalNetworkVotes"
      :is-user-voted="detailCandidate ? normalizePublicKey(detailCandidate.publicKey) === normalizedUserVotedPublicKey : false"
      :can-vote="!!address && !isLoading"
      :governance-portal-url="governancePortalUrl"
      @close="closeCandidateDetail"
      @vote="handleVoteFromModal"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import type { GovernanceCandidate } from "./utils";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import CandidateList from "./components/CandidateList.vue";
import CandidateDetailModal from "./components/CandidateDetailModal.vue";
import InfoTab from "./components/InfoTab.vue";
import { fetchCandidates } from "./utils";

const { t } = useI18n();

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const NEO_CONTRACT = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";

const { address, connect, invokeContract, invokeRead, chainType, chainId, switchChain } = useWallet() as any;

const navTabs = computed<NavTab[]>(() => [
  { id: "vote", icon: "checkbox", label: t("vote") },
  { id: "info", icon: "info", label: t("info") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("vote");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);

// Candidate state
const candidates = ref<GovernanceCandidate[]>([]);
const selectedCandidate = ref<GovernanceCandidate | null>(null);
const totalNetworkVotes = ref("0");
const blockHeight = ref(0);
const candidatesLoading = ref(false);

// Modal state
const showDetailModal = ref(false);
const detailCandidate = ref<GovernanceCandidate | null>(null);
const detailRank = ref(1);

// User's voted candidate
const userVotedPublicKey = ref<string | null>(null);

const getCacheKey = (network: "mainnet" | "testnet") => `candidate_vote_candidates_cache_${network}`;

const governancePortalUrl = computed(() =>
  chainId.value === "neo-n3-testnet" ? "https://governance.neo.org/tetsnet#/" : "https://governance.neo.org/#/",
);

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const shortenAddress = (addr: string): string => {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const normalizePublicKey = (value: unknown) => String(value || "").replace(/^0x/i, "");

const readCache = (key: string) => {
  const uniApi = (globalThis as any)?.uni;
  if (uniApi?.getStorageSync) {
    return uniApi.getStorageSync(key);
  }
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const writeCache = (key: string, value: string) => {
  const uniApi = (globalThis as any)?.uni;
  if (uniApi?.setStorageSync) {
    uniApi.setStorageSync(key, value);
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const formatVotes = (votes: string): string => {
  const num = BigInt(votes || "0");
  if (num >= BigInt(1e12)) {
    return (Number(num / BigInt(1e10)) / 100).toFixed(2) + "T";
  }
  if (num >= BigInt(1e9)) {
    return (Number(num / BigInt(1e7)) / 100).toFixed(2) + "B";
  }
  if (num >= BigInt(1e6)) {
    return (Number(num / BigInt(1e4)) / 100).toFixed(2) + "M";
  }
  if (num >= BigInt(1e3)) {
    return (Number(num / BigInt(10)) / 100).toFixed(2) + "K";
  }
  return votes || "0";
};

const normalizedUserVotedPublicKey = computed(() => {
  const normalized = normalizePublicKey(userVotedPublicKey.value);
  return normalized || null;
});

const selectCandidate = (candidate: GovernanceCandidate) => {
  selectedCandidate.value = candidate;
};

const openCandidateDetail = (candidate: GovernanceCandidate, rank: number) => {
  detailCandidate.value = candidate;
  detailRank.value = rank;
  showDetailModal.value = true;
};

const closeCandidateDetail = () => {
  showDetailModal.value = false;
  detailCandidate.value = null;
};

const handleVoteFromModal = async (candidate: GovernanceCandidate) => {
  selectedCandidate.value = candidate;
  closeCandidateDetail();
  await handleVote();
};

// Get user's current vote from chain
const loadUserVote = async () => {
  if (!address.value) {
    userVotedPublicKey.value = null;
    return;
  }
  try {
    const result = await invokeRead({
      scriptHash: NEO_CONTRACT,
      operation: "getAccountState",
      args: [{ type: "Hash160", value: address.value }],
    });
    // Result contains voteTo field with the public key user voted for
    // Neo AccountState: [Balance, Height, VoteTo]
    const parsed = parseInvokeResult(result);
    let voteValue: unknown = null;
    if (Array.isArray(parsed)) {
      voteValue = parsed[2];
    } else if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      // Handle various response shapes
      voteValue = record.voteTo ?? record.VoteTo ?? record.vote_to;
    }
    const normalized = normalizePublicKey(voteValue);
    userVotedPublicKey.value = normalized || null;
  } catch (e) {
    userVotedPublicKey.value = null;
  }
};

const loadCandidates = async () => {
  // Try cache first
  const network = chainId.value === "neo-n3-testnet" ? "testnet" : "mainnet";
  const cacheKey = getCacheKey(network);
  try {
    const cached = readCache(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      candidates.value = parsed.candidates || [];
      totalNetworkVotes.value = parsed.totalVotes || "0";
    }
  } catch {}

  candidatesLoading.value = true;
  try {
    const targetChain = chainId.value === "neo-n3-testnet" ? "neo-n3-testnet" : "neo-n3-mainnet";
    const response = await fetchCandidates(targetChain);
    candidates.value = response.candidates;
    totalNetworkVotes.value = response.totalVotes || "0";
    blockHeight.value = response.blockHeight || 0;

    if (selectedCandidate.value) {
      const match = candidates.value.find(
        (candidate) => normalizePublicKey(candidate.publicKey) === normalizePublicKey(selectedCandidate.value?.publicKey),
      );
      selectedCandidate.value = match || null;
    }

    writeCache(
      cacheKey,
      JSON.stringify({
        candidates: candidates.value,
        totalVotes: totalNetworkVotes.value,
        blockHeight: blockHeight.value,
      }),
    );
  } catch (e: any) {
    if (candidates.value.length === 0) {
      showStatus(t("failedToLoad") || "Failed to load candidates", "error");
    }
  } finally {
    candidatesLoading.value = false;
  }
};

const handleVote = async () => {
  if (isLoading.value || !selectedCandidate.value) return;

  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }

  isLoading.value = true;
  try {
    // Call the native NEO contract's vote method
    // vote(account, voteTo) - voteTo is the public key of the candidate
    await invokeContract({
      scriptHash: NEO_CONTRACT,
      operation: "vote",
      args: [
        { type: "Hash160", value: address.value },
        { type: "PublicKey", value: selectedCandidate.value.publicKey },
      ],
    });

    showStatus(t("voteSuccess"), "success");
    // Refresh candidates and user vote to show updated state
    await Promise.all([loadCandidates(), loadUserVote()]);
  } catch (e: any) {
    showStatus(e.message || t("voteFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadCandidates(), loadUserVote()]);
});

watch(address, () => {
  loadUserVote();
});

watch(chainId, () => {
  loadCandidates();
  loadUserVote();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$gov-bg: #f8fafc;
$gov-card-bg: #ffffff;
$gov-primary: #0f172a;
$gov-accent: #d97706; /* Amber gold */

:global(page) {
  background: $gov-bg;
  color: $gov-primary;
}

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.neo-card) {
  background: $gov-card-bg !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  color: $gov-primary !important;
  border-radius: 4px !important;
  
  &.variant-erobo {
    background: #fff !important;
    border-color: $gov-accent !important;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'Merriweather', serif !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.variant-primary {
    background: $gov-primary !important;
    color: #fff !important;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-weight: 700;
  font-family: 'Times New Roman', serif;
  font-feature-settings: "tnum";
  font-size: 18px;
  color: $gov-primary;
}

.vote-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: $gov-accent;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 4px;
}

.candidate-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.candidate-name {
  font-weight: 700;
  font-size: 16px;
  color: $gov-primary;
  font-family: serif;
}

.candidate-key {
  font-size: 11px;
  font-family: monospace;
  color: #64748b;
}

.warning-text {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #b45309; 
}

.connect-hint {
  text-align: center;
  padding: 8px;
}

.hint-text {
  font-size: 12px;
  color: #64748b;
}
</style>
