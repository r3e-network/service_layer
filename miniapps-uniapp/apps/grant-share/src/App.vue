<script setup lang="ts">
import { initTheme, listenForThemeChanges } from "./shared/utils/theme";
import { onMounted, onUnmounted } from "vue";

let cleanup: (() => void) | undefined;

onMounted(() => {
  initTheme();
  cleanup = listenForThemeChanges();
});

onUnmounted(() => {
  cleanup?.();
});
</script>

<style lang="scss">

page {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  height: 100%;
}
</style>
