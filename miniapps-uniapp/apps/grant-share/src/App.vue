<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("GrantShare MiniApp launched");
});

onShow(() => {
  console.log("GrantShare MiniApp shown");
});

onHide(() => {
  console.log("GrantShare MiniApp hidden");
});
</script>

<style>
page {
  background-color: #0f0f1a;
  min-height: 100vh;
}
</style>
