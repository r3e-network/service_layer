<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'files' || activeTab === 'upload'" class="app-container">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <!-- Files Archive Tab -->
      <view v-if="activeTab === 'files'" class="tab-content">
        <!-- Archive Stats -->
        <NeoCard class="mb-4">
          <NeoStats :stats="statsData" />
        </NeoCard>

        <!-- Query Record -->
        <NeoCard :title="t('queryRecord')" class="mb-6">
          <template #header-extra>
            <text class="section-icon">🔎</text>
          </template>

          <NeoInput v-model="queryInput" :label="t('queryLabel')" :placeholder="t('queryPlaceholder')" class="mb-4" />

          <NeoButton
            variant="primary"
            block
            @click="queryRecord"
            :loading="isLoading"
            :disabled="!queryInput.trim()"
            class="mb-4"
          >
            {{ t("queryRecord") }}
          </NeoButton>

          <view v-if="queryResult" class="result-card-neo">
            <text class="result-title font-bold block mb-2">{{ t("queryResult") }}</text>
            <view class="result-info">
              <text class="result-line">{{ t("record") }} #{{ queryResult.id }}</text>
              <text class="result-line">{{ t("rating") }}: {{ queryResult.rating }}</text>
              <text class="result-line">{{ t("totalQueries") }}: {{ queryResult.queryCount }}</text>
              <text class="result-line word-break">{{ t("hashLabel") }}: {{ queryResult.dataHash }}</text>
            </view>
          </view>
        </NeoCard>

        <!-- Memory Archive -->
        <view class="archive-section">
          <view class="section-header-neo mb-4">
            <text class="section-icon">📁</text>
            <text class="section-title font-bold">{{ t("memoryArchive") }}</text>
          </view>

          <view class="timeline">
            <NeoCard
              v-for="record in sortedRecords"
              :key="record.id"
              :variant="record.active ? 'success' : 'default'"
              class="mb-4"
              @click="viewRecord(record)"
            >
              <template #header-extra>
                <text v-if="record.active" class="status-icon">✅</text>
                <text v-else class="status-icon">🚫</text>
              </template>

              <view class="file-body">
                <text class="file-title font-bold block mb-2">{{ t("record") }} #{{ record.id }}</text>
                <view class="file-meta flex justify-between mb-2">
                  <text class="file-date text-xs">{{ record.date }}</text>
                  <text class="file-type text-xs">{{ record.active ? t("statusActive") : t("statusInactive") }}</text>
                </view>
                <text class="file-desc text-sm opacity-80">{{ record.hashShort }}</text>
              </view>

              <template #footer>
                <view class="file-footer-neo flex justify-between items-center w-full">
                  <text class="file-id text-xs opacity-60">ID: {{ record.id }}</text>
                  <text class="view-label font-bold">{{ t("tapToView") }} →</text>
                </view>
              </template>
            </NeoCard>
          </view>
        </view>
      </view>

      <!-- Upload Tab -->
      <view v-if="activeTab === 'upload'" class="tab-content">
        <NeoCard :title="t('uploadMemory')">
          <template #header-extra>
            <text class="upload-icon">📤</text>
          </template>

          <text class="upload-subtitle mb-6 text-center block opacity-70">{{ t("uploadSubtitle") }}</text>

          <NeoInput
            v-model="recordContent"
            :label="t('recordContent')"
            :placeholder="t('contentPlaceholder')"
            type="textarea"
            class="mb-2"
          />
          <text class="hash-note text-[10px] font-bold uppercase opacity-60 mb-6 block">{{ t("hashNote") }}</text>

          <NeoInput v-model="recordRating" :label="t('rating')" type="number" min="1" max="5" class="mb-8" />

          <NeoButton
            variant="primary"
            size="lg"
            block
            @click="createRecord"
            :loading="isLoading"
            :disabled="!canCreate"
          >
            {{ t("createRecord") }}
          </NeoButton>
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
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard, NeoStats } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

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

const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("files");
const navTabs: NavTab[] = [
  { id: "files", icon: "folder", label: t("tabFiles") },
  { id: "upload", icon: "upload", label: t("tabUpload") },
  { id: "docs", icon: "book", label: t("docs") },
];

interface RecordItem {
  id: number;
  dataHash: string;
  rating: number;
  queryCount: number;
  createTime: number;
  active: boolean;
  date: string;
  hashShort: string;
}

const contractHash = ref<string | null>(null);
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

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    throw new Error(t("missingContract"));
  }
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
  await ensureContractHash();
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
      contractHash: contractHash.value as string,
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
    await ensureContractHash();
    const hashHex = await sha256Hex(recordContent.value.trim());
    const payment = await payGAS(CREATE_FEE, `create:${hashHex.slice(0, 8)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "CreateRecord",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hashHex },
        { type: "Integer", value: rating },
        { type: "Integer", value: Number(receiptId) },
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
    await ensureContractHash();
    const input = queryInput.value.trim();
    const isHash = /^(0x)?[0-9a-fA-F]{64}$/.test(input);
    const hashHex = isHash ? input.replace(/^0x/, "") : await sha256Hex(input);
    const payment = await payGAS(QUERY_FEE, `query:${hashHex.slice(0, 8)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    const tx = await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "QueryByHash",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hashHex },
        { type: "Integer", value: Number(receiptId) },
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
            contractHash: contractHash.value as string,
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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

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

.section-header-neo {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: black;
  color: white;
  border: 3px solid black;
  box-shadow: 4px 4px 0 var(--brutal-yellow);
}

.section-icon {
  font-size: 24px;
}
.section-title {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-card-neo {
  background: white;
  border: 4px solid black;
  padding: $space-6;
  box-shadow: 8px 8px 0 black;
  margin-top: $space-4;
  position: relative;
  &::before {
    content: "QUERY HIT";
    position: absolute;
    top: -12px;
    right: $space-4;
    background: var(--brutal-yellow);
    border: 2px solid black;
    padding: 2px 10px;
    font-size: 10px;
    font-weight: $font-weight-black;
  }
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-line {
  font-size: 12px;
  font-family: $font-mono;
  font-weight: $font-weight-black;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.file-body {
  padding: $space-2 0;
}
.file-title {
  font-size: 18px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: black;
  border-bottom: 3px solid var(--brutal-yellow);
  display: inline-block;
  margin-bottom: 8px;
}
.file-date {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  font-family: $font-mono;
}
.file-type {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: var(--neo-green);
  color: black;
  padding: 2px 8px;
  border: 1px solid black;
}

.file-footer-neo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $space-3;
  border-top: 2px solid black;
  margin-top: $space-3;
}
.view-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: black;
}

.upload-subtitle {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: $space-6;
  display: block;
  border-left: 4px solid black;
  padding-left: 8px;
}
.hash-note {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.8;
  background: #eee;
  padding: 4px 8px;
  border: 1px solid black;
}

.word-break {
  word-break: break-all;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
