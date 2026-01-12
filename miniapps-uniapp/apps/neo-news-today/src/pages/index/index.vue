<template>
  <AppLayout title="Neo News Today">
    <view class="nnt-container">
      <!-- Header -->
      <view class="nnt-header">
        <image
          src="https://neonewstoday.com/wp-content/uploads/2020/01/nnt-logo.png"
          class="nnt-logo"
          mode="aspectFit"
        />
        <text class="nnt-tagline">Latest Neo Ecosystem News</text>
      </view>

      <!-- Loading State -->
      <view v-if="loading" class="nnt-loading">
        <view class="nnt-spinner" />
        <text class="nnt-loading-text">Loading articles...</text>
      </view>

      <!-- Articles List -->
      <view v-else class="nnt-articles">
        <view v-for="article in articles" :key="article.id" class="nnt-article" @click="openArticle(article)">
          <image v-if="article.image" :src="article.image" class="nnt-article-image" mode="aspectFill" />
          <view class="nnt-article-content">
            <text class="nnt-article-title">{{ article.title }}</text>
            <text class="nnt-article-date">{{ formatDate(article.date) }}</text>
            <text class="nnt-article-excerpt">{{ article.excerpt }}</text>
          </view>
        </view>
      </view>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { AppLayout } from "@/shared/components";

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

onMounted(async () => {
  await fetchArticles();
});

async function fetchArticles() {
  loading.value = true;
  try {
    // Fetch from NNT RSS or API
    const res = await fetch("/api/nnt-news?limit=20");
    if (res.ok) {
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
    }
  } catch (err) {
    console.error("Failed to fetch articles:", err);
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openArticle(article: Article) {
  const popup = window.open(article.url, "_blank", "noopener,noreferrer");
  if (popup) popup.opener = null;
}
</script>

<style lang="scss">
.nnt-container {
  padding: 20px;
}

.nnt-header {
  text-align: center;
  margin-bottom: 24px;
}

.nnt-logo {
  width: 120px;
  height: 40px;
  margin-bottom: 8px;
}

.nnt-tagline {
  font-size: 14px;
  color: var(--text-secondary);
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
  border: 3px solid rgba(159, 157, 243, 0.2);
  border-top-color: #9f9df3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.nnt-loading-text {
  margin-top: 12px;
  color: var(--text-secondary);
}

.nnt-articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nnt-article {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nnt-article:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.nnt-article-image {
  width: 100%;
  height: 160px;
}

.nnt-article-content {
  padding: 16px;
}

.nnt-article-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: block;
}

.nnt-article-date {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  display: block;
}

.nnt-article-excerpt {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
