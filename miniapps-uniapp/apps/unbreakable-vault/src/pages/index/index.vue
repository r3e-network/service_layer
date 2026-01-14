<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">
            {{ t("switchToNeo") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'create'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-3 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard variant="erobo-neo">
        <view class="form-group">
          <view class="input-group">
            <text class="input-label">{{ t("bountyLabel") }}</text>
            <NeoInput v-model="bounty" type="number" :placeholder="t('bountyPlaceholder')" suffix="GAS" />
            <text class="helper-text">{{ t("minBountyNote") }}</text>
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("secretLabel") }}</text>
            <NeoInput v-model="secret" :placeholder="t('secretPlaceholder')" />
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("confirmSecretLabel") }}</text>
            <NeoInput v-model="secretConfirm" :placeholder="t('confirmSecretPlaceholder')" />
            <text v-if="secretMismatch" class="helper-text text-danger">{{ t("secretMismatch") }}</text>
          </view>

          <view v-if="secretHash" class="hash-preview">
            <text class="hash-label">{{ t("hashPreview") }}</text>
            <text class="hash-value">{{ secretHash }}</text>
          </view>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="!canCreate || isLoading"
            @click="createVault"
          >
            {{ isLoading ? t("creating") : t("createVault") }}
          </NeoButton>

          <text class="helper-text">{{ t("secretNote") }}</text>
        </view>
      </NeoCard>

      <NeoCard v-if="createdVaultId" variant="erobo" class="vault-created">
        <text class="vault-created-label">{{ t("vaultCreated") }}</text>
        <text class="vault-created-id">#{{ createdVaultId }}</text>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'break'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-3 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard variant="erobo-neo">
        <view class="form-group">
          <view class="input-group">
            <text class="input-label">{{ t("vaultIdLabel") }}</text>
            <NeoInput v-model="vaultIdInput" type="number" :placeholder="t('vaultIdPlaceholder')" />
          </view>

          <NeoButton variant="secondary" block :loading="isLoading" @click="loadVault">
            {{ t("loadVault") }}
          </NeoButton>

          <view class="input-group">
            <text class="input-label">{{ t("secretAttemptLabel") }}</text>
            <NeoInput v-model="attemptSecret" :placeholder="t('secretAttemptPlaceholder')" />
          </view>

          <text class="helper-text">{{ t("attemptFeeNote") }}</text>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="!canAttempt || isLoading"
            @click="attemptBreak"
          >
            {{ isLoading ? t("attempting") : t("attemptBreak") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="vaultDetails" variant="erobo" class="vault-details">
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("vaultStatus") }}</text>
          <text class="detail-value">{{ vaultDetails.broken ? t("broken") : t("active") }}</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("creator") }}</text>
          <text class="detail-value mono">{{ formatAddress(vaultDetails.creator) }}</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("bountyLabel") }}</text>
          <text class="detail-value">{{ formatGas(vaultDetails.bounty) }} GAS</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("attempts") }}</text>
          <text class="detail-value">{{ vaultDetails.attempts }}</text>
        </view>
        <view class="vault-detail-row" v-if="vaultDetails.broken">
          <text class="detail-label">{{ t("winner") }}</text>
          <text class="detail-value mono">{{ formatAddress(vaultDetails.winner) }}</text>
        </view>
      </NeoCard>

      <NeoCard variant="erobo" class="recent-vaults">
        <text class="section-title">{{ t("recentVaults") }}</text>
        <view v-if="recentVaults.length === 0" class="empty-state">
          <text class="empty-text">{{ t("noRecentVaults") }}</text>
        </view>
        <view v-else class="vault-list">
          <view
            v-for="vault in recentVaults"
            :key="vault.id"
            class="vault-item"
            @click="selectVault(vault.id)"
          >
            <view class="vault-meta">
              <text class="vault-id">#{{ vault.id }}</text>
              <text class="vault-bounty">{{ formatGas(vault.bounty) }} GAS</text>
            </view>
            <text class="vault-creator mono">{{ formatAddress(vault.creator) }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

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
import { sha256Hex } from "@/shared/utils/hash";
import { normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { bytesToHex, formatAddress } from "@/shared/utils/format";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

const translations = {
  title: { en: "Unbreakable Vault", zh: "坚不可摧保险库" },
  create: { en: "Create", zh: "创建" },
  break: { en: "Break", zh: "破解" },
  docs: { en: "Docs", zh: "文档" },
  bountyLabel: { en: "Bounty", zh: "悬赏金" },
  bountyPlaceholder: { en: "Minimum 1", zh: "至少 1" },
  minBountyNote: { en: "Minimum bounty: 1 GAS", zh: "最低悬赏：1 GAS" },
  secretLabel: { en: "Vault Secret", zh: "保险库密钥" },
  secretPlaceholder: { en: "Enter a secret phrase", zh: "输入密钥短语" },
  confirmSecretLabel: { en: "Confirm Secret", zh: "确认密钥" },
  confirmSecretPlaceholder: { en: "Re-enter the secret", zh: "再次输入密钥" },
  secretMismatch: { en: "Secrets do not match", zh: "两次密钥不一致" },
  hashPreview: { en: "On-chain Hash", zh: "链上哈希" },
  createVault: { en: "Create Vault", zh: "创建保险库" },
  creating: { en: "Creating...", zh: "创建中..." },
  secretNote: {
    en: "Secret is hashed locally and never stored. Keep it safe to claim your bounty.",
    zh: "密钥在本地哈希且不会存储。请妥善保管以领取悬赏。",
  },
  vaultCreated: { en: "Vault Created", zh: "保险库已创建" },
  vaultIdLabel: { en: "Vault ID", zh: "保险库编号" },
  vaultIdPlaceholder: { en: "Enter vault ID", zh: "输入保险库编号" },
  loadVault: { en: "Load Vault", zh: "加载保险库" },
  secretAttemptLabel: { en: "Break Secret", zh: "破解密钥" },
  secretAttemptPlaceholder: { en: "Enter secret attempt", zh: "输入尝试密钥" },
  attemptFeeNote: { en: "Attempt fee: 0.1 GAS", zh: "尝试费用：0.1 GAS" },
  attemptBreak: { en: "Attempt Break", zh: "尝试破解" },
  attempting: { en: "Attempting...", zh: "破解中..." },
  vaultStatus: { en: "Status", zh: "状态" },
  active: { en: "Active", zh: "进行中" },
  broken: { en: "Broken", zh: "已破解" },
  creator: { en: "Creator", zh: "创建者" },
  attempts: { en: "Attempts", zh: "尝试次数" },
  winner: { en: "Winner", zh: "获胜者" },
  recentVaults: { en: "Recent Vaults", zh: "最新保险库" },
  noRecentVaults: { en: "No vaults found", zh: "暂无保险库" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  vaultNotFound: { en: "Vault not found", zh: "未找到保险库" },
  vaultCreateFailed: { en: "Create failed", zh: "创建失败" },
  vaultAttemptFailed: { en: "Attempt failed", zh: "破解失败" },
  loadFailed: { en: "Failed to load vault", zh: "加载保险库失败" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },

  docSubtitle: {
    en: "Security bounty vaults with on-chain verification",
    zh: "链上验证的安全悬赏保险库",
  },
  docDescription: {
    en: "Create a vault by locking a secret hash with a GAS bounty. Anyone can attempt to break the vault by paying a small fee; if they provide the correct secret, they win the bounty.",
    zh: "通过锁定密钥哈希并设置 GAS 悬赏创建保险库。任何人都可支付小额费用尝试破解；若密钥正确，即可赢得悬赏。",
  },
  step1: { en: "Create a vault by setting a bounty and secret hash", zh: "设置悬赏与密钥哈希创建保险库" },
  step2: { en: "Share the vault ID publicly for challengers", zh: "公开保险库编号吸引挑战者" },
  step3: { en: "Challengers pay 0.1 GAS to attempt a break", zh: "挑战者支付 0.1 GAS 尝试破解" },
  step4: { en: "If the secret matches, bounty is awarded instantly", zh: "密钥匹配即刻发放悬赏" },
  feature1Name: { en: "On-chain Verification", zh: "链上验证" },
  feature1Desc: { en: "Secrets are validated on-chain via SHA-256.", zh: "通过 SHA-256 在链上验证密钥。" },
  feature2Name: { en: "Bounty Pool", zh: "悬赏池" },
  feature2Desc: { en: "Each attempt adds to the bounty pool.", zh: "每次尝试都会增加悬赏。" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const APP_ID = "miniapp-unbreakablevault";
const MIN_BOUNTY = 1;
const ATTEMPT_FEE = 0.1;

const { address, connect, chainType, switchChain, invokeContract, invokeRead, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("create");
const navTabs = [
  { id: "create", icon: "lock", label: t("create") },
  { id: "break", icon: "key", label: t("break") },
  { id: "docs", icon: "book", label: t("docs") },
];

const status = ref<{ msg: string; type: "success" | "error" } | null>(null);

const bounty = ref("");
const secret = ref("");
const secretConfirm = ref("");
const secretHash = ref("");
const createdVaultId = ref<string | null>(null);

const vaultIdInput = ref("");
const attemptSecret = ref("");
const vaultDetails = ref<{
  id: string;
  creator: string;
  bounty: number;
  attempts: number;
  broken: boolean;
  winner: string;
} | null>(null);

const recentVaults = ref<{ id: string; creator: string; bounty: number }[]>([]);

const secretMismatch = computed(() => {
  if (!secretConfirm.value) return false;
  return secret.value !== secretConfirm.value;
});

const canCreate = computed(() => {
  const amount = Number.parseFloat(bounty.value);
  return amount >= MIN_BOUNTY && secret.value.trim() && !secretMismatch.value;
});

const canAttempt = computed(() => {
  return Boolean(
    vaultIdInput.value &&
      attemptSecret.value.trim() &&
      vaultDetails.value &&
      String(vaultDetails.value.id) === String(vaultIdInput.value) &&
      !vaultDetails.value.broken,
  );
});

const formatGas = (amount: number) => (amount / 1e8).toFixed(2);
const toHex = (value: string) => {
  if (!value) return "";
  if (typeof TextEncoder === "undefined") {
    return Array.from(value)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  }
  return bytesToHex(new TextEncoder().encode(value));
};

const ensureContractAddress = async () => {
  const contract = await getContractAddress();
  if (!contract) throw new Error(t("contractUnavailable"));
  return contract;
};

const loadRecentVaults = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "VaultCreated", limit: 12 });
    const vaults = res.events
      .map((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        const id = String(values[0] ?? "");
        const creator = String(values[1] ?? "");
        const bountyValue = Number(values[2] ?? 0);
        if (!id) return null;
        return { id, creator, bounty: bountyValue };
      })
      .filter(Boolean) as { id: string; creator: string; bounty: number }[];
    recentVaults.value = vaults;
  } catch (e) {
    console.warn("[UnbreakableVault] Failed to load recent vaults:", e);
  }
};

const createVault = async () => {
  if (!canCreate.value || isLoading.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const amount = Number.parseFloat(bounty.value);
    const bountyInt = Math.floor(amount * 1e8);
    const hash = secretHash.value || (await sha256Hex(secret.value));

    const payment = await payGAS(String(amount), `vault:create:${hash.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const res = await invokeContract({
      scriptHash: contract,
      operation: "createVault",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hash },
        { type: "Integer", value: String(bountyInt) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const vaultId = String((res as any)?.result || (res as any)?.stack?.[0]?.value || "");
    createdVaultId.value = vaultId || createdVaultId.value;
    status.value = { msg: t("vaultCreated"), type: "success" };
    bounty.value = "";
    secret.value = "";
    secretConfirm.value = "";
    await loadRecentVaults();
  } catch (e: any) {
    status.value = { msg: e?.message || t("vaultCreateFailed"), type: "error" };
  }
};

const loadVault = async () => {
  if (!vaultIdInput.value) return;
  status.value = null;
  try {
    const contract = await ensureContractAddress();
    const res = await invokeRead({
      contractAddress: contract,
      operation: "getVault",
      args: [{ type: "Integer", value: vaultIdInput.value }],
    });
    const parsed = parseInvokeResult(res);
    if (!Array.isArray(parsed) || parsed.length < 6) {
      throw new Error(t("vaultNotFound"));
    }
    const [creator, bountyValue, , attempts, broken, winner] = parsed;
    const creatorHash = normalizeScriptHash(String(creator || ""));
    if (!creatorHash || /^0+$/.test(creatorHash)) {
      throw new Error(t("vaultNotFound"));
    }
    vaultDetails.value = {
      id: vaultIdInput.value,
      creator: String(creator || ""),
      bounty: Number(bountyValue || 0),
      attempts: Number(attempts || 0),
      broken: Boolean(broken),
      winner: String(winner || ""),
    };
  } catch (e: any) {
    status.value = { msg: e?.message || t("loadFailed"), type: "error" };
    vaultDetails.value = null;
  }
};

const attemptBreak = async () => {
  if (!canAttempt.value || isLoading.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const payment = await payGAS(String(ATTEMPT_FEE), `vault:attempt:${vaultIdInput.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const res = await invokeContract({
      scriptHash: contract,
      operation: "attemptBreak",
      args: [
        { type: "Integer", value: vaultIdInput.value },
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: toHex(attemptSecret.value) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const success = Boolean((res as any)?.stack?.[0]?.value ?? (res as any)?.result);
    status.value = {
      msg: success ? t("broken") : t("vaultAttemptFailed"),
      type: success ? "success" : "error",
    };

    attemptSecret.value = "";
    await loadVault();
    await loadRecentVaults();
  } catch (e: any) {
    status.value = { msg: e?.message || t("vaultAttemptFailed"), type: "error" };
  }
};

const selectVault = (id: string) => {
  vaultIdInput.value = id;
  loadVault();
};

watch(secret, async (value) => {
  secretHash.value = value ? await sha256Hex(value) : "";
});

onMounted(() => {
  loadRecentVaults();
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

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
}

.helper-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.hash-preview {
  padding: $space-3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.hash-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.hash-value {
  font-family: $font-mono;
  font-size: 11px;
  word-break: break-all;
}

.vault-created {
  text-align: center;
}

.vault-created-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

.vault-created-id {
  font-size: 28px;
  font-weight: 800;
  margin-top: 6px;
}

.vault-details {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.vault-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.detail-value {
  font-weight: 700;
  font-size: 13px;
}

.mono {
  font-family: $font-mono;
}

.recent-vaults {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.vault-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.vault-item {
  padding: $space-3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
}

.vault-meta {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}

.vault-id {
  font-size: 12px;
}

.vault-bounty {
  font-size: 12px;
  color: #00e599;
}

.vault-creator {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: $space-4;
}

.empty-text {
  font-size: 12px;
  opacity: 0.6;
}
</style>
