<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("Neo Lottery launched");
});

onShow(() => {
  console.log("Neo Lottery shown");
});

onHide(() => {
  console.log("Neo Lottery hidden");
});
</script>

<style>
@import "@/shared/styles/theme.scss";

page {
  background: var(--bg-primary);
}
</style>
