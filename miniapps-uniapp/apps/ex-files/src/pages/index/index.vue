<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'files' || activeTab === 'upload' || activeTab === 'stats'" class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <StatusMessage :status="status" />

      <!-- Files Archive Tab -->
      <view v-if="activeTab === 'files'" class="tab-content">
        <QueryRecordForm
          v-model:queryInput="queryInput"
          :query-result="queryResult"
          :is-loading="isLoading"
          :t="t as any"
          @query="queryRecord"
        />

        <!-- Memory Archive -->
        <MemoryArchive :sorted-records="sortedRecords" :t="t as any" @view="viewRecord" />
      </view>

      <!-- Upload Tab -->
      <view v-if="activeTab === 'upload'" class="tab-content">
        <UploadForm
          v-model:recordContent="recordContent"
          v-model:recordRating="recordRating"
          :is-loading="isLoading"
          :can-create="canCreate"
          :t="t as any"
          @create="createRecord"
        />
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content">
        <NeoCard variant="erobo">
          <NeoStats :stats="statsData" />
        </NeoCard>
      </view>
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
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { sha256Hex } from "@/shared/utils/hash";
import { AppLayout, NeoDoc, NeoCard, NeoStats } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

import StatusMessage from "./components/StatusMessage.vue";
import QueryRecordForm, { type RecordItem } from "./components/QueryRecordForm.vue";
import MemoryArchive from "./components/MemoryArchive.vue";
import UploadForm from "./components/UploadForm.vue";

const translations = {
  title: { en: "Ex Files", zh: "前任档案" },
  subtitle: { en: "Anonymous record vault", zh: "匿名记录保险库" },

  // Stats
  totalMemories: { en: "Total Memories", zh: "总回忆" },
  daysTogether: { en: "Days Together", zh: "相处天数" },
  lockedFiles: { en: "Locked Files", zh: "已锁定" },
  totalRecords: { en: "Total Records", zh: "记录总数" },
  averageRating: { en: "Avg Rating", zh: "平均评分" },
  totalQueries: { en: "Total Queries", zh: "查询总数" },
  record: { en: "Record", zh: "记录" },
  statusActive: { en: "Active", zh: "有效" },
  statusInactive: { en: "Inactive", zh: "已删除" },

  // Archive
  memoryArchive: { en: "Record Archive", zh: "记录档案" },
  tapToView: { en: "Tap to view", zh: "点击查看" },

  // Upload
  uploadMemory: { en: "Create Record", zh: "创建记录" },
  uploadSubtitle: { en: "Add a hashed record to the archive", zh: "将哈希记录加入档案" },
  memoryTitle: { en: "Memory Title", zh: "回忆标题" },
  memoryTitlePlaceholder: { en: "e.g., First Date at Cafe", zh: "例如：咖啡馆的初次约会" },
  memoryType: { en: "Memory Type", zh: "回忆类型" },
  contentOrUrl: { en: "Content / URL", zh: "内容 / 链接" },
  contentPlaceholder: { en: "Describe the record or paste a URL", zh: "填写记录内容或粘贴链接" },
  uploading: { en: "Uploading...", zh: "上传中..." },
  uploadMemoryBtn: { en: "Upload to Archive", zh: "上传到档案" },
  recordContent: { en: "Record Content", zh: "记录内容" },
  rating: { en: "Rating (1-5)", zh: "评分（1-5）" },
  hashNote: { en: "Content is hashed locally before upload.", zh: "内容将在本地哈希后上传。" },
  createRecord: { en: "Create Record", zh: "创建记录" },
  queryRecord: { en: "Query Record", zh: "查询记录" },
  queryLabel: { en: "Hash or Content", zh: "哈希或内容" },
  queryPlaceholder: { en: "Paste hash or enter content to hash", zh: "粘贴哈希或输入内容生成哈希" },
  querying: { en: "Querying...", zh: "查询中..." },
  queryResult: { en: "Query Result", zh: "查询结果" },
  hashLabel: { en: "Hash", zh: "哈希" },

  // Memory types
  typePhoto: { en: "Photo", zh: "照片" },
  typeText: { en: "Letter", zh: "信件" },
  typeVideo: { en: "Video", zh: "视频" },
  typeAudio: { en: "Audio", zh: "音频" },

  // Status
  viewing: { en: "Viewing", zh: "查看中" },
  memoryUploaded: { en: "Memory uploaded to archive!", zh: "回忆已上传到档案！" },
  error: { en: "Error", zh: "错误" },
  invalidContent: { en: "Enter content to hash", zh: "请输入内容" },
  invalidRating: { en: "Rating must be between 1 and 5", zh: "评分必须在 1-5 之间" },
  recordCreated: { en: "Record created", zh: "记录已创建" },
  recordQueried: { en: "Record queried", zh: "记录已查询" },
  failedToLoad: { en: "Failed to load records", zh: "加载记录失败" },
  missingContract: { en: "Contract not configured", zh: "合约未配置" },

  // Sample memories
  firstDate: { en: "First Date", zh: "初次约会" },
  loveLetter: { en: "Love Letter", zh: "情书" },
  anniversary: { en: "Anniversary", zh: "纪念日" },
  breakupLetter: { en: "Breakup Letter", zh: "分手信" },

  // Tabs
  tabFiles: { en: "Archive", zh: "档案" },
  tabUpload: { en: "Upload", zh: "上传" },
  tabStats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },

  // Docs
  docSubtitle: { en: "Privacy-first record storage", zh: "隐私优先的记录存储" },
  docDescription: {
    en: "Store hashed records on-chain and query by hash with TEE-backed privacy.",
    zh: "将记录哈希存储在链上，并通过哈希查询，TEE 保障隐私。",
  },
  step1: { en: "Connect your wallet", zh: "连接钱包" },
  step2: { en: "Create records with hashed content", zh: "创建哈希记录" },
  step3: { en: "Query records by hash when needed", zh: "按需通过哈希查询记录" },
  step4: { en: "View your archive and track query statistics.", zh: "查看档案并跟踪查询统计。" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全" },
  feature1Desc: { en: "Hardware-level memory protection", zh: "硬件级回忆保护" },
  feature2Name: { en: "On-Chain Storage", zh: "链上存储" },
  feature2Desc: { en: "Immutable relationship records", zh: "不可篡改的关系记录" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-exfiles";
const CREATE_FEE = "0.1";
const QUERY_FEE = "0.05";

const { address, connect, invokeRead, invokeContract, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("files");
const navTabs: NavTab[] = [
  { id: "files", icon: "folder", label: t("tabFiles") },
  { id: "upload", icon: "upload", label: t("tabUpload") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const contractAddress = ref<string | null>(null);
const records = ref<RecordItem[]>([]);
const recordContent = ref("");
const recordRating = ref("3");
const queryInput = ref("");
const queryResult = ref<RecordItem | null>(null);
const status = ref<{ msg: string; type: string } | null>(null);

const statsData = computed<StatItem[]>(() => [
  { label: t("totalRecords"), value: records.value.length, variant: "default" },
  { label: t("averageRating"), value: averageRating.value, variant: "accent" },
  { label: t("totalQueries"), value: totalQueries.value, variant: "default" },
]);

const sortedRecords = computed(() => [...records.value].sort((a, b) => b.createTime - a.createTime));

const averageRating = computed(() => {
  if (!records.value.length) return "0.0";
  const total = records.value.reduce((sum, record) => sum + record.rating, 0);
  return (total / records.value.length).toFixed(1);
});

const totalQueries = computed(() => records.value.reduce((sum, record) => sum + record.queryCount, 0));

const canCreate = computed(() => {
  const rating = Number(recordRating.value);
  return recordContent.value.trim().length > 0 && rating >= 1 && rating <= 5;
});

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 3000);
};

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("missingContract"));
  }
  return contractAddress.value;
};

const formatHash = (hash: string) => {
  if (!hash) return "--";
  const clean = hash.startsWith("0x") ? hash : `0x${hash}`;
  if (clean.length <= 14) return clean;
  return `${clean.slice(0, 10)}...${clean.slice(-6)}`;
};

const parseRecord = (recordId: number, raw: any): RecordItem => {
  const values = Array.isArray(raw) ? raw : [];
  const dataHash = String(values[1] || "");
  const createTime = Number(values[4] || 0);
  return {
    id: recordId,
    dataHash,
    rating: Number(values[2] || 0),
    queryCount: Number(values[3] || 0),
    createTime,
    active: Boolean(values[5]),
    date: createTime ? new Date(createTime * 1000).toISOString().split("T")[0] : "--",
    hashShort: formatHash(dataHash),
  };
};

const loadRecords = async () => {
  await ensureContractAddress();
  const res = await listEvents({ app_id: APP_ID, event_name: "RecordCreated", limit: 50 });
  const ids = Array.from(
    new Set(
      res.events
        .map((evt: any) => {
          const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
          return Number(values[0] || 0);
        })
        .filter((id: number) => id > 0),
    ),
  );
  const list: RecordItem[] = [];
  for (const id of ids) {
    const recordRes = await invokeRead({
      scriptHash: contractAddress.value as string,
      operation: "GetRecord",
      args: [{ type: "Integer", value: id }],
    });
    const data = parseInvokeResult(recordRes);
    list.push(parseRecord(id, data));
  }
  records.value = list;
};

const viewRecord = (record: RecordItem) => {
  queryResult.value = record;
  showStatus(`${t("record")} #${record.id}`, "success");
};

const createRecord = async () => {
  if (!canCreate.value || isLoading.value) return;
  const rating = Number(recordRating.value);
  if (!recordContent.value.trim()) {
    showStatus(t("invalidContent"), "error");
    return;
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    showStatus(t("invalidRating"), "error");
    return;
  }
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractAddress();
    const hashHex = await sha256Hex(recordContent.value.trim());
    const payment = await payGAS(CREATE_FEE, `create:${hashHex.slice(0, 8)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "CreateRecord",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hashHex },
        { type: "Integer", value: rating },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    showStatus(t("recordCreated"), "success");
    recordContent.value = "";
    recordRating.value = "3";
    await loadRecords();
    activeTab.value = "files";
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 20 });
    const match = res.events.find((evt: any) => evt.tx_hash === txid);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return null;
};

const queryRecord = async () => {
  if (!queryInput.value.trim() || isLoading.value) return;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractAddress();
    const input = queryInput.value.trim();
    const isHash = /^(0x)?[0-9a-fA-F]{64}$/.test(input);
    const hashHex = isHash ? input.replace(/^0x/, "") : await sha256Hex(input);
    const payment = await payGAS(QUERY_FEE, `query:${hashHex.slice(0, 8)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: contractAddress.value as string,
      operation: "QueryByHash",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hashHex },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      const evt = await waitForEvent(txid, "RecordQueried");
      if (evt) {
        const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
        const recordId = Number(values[0] || 0);
        if (recordId > 0) {
          const recordRes = await invokeRead({
            scriptHash: contractAddress.value as string,
            operation: "GetRecord",
            args: [{ type: "Integer", value: recordId }],
          });
          const data = parseInvokeResult(recordRes);
          queryResult.value = parseRecord(recordId, data);
        }
      }
    }
    showStatus(t("recordQueried"), "success");
    await loadRecords();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

onMounted(async () => {
  try {
    await loadRecords();
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
