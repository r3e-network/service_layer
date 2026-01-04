<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { initTheme } from "@/shared/utils/theme";

onLaunch(() => {
  initTheme();
  console.log("Neo Explorer launched");
});

onShow(() => {
  console.log("Neo Explorer shown");
});

onHide(() => {
  console.log("Neo Explorer hidden");
});
</script>

<style lang="scss">

page {
  background: linear-gradient(135deg, #0d1117 0%, #1a1a2e 100%);
  height: 100%;
}
</style>
