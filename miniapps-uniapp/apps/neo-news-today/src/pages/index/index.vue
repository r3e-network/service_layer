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
import { useI18n } from "@/composables/useI18n";
import type { NavTab } from "@/shared/components/NavBar.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "news", icon: "news", label: t("news") },
  { id: "docs", icon: "book", label: t("docs") },
]);
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
      throw new Error(t("loadFailed"));
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

@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Oswald:wght@200..700&display=swap');

$news-bg: #f3f4f6;
$news-dark: #1f2937;
$news-red: #ef4444;
$news-blue: #3b82f6;
$news-paper: #ffffff;

:global(page) {
  background: $news-bg;
}

.nnt-container {
  padding: 16px;
  padding-bottom: 80px; 
  background-color: $news-bg;
  min-height: 100vh;
  /* Dot Matrix Pattern */
  background-image: radial-gradient(#d1d5db 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Newsroom Component Overrides */
:deep(.neo-card) {
  background: $news-paper !important;
  border: 1px solid #e5e7eb !important;
  border-left: 4px solid $news-red !important;
  border-radius: 2px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  color: $news-dark !important;
  
  &.variant-danger {
    border-color: $news-red !important;
    background: #fef2f2 !important;
  }
}

:deep(.neo-button) {
  border-radius: 2px !important;
  text-transform: uppercase;
  font-weight: 800 !important;
  font-family: 'Oswald', sans-serif !important;
  letter-spacing: 0.05em;
  
  &.variant-primary {
    background: $news-red !important;
    color: #fff !important;
    border: none !important;
    
    &:active {
      background: #dc2626 !important;
    }
  }
  
  &.variant-secondary {
    background: white !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
  }
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
  border: 4px solid #e5e7eb;
  border-top-color: $news-red;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.nnt-loading-text {
  margin-top: 12px;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
}

.nnt-articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.nnt-empty-card {
  text-align: center;
  padding: 32px;
}
.nnt-empty-text {
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
}

.nnt-article-card {
  transition: transform 0.2s, box-shadow 0.2s;
  &:active {
    transform: translateY(2px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  }
}

.article-inner {
  display: flex;
  flex-direction: column;
}

.nnt-article-image {
  width: 100%;
  height: 180px;
  margin-bottom: 16px;
  border-radius: 2px;
  filter: contrast(1.1) saturate(0.9);
}

.nnt-article-content {
  display: flex;
  flex-direction: column;
}

.nnt-article-title-glass {
  font-size: 20px;
  font-weight: 800;
  color: $news-dark;
  margin-bottom: 8px;
  line-height: 1.25;
  font-family: 'Merriweather', serif;
}

.nnt-meta {
  display: flex;
  align-items: center;
}

.nnt-article-date-glass {
  font-size: 10px;
  color: white;
  text-transform: uppercase;
  font-weight: 700;
  background: $news-red;
  padding: 2px 6px;
  border-radius: 2px;
}

.nnt-article-excerpt-glass {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: 'Georgia', serif;
}

.read-more {
  display: flex;
  justify-content: flex-end;
  border-top: 1px dashed #e5e7eb;
  padding-top: 12px;
}
.read-more-text {
  font-size: 12px;
  font-weight: 700;
  color: $news-blue;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  &:hover {
    text-decoration: underline;
  }
}

.tab-content {
  padding: 16px;
  padding-bottom: 80px;
}
.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
