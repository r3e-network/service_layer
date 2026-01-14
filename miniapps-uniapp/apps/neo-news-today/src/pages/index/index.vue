<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    
    <!-- News Tab -->
    <view v-if="activeTab === 'news'" class="nnt-container">
      <!-- Loading State -->
      <view v-if="loading" class="nnt-loading">
        <view class="nnt-spinner" />
        <text class="nnt-loading-text">{{ t("loading") }}</text>
      </view>

      <!-- Articles List -->
      <view v-else class="nnt-articles">
        <NeoCard v-if="errorMessage" variant="danger" class="nnt-empty-card">
          <text class="nnt-empty-text">{{ errorMessage }}</text>
        </NeoCard>
        <template v-else>
          <NeoCard
            v-for="article in articles"
            :key="article.id"
            variant="erobo"
            class="nnt-article-card"
            @click="openArticle(article)"
          >
            <view class="article-inner">
              <image v-if="article.image" :src="article.image" class="nnt-article-image" mode="aspectFill" />
              <view class="nnt-article-content">
                <text class="nnt-article-title-glass">{{ article.title }}</text>
                <view class="nnt-meta mb-2">
                  <text class="nnt-article-date-glass">{{ formatDate(article.date) }}</text>
                </view>
                <text class="nnt-article-excerpt-glass">{{ article.excerpt }}</text>
                <view class="read-more mt-3">
                  <text class="read-more-text">{{ t("readMore") }} →</text>
                </view>
              </view>
            </view>
          </NeoCard>
          <NeoCard v-if="articles.length === 0" variant="erobo" class="nnt-empty-card">
            <text class="nnt-empty-text">{{ t("noArticles") }}</text>
          </NeoCard>
        </template>
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
import { ref, onMounted, computed } from "vue";
import { AppLayout, NeoCard, NeoDoc } from "@/shared/components";
import { createT } from "@/shared/utils/i18n";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Neo News Today", zh: "Neo今日新闻" },
  tagline: { en: "Latest Neo Ecosystem News", zh: "Neo生态最新资讯" },
  loading: { en: "Loading articles...", zh: "加载文章中..." },
  noArticles: { en: "No articles available", zh: "暂无文章" },
  loadFailed: { en: "Unable to load articles", zh: "文章加载失败" },
  readMore: { en: "Read Report", zh: "阅读报告" },
  news: { en: "News", zh: "新闻" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Your source for Neo ecosystem updates", zh: "您的Neo生态更新来源" },
  docDescription: {
    en: "Neo News Today (NNT) delivers the latest news, interviews, and events from the Neo blockchain ecosystem. Stay informed about developments, dApps, and community initiatives.",
    zh: "Neo News Today (NNT) 提供来自 Neo 区块链生态系统的最新新闻、采访和活动。随时了解开发进展、dApp 和社区倡议。",
  },
  step1: { en: "Read the latest community news", zh: "阅读最新社区新闻" },
  step2: { en: "Tap on any article to read the full report", zh: "点击任意文章阅读完整报告" },
  step3: { en: "Stay updated with ecosystem developments", zh: "随时了解生态系统发展" },
  step4: { en: "Share interesting news with the community", zh: "与社区分享有趣的新闻" },
  feature1Name: { en: "Ecosystem Coverage", zh: "生态系统覆盖" },
  feature1Desc: { en: "Comprehensive news on Neo N3 and legacy.", zh: "全面报道 Neo N3 和传统链。" },
  feature2Name: { en: "Community Focus", zh: "社区聚焦" },
  feature2Desc: { en: "Highlighting developers and projects.", zh: "聚焦开发者和项目。" },
};

const t = createT(translations);

const navTabs: NavTab[] = [
  { id: "news", icon: "news", label: t("news") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("news");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image?: string;
  url: string;
}

const loading = ref(true);
const articles = ref<Article[]>([]);
const errorMessage = ref("");

onMounted(async () => {
  await fetchArticles();
});

async function fetchArticles() {
  loading.value = true;
  errorMessage.value = "";
  try {
    // Fetch from NNT RSS or API
    const res = await fetch("/api/nnt-news?limit=20");
    if (!res.ok) {
      throw new Error("Failed to fetch articles");
    }
    const data = await res.json();
    const rawArticles = Array.isArray(data.articles) ? data.articles : [];
    articles.value = rawArticles
      .map((article: any) => ({
        id: String(article.id || ""),
        title: String(article.title || ""),
        excerpt: String(article.summary || article.excerpt || ""),
        date: String(article.pubDate || article.date || ""),
        image: article.imageUrl || article.image || undefined,
        url: String(article.link || article.url || ""),
      }))
      .filter((article: Article) => article.id && article.title && article.url);
  } catch (err) {
    console.error("Failed to fetch articles:", err);
    articles.value = [];
    errorMessage.value = t("loadFailed");
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string): string {
  if(!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openArticle(article: Article) {
  const url = article.url;
  if (!url) return;

  const uniApi = (globalThis as any)?.uni;
  if (uniApi?.openURL) {
    uniApi.openURL({ url });
    return;
  }

  const plusApi = (globalThis as any)?.plus;
  if (plusApi?.runtime?.openURL) {
    plusApi.runtime.openURL(url);
    return;
  }

  if (typeof window !== "undefined" && window.open) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.nnt-container {
  padding: $space-4;
  padding-bottom: 80px; 
}

.nnt-header-glass {
  text-align: center;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nnt-logo {
  width: 140px;
  height: 48px;
  margin-bottom: 8px;
  filter: brightness(1.2) drop-shadow(0 0 5px rgba(255,255,255,0.2));
}

.nnt-tagline-glass {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.nnt-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.nnt-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 229, 153, 0.2);
  border-top-color: #00E599;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.nnt-loading-text {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.nnt-articles {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.nnt-empty-card {
  text-align: center;
  padding: $space-5;
}
.nnt-empty-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.nnt-article-card {
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}

.article-inner {
  display: flex;
  flex-direction: column;
}

.nnt-article-image {
  width: 100%;
  height: 180px;
  margin-bottom: $space-4;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nnt-article-content {
  display: flex;
  flex-direction: column;
}

.nnt-article-title-glass {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: $space-2;
  line-height: 1.3;
}

.nnt-meta {
  display: flex;
  align-items: center;
}

.nnt-article-date-glass {
  font-size: 10px;
  color: #00E599;
  text-transform: uppercase;
  font-weight: 700;
  background: rgba(0, 229, 153, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.nnt-article-excerpt-glass {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  display: flex;
  justify-content: flex-end;
}
.read-more-text {
  font-size: 11px;
  font-weight: 700;
  color: #9f9df3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tab-content {
  padding: $space-4;
  padding-bottom: 80px;
}
.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
