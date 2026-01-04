<template>
  <view class="neo-doc">
    <view class="doc-header">
      <view class="title-row">
        <text class="doc-title">{{ title }}</text>
        <view class="doc-badge">DOCUMENTATION</view>
      </view>
      <text class="doc-subtitle">{{ subtitle }}</text>
    </view>

    <view class="doc-content">
      <view class="doc-section">
        <text class="section-label">{{ t('whatItIs') }}</text>
        <text class="section-text">{{ description }}</text>
      </view>

      <view class="doc-section">
        <text class="section-label">{{ t('howToUse') }}</text>
        <view class="steps-list">
          <view v-for="(step, index) in steps" :key="index" class="step-item">
            <view class="step-number">{{ index + 1 }}</view>
            <text class="step-text">{{ step }}</text>
          </view>
        </view>
      </view>

      <view class="doc-section">
        <text class="section-label">{{ t('onChainFeatures') }}</text>
        <view class="features-grid">
          <view v-for="feature in features" :key="feature.name" class="feature-card">
            <text class="feature-name">{{ feature.name }}</text>
            <text class="feature-desc">{{ feature.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="doc-footer">
      <text class="footer-text">NeoHub MiniApp Protocol v2.4.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { createT } from '../utils/i18n';

interface Feature {
  name: string;
  desc: string;
}

defineProps<{
  title: string;
  subtitle: string;
  description: string;
  steps: string[];
  features: Feature[];
}>();

const translations = {
  whatItIs: { en: "What is it?", zh: "这是什么？" },
  howToUse: { en: "How to use", zh: "如何使用" },
  onChainFeatures: { en: "On-Chain Features", zh: "链上特性" }
};
const t = createT(translations);
</script>

<style lang="scss" scoped>
@import "../styles/tokens.scss";

.neo-doc {
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-8;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 100%;
}

.doc-header {
  border-bottom: $border-width-md solid var(--border-color);
  padding-bottom: $space-6;
}

.title-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-2;
}

.doc-title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  letter-spacing: -1px;
}

.doc-badge {
  background: var(--accent-dim, rgba(0, 255, 163, 0.1));
  color: var(--accent-primary, #00ffa3);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
}

.doc-subtitle {
  font-size: $font-size-base;
  color: var(--text-secondary);
  line-height: 1.5;
}

.doc-content {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.doc-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.section-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  color: var(--accent-primary, #00ffa3);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.section-text {
  font-size: $font-size-base;
  color: var(--text-primary);
  line-height: 1.6;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.step-item {
  display: flex;
  gap: $space-4;
  align-items: flex-start;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: var(--text-primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  flex-shrink: 0;
}

.step-text {
  font-size: $font-size-base;
  color: var(--text-secondary);
  flex: 1;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;
}

.feature-card {
  padding: $space-4;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
}

.feature-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  display: block;
  margin-bottom: $space-1;
}

.feature-desc {
  font-size: $font-size-xs;
  color: var(--text-tertiary);
  line-height: 1.4;
}

.doc-footer {
  margin-top: $space-10;
  padding-top: $space-6;
  border-top: 1px dashed var(--border-color);
  text-align: center;
}

.footer-text {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 2px;
}
</style>
