<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { onMounted } from "vue";
import { initTheme, listenForThemeChanges } from "@/shared/utils/theme";

onLaunch(() => {
  console.log("Gov Booster launched");
});

onShow(() => {
  console.log("Gov Booster shown");
});

onHide(() => {
  console.log("Gov Booster hidden");
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
