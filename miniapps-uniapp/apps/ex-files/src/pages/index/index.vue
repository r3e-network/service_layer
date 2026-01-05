<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'files' || activeTab === 'upload'" class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Files Archive Tab -->
      <view v-if="activeTab === 'files'" class="tab-content">
        <!-- Archive Stats -->
        <view class="stats-grid">
          <view class="stat-card stat-pink">
            <text class="stat-icon">💕</text>
            <text class="stat-value">{{ memories.length }}</text>
            <text class="stat-label">{{ t("totalMemories") }}</text>
          </view>
          <view class="stat-card stat-purple">
            <text class="stat-icon">📅</text>
            <text class="stat-value">{{ calculateDays() }}</text>
            <text class="stat-label">{{ t("daysTogether") }}</text>
          </view>
          <view class="stat-card stat-yellow">
            <text class="stat-icon">🔒</text>
            <text class="stat-value">{{ memories.filter((m) => m.locked).length }}</text>
            <text class="stat-label">{{ t("lockedFiles") }}</text>
          </view>
        </view>

        <!-- Memory Archive -->
        <view class="archive-section">
          <view class="section-header">
            <text class="section-icon">📁</text>
            <text class="section-title">{{ t("memoryArchive") }}</text>
          </view>

          <view class="timeline">
            <view
              v-for="memory in sortedMemories"
              :key="memory.id"
              class="file-card"
              :class="[`file-${memory.type}`, memory.locked ? 'locked' : '']"
              @click="viewMemory(memory)"
            >
              <view class="file-header">
                <view class="file-tab" :class="`tab-${memory.type}`">
                  <text class="file-icon">{{ getMemoryIcon(memory.type) }}</text>
                </view>
                <view class="file-status">
                  <text v-if="memory.locked" class="lock-icon">🔒</text>
                  <text v-else class="unlock-icon">🔓</text>
                </view>
              </view>

              <view class="file-body">
                <text class="file-title">{{ memory.title }}</text>
                <view class="file-meta">
                  <text class="file-date">📆 {{ memory.date }}</text>
                  <text class="file-type">{{ getTypeLabel(memory.type) }}</text>
                </view>
                <text v-if="memory.description" class="file-desc">{{ memory.description }}</text>
              </view>

              <view class="file-footer">
                <text class="file-id">ID: {{ memory.id }}</text>
                <text class="view-label">{{ t("tapToView") }} →</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Upload Tab -->
      <view v-if="activeTab === 'upload'" class="tab-content">
        <view class="upload-container">
          <view class="upload-header">
            <text class="upload-icon">📤</text>
            <text class="upload-title">{{ t("uploadMemory") }}</text>
            <text class="upload-subtitle">{{ t("uploadSubtitle") }}</text>
          </view>

          <view class="form-card">
            <view class="form-group">
              <text class="form-label">{{ t("memoryTitle") }}</text>
              <uni-easyinput v-model="memoryTitle" :placeholder="t('memoryTitlePlaceholder')" class="input-field" />
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("memoryType") }}</text>
              <view class="type-selector">
                <view
                  v-for="type in memoryTypes"
                  :key="type.id"
                  class="type-option"
                  :class="{ active: selectedType === type.id }"
                  @click="selectedType = type.id"
                >
                  <text class="type-icon">{{ type.icon }}</text>
                  <text class="type-name">{{ type.label }}</text>
                </view>
              </view>
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("contentOrUrl") }}</text>
              <uni-easyinput
                v-model="memoryContent"
                :placeholder="t('contentPlaceholder')"
                class="input-field"
                type="textarea"
              />
            </view>

            <view class="form-actions">
              <view
                class="action-btn upload-btn"
                @click="uploadMemory"
                :style="{ opacity: isLoading || !canUpload ? 0.5 : 1 }"
              >
                <text>{{ isLoading ? t("uploading") : t("uploadMemoryBtn") }}</text>
              </view>
            </view>
          </view>
        </view>
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
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Ex Files", zh: "前任档案" },
  subtitle: { en: "Relationship memory vault", zh: "关系回忆保险库" },

  // Stats
  totalMemories: { en: "Total Memories", zh: "总回忆" },
  daysTogether: { en: "Days Together", zh: "相处天数" },
  lockedFiles: { en: "Locked Files", zh: "已锁定" },

  // Archive
  memoryArchive: { en: "Memory Archive", zh: "回忆档案" },
  tapToView: { en: "Tap to view", zh: "点击查看" },

  // Upload
  uploadMemory: { en: "Upload Memory", zh: "上传回忆" },
  uploadSubtitle: { en: "Add a new memory to the archive", zh: "添加新回忆到档案" },
  memoryTitle: { en: "Memory Title", zh: "回忆标题" },
  memoryTitlePlaceholder: { en: "e.g., First Date at Cafe", zh: "例如：咖啡馆的初次约会" },
  memoryType: { en: "Memory Type", zh: "回忆类型" },
  contentOrUrl: { en: "Content / URL", zh: "内容 / 链接" },
  contentPlaceholder: { en: "Describe the memory or paste a URL", zh: "描述回忆或粘贴链接" },
  uploading: { en: "Uploading...", zh: "上传中..." },
  uploadMemoryBtn: { en: "Upload to Archive", zh: "上传到档案" },

  // Memory types
  typePhoto: { en: "Photo", zh: "照片" },
  typeText: { en: "Letter", zh: "信件" },
  typeVideo: { en: "Video", zh: "视频" },
  typeAudio: { en: "Audio", zh: "音频" },

  // Status
  viewing: { en: "Viewing", zh: "查看中" },
  memoryUploaded: { en: "Memory uploaded to archive!", zh: "回忆已上传到档案！" },
  error: { en: "Error", zh: "错误" },

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
  docSubtitle: { en: "Secure relationship memory storage", zh: "安全的关系回忆存储" },
  docDescription: {
    en: "Store and manage your relationship memories on-chain with TEE security.",
    zh: "使用TEE安全技术在链上存储和管理您的关系回忆。",
  },
  step1: { en: "Connect your wallet", zh: "连接钱包" },
  step2: { en: "Upload memories to the archive", zh: "上传回忆到档案" },
  step3: { en: "Lock sensitive files for privacy", zh: "锁定敏感文件以保护隐私" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全" },
  feature1Desc: { en: "Hardware-level memory protection", zh: "硬件级回忆保护" },
  feature2Name: { en: "On-Chain Storage", zh: "链上存储" },
  feature2Desc: { en: "Immutable relationship records", zh: "不可篡改的关系记录" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-exfiles";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref("files");
const navTabs: NavTab[] = [
  { id: "files", icon: "folder", label: t("tabFiles") },
  { id: "upload", icon: "upload", label: t("tabUpload") },
  { id: "docs", icon: "book", label: t("docs") },
];

// Form state
const memoryTitle = ref("");
const memoryContent = ref("");
const selectedType = ref("photo");
const status = ref<{ msg: string; type: string } | null>(null);

// Memory types
const memoryTypes = computed(() => [
  { id: "photo", icon: "📷", label: t("typePhoto") },
  { id: "text", icon: "📝", label: t("typeText") },
  { id: "video", icon: "🎥", label: t("typeVideo") },
  { id: "audio", icon: "🎵", label: t("typeAudio") },
]);

// Sample memories
const memories = ref([
  {
    id: "001",
    title: t("firstDate"),
    type: "photo",
    date: "2023-06-15",
    description: "Coffee shop on 5th street",
    locked: false,
  },
  {
    id: "002",
    title: t("loveLetter"),
    type: "text",
    date: "2023-08-20",
    description: "Handwritten letter from Paris",
    locked: true,
  },
  {
    id: "003",
    title: t("anniversary"),
    type: "photo",
    date: "2024-06-15",
    description: "One year celebration",
    locked: false,
  },
  {
    id: "004",
    title: t("breakupLetter"),
    type: "text",
    date: "2024-12-01",
    description: "Final goodbye",
    locked: true,
  },
]);

// Computed
const sortedMemories = computed(() => {
  return [...memories.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const canUpload = computed(() => {
  return memoryTitle.value.trim() && memoryContent.value.trim();
});

// Methods
const calculateDays = () => {
  if (memories.value.length === 0) return 0;
  const dates = memories.value.map((m) => new Date(m.date).getTime());
  const earliest = Math.min(...dates);
  const latest = Math.max(...dates);
  return Math.floor((latest - earliest) / (1000 * 60 * 60 * 24));
};

const getMemoryIcon = (type: string) => {
  const icons: Record<string, string> = {
    photo: "📷",
    text: "📝",
    video: "🎥",
    audio: "🎵",
  };
  return icons[type] || "📄";
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    photo: t("typePhoto"),
    text: t("typeText"),
    video: t("typeVideo"),
    audio: t("typeAudio"),
  };
  return labels[type] || type;
};

const viewMemory = (memory: any) => {
  if (memory.locked) {
    status.value = { msg: `🔒 ${memory.title} - ${t("error")}`, type: "error" };
  } else {
    status.value = { msg: `${t("viewing")}: ${memory.title}`, type: "success" };
  }
  setTimeout(() => {
    status.value = null;
  }, 3000);
};

const uploadMemory = async () => {
  if (!canUpload.value || isLoading.value) return;

  try {
    await payGAS("0.5", `upload:${memoryTitle.value.slice(0, 20)}`);

    // Add to memories
    memories.value.push({
      id: String(memories.value.length + 1).padStart(3, "0"),
      title: memoryTitle.value,
      type: selectedType.value,
      date: new Date().toISOString().split("T")[0],
      description: memoryContent.value.slice(0, 50),
      locked: false,
    });

    status.value = { msg: t("memoryUploaded"), type: "success" };
    memoryTitle.value = "";
    memoryContent.value = "";
    selectedType.value = "photo";

    setTimeout(() => {
      activeTab.value = "files";
      status.value = null;
    }, 2000);
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: $space-4;
}

.tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

// Status Message
.status-msg {
  text-align: center;
  padding: $space-3;
  border-radius: $radius-md;
  margin-bottom: $space-4;
  border: $border-width-md solid var(--border-color);
  font-weight: $font-weight-bold;

  &.success {
    background: var(--brutal-lime);
    color: var(--neo-black);
  }

  &.error {
    background: var(--brutal-red);
    color: var(--neo-white);
  }
}

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-3;
  margin-bottom: $space-5;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;

  &.stat-pink {
    background: var(--brutal-pink);
    box-shadow: 4px 4px 0 var(--neo-purple);
  }

  &.stat-purple {
    background: var(--neo-purple);
    box-shadow: 4px 4px 0 var(--brutal-yellow);
  }

  &.stat-yellow {
    background: var(--brutal-yellow);
    box-shadow: 4px 4px 0 var(--brutal-pink);
  }
}

.stat-icon {
  font-size: $font-size-3xl;
  margin-bottom: $space-2;
}

.stat-value {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--neo-black);
  margin-bottom: $space-1;
}

.stat-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--neo-black);
  text-align: center;
}

// Archive Section
.archive-section {
  margin-bottom: $space-4;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
}

.section-icon {
  font-size: $font-size-2xl;
  margin-right: $space-3;
}

.section-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

// Timeline
.timeline {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// File Card
.file-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-lg;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  transition: transform $transition-fast;

  &.file-photo {
    border-left: 6px solid var(--brutal-pink);
  }

  &.file-text {
    border-left: 6px solid var(--neo-purple);
  }

  &.file-video {
    border-left: 6px solid var(--brutal-blue);
  }

  &.file-audio {
    border-left: 6px solid var(--brutal-yellow);
  }

  &.locked {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.98);
  }
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border-bottom: $border-width-sm solid var(--border-color);
}

.file-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;

  &.tab-photo {
    background: var(--brutal-pink);
  }

  &.tab-text {
    background: var(--neo-purple);
  }

  &.tab-video {
    background: var(--brutal-blue);
  }

  &.tab-audio {
    background: var(--brutal-yellow);
  }
}

.file-icon {
  font-size: $font-size-lg;
}

.file-status {
  font-size: $font-size-xl;
}

.lock-icon {
  color: var(--brutal-red);
}

.unlock-icon {
  color: var(--brutal-lime);
}

.file-body {
  padding: $space-4;
}

.file-title {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.file-date {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.file-type {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  padding: $space-1 $space-2;
  background: var(--bg-elevated);
  border-radius: $radius-sm;
  color: var(--text-secondary);
}

.file-desc {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  line-height: $line-height-relaxed;
}

.file-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border-top: $border-width-sm solid var(--border-color);
}

.file-id {
  font-size: $font-size-xs;
  font-family: $font-mono;
  color: var(--text-muted);
}

.view-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--brutal-pink);
}

// Upload Container
.upload-container {
  max-width: 600px;
  margin: 0 auto;
}

.upload-header {
  text-align: center;
  margin-bottom: $space-6;
}

.upload-icon {
  display: block;
  font-size: $font-size-4xl;
  margin-bottom: $space-3;
}

.upload-title {
  display: block;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.upload-subtitle {
  display: block;
  font-size: $font-size-base;
  color: var(--text-secondary);
}

.form-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-5;
}

.form-group {
  margin-bottom: $space-5;
}

.form-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.input-field {
  width: 100%;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-3;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  transition: all $transition-fast;

  &.active {
    background: var(--brutal-pink);
    border-color: var(--neo-purple);
    box-shadow: 3px 3px 0 var(--neo-purple);
  }
}

.type-icon {
  font-size: $font-size-2xl;
  margin-bottom: $space-1;
}

.type-name {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.form-actions {
  margin-top: $space-6;
}

.action-btn {
  width: 100%;
  padding: $space-4;
  border-radius: $radius-lg;
  text-align: center;
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  border: $border-width-md solid var(--border-color);
  transition: all $transition-fast;

  &.upload-btn {
    background: var(--brutal-pink);
    color: var(--neo-black);
    box-shadow: 5px 5px 0 var(--neo-purple);

    &:active {
      transform: translate(2px, 2px);
      box-shadow: 3px 3px 0 var(--neo-purple);
    }
  }
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
