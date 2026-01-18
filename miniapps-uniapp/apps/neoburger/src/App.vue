<script setup lang="ts">
import { initTheme, listenForThemeChanges } from "@/shared/utils/theme";
import { onMounted, onUnmounted } from "vue";

let cleanupTheme: (() => void) | undefined;

onMounted(() => {
  initTheme();
  cleanupTheme = listenForThemeChanges();
});

onUnmounted(() => {
  cleanupTheme?.();
});
</script>

<style lang="scss">
@use "@/shared/styles/variables.scss";

page {
  background: #f7f2ea;
  color: #2a1f16;
  height: 100%;
}
</style>
