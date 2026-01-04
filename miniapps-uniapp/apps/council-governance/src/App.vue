<script setup lang="ts">
import { initTheme, listenForThemeChanges } from "./shared/utils/theme";
import { onLaunch, onShow } from "@dcloudio/uni-app";

let cleanup: (() => void) | undefined;

// Initialize theme immediately on script load (before mount)
if (typeof window !== "undefined") {
  initTheme();
  cleanup = listenForThemeChanges();
}

onLaunch(() => {
  // Re-init theme on app launch
  initTheme();
});

onShow(() => {
  // Re-init theme when app becomes visible
  initTheme();
});
</script>

<style lang="scss">

page {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  height: 100%;
}
</style>
