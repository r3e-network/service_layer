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
@use "@/shared/styles/variables.scss";

page {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  height: 100%;
}
</style>
