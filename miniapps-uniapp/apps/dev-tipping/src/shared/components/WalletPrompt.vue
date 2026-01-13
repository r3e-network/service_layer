<template>
  <NeoModal :visible="visible" :title="t('title')" variant="warning" :closeable="true" @close="$emit('close')">
    <view class="wallet-prompt">
      <text class="wallet-prompt__desc">
        {{ message || t("description") }}
      </text>

      <NeoButton variant="primary" size="lg" class="wallet-prompt__btn" :loading="loading" @click="handleConnect">
        <AppIcon name="wallet" :size="18" />
        {{ t("connect") }}
      </NeoButton>
    </view>

    <template #footer>
      <NeoButton variant="ghost" size="sm" @click="$emit('close')">
        {{ t("cancel") }}
      </NeoButton>
    </template>
  </NeoModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NeoModal from "./NeoModal.vue";
import NeoButton from "./NeoButton.vue";
import AppIcon from "./AppIcon.vue";
import { createT } from "@/shared/utils/i18n";

const props = defineProps<{
  visible: boolean;
  message?: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "connect"): void;
}>();

const translations = {
  title: { en: "Wallet Required", zh: "需要钱包" },
  description: { en: "Please connect your wallet to continue.", zh: "请连接钱包以继续。" },
  connect: { en: "Connect Wallet", zh: "连接钱包" },
  cancel: { en: "Cancel", zh: "取消" },
};

const t = createT(translations);
const loading = ref(false);

const handleConnect = async () => {
  loading.value = true;
  emit("connect");
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;

.wallet-prompt {
  text-align: center;

  &__desc {
    display: block;
    margin-bottom: $space-5;
    color: var(--text-secondary);
    font-size: $font-size-sm;
    line-height: 1.5;
  }

  &__btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
  }
}
</style>
