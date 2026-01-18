<template>
  <view class="page-container">
    <NeoDoc
      :title="t('title')"
      :subtitle="t('docSubtitle')"
      :description="t('docDescription')"
      :steps="[]"
      :features="[]"
    />
  </view>
</template>

<script setup lang="ts">
import { useI18n } from "@/composables/useI18n";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: var(--bg-body);
}
</style>
