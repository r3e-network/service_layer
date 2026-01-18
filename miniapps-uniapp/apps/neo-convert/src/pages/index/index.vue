<template>
  <AppLayout :tabs="tabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="content-area">
      <view class="hero">
        <ScrollReveal animation="fade-down" :duration="800">
          <text class="hero-icon">🛠️</text>
          <text class="hero-title">{{ t('heroTitle') }}</text>
          <text class="hero-subtitle">{{ t('heroSubtitle') }}</text>
        </ScrollReveal>
      </view>

      <ScrollReveal animation="fade-up" :delay="200" v-if="activeTab === 'generate'" key="gen">
        <AccountGenerator />
      </ScrollReveal>
      
      <ScrollReveal animation="fade-up" :delay="200" v-if="activeTab === 'convert'" key="conv">
        <ConverterTool />
      </ScrollReveal>
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import AppLayout from "@/shared/components/AppLayout.vue";
import ScrollReveal from "@/shared/components/ScrollReveal.vue";
import AccountGenerator from "./components/AccountGenerator.vue";
import ConverterTool from "./components/ConverterTool.vue";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();
const activeTab = ref("generate");

const tabs = computed(() => [
  { id: "generate", label: t("tabGenerate"), icon: "wallet" },
  { id: "convert", label: t("tabConvert"), icon: "sync" }
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;

.content-area {
  padding: 16px;
  min-height: 100%;
}

.hero {
  text-align: center;
  margin: 30px 0 40px;
  
  .hero-icon {
    font-size: 40px;
    display: block;
    margin-bottom: 16px;
  }
  
  .hero-title {
    display: block;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
  }
  
  .hero-subtitle {
    display: block;
    font-size: 15px;
    color: var(--text-secondary);
    max-width: 80%;
    margin: 0 auto;
    line-height: 1.5;
  }
}
</style>
