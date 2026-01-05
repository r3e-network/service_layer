<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { onMounted } from "vue";
import { initTheme, listenForThemeChanges } from "@/shared/utils/theme";

onLaunch(() => {
  console.log("Doomsday Clock launched");
});

onShow(() => {
  console.log("Doomsday Clock shown");
});

onHide(() => {
  console.log("Doomsday Clock hidden");
});

onMounted(() => {
  initTheme();
  listenForThemeChanges();
});
</script>

<style lang="scss">

page {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  height: 100%;
}
</style>
