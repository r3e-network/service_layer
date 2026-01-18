<template>
  <view class="modal-overlay" @click.self="$emit('close')">
    <view class="modal-content">
      <view class="header-actions">
        <view class="action-btn share" @click="$emit('share')">🔗</view>
        <view class="action-btn close" @click="$emit('close')">×</view>
      </view>
      
      <!-- Tombstone Header -->
      <view class="tombstone-header">
        <view class="photo-frame">
          <image v-if="memorial.photoHash" :src="memorial.photoHash" mode="aspectFill" />
          <text v-else class="default-icon">🕯️</text>
        </view>
        <text class="name">{{ memorial.name }}</text>
        <text class="lifespan">{{ memorial.birthYear }} - {{ memorial.deathYear }}</text>
        <text class="relationship">{{ memorial.relationship || t("foreverRemember") }}</text>
      </view>
      
      <!-- Biography -->
      <view class="section">
        <text class="section-title">📜 {{ t("biography") }}</text>
        <text class="biography">{{ memorial.biography || t("noBio") }}</text>
      </view>
      
      <!-- Offerings Received -->
      <view class="section">
        <text class="section-title">🙏 {{ t("offeringsReceived") }}</text>
        <view class="offering-counts">
          <view class="count-item">
            <text class="icon">🕯️</text>
            <text class="label">{{ t("incense") }}</text>
            <text class="count">{{ memorial.offerings.incense }}</text>
          </view>
          <view class="count-item">
            <text class="icon">🕯</text>
            <text class="label">{{ t("candle") }}</text>
            <text class="count">{{ memorial.offerings.candle }}</text>
          </view>
          <view class="count-item">
            <text class="icon">🌸</text>
            <text class="label">{{ t("flower") }}</text>
            <text class="count">{{ memorial.offerings.flower }}</text>
          </view>
          <view class="count-item">
            <text class="icon">🍇</text>
            <text class="label">{{ t("fruit") }}</text>
            <text class="count">{{ memorial.offerings.fruit }}</text>
          </view>
          <view class="count-item">
            <text class="icon">🍶</text>
            <text class="label">{{ t("wine") }}</text>
            <text class="count">{{ memorial.offerings.wine }}</text>
          </view>
          <view class="count-item">
            <text class="icon">🍱</text>
            <text class="label">{{ t("feast") }}</text>
            <text class="count">{{ memorial.offerings.feast }}</text>
          </view>
        </view>
      </view>
      
      <!-- Pay Tribute -->
      <view class="section">
        <text class="section-title">🕯️ {{ t("payTribute") }}</text>
        <view class="offerings-grid">
          <view
            v-for="offering in offerings"
            :key="offering.type"
            class="offering-option"
            :class="{ selected: selectedOffering === offering.type }"
            @click="selectedOffering = offering.type"
          >
            <text class="icon">{{ offering.icon }}</text>
            <text class="name">{{ t(offering.nameKey as any) }}</text>
            <text class="cost">{{ offering.cost }} GAS</text>
          </view>
        </view>
        
        <view class="message-input">
          <input
            v-model="message"
            :placeholder="t('messagePlaceholder')"
            class="input"
          />
        </view>
        
        <view class="tribute-btn" @click="payTribute" :class="{ disabled: isPaying }">
          <text>{{ isPaying ? t("paying") : t("payTributeBtn") }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";

interface Memorial {
  id: number;
  name: string;
  photoHash: string;
  birthYear: number;
  deathYear: number;
  relationship: string;
  biography: string;
  offerings: {
    incense: number;
    candle: number;
    flower: number;
    fruit: number;
    wine: number;
    feast: number;
  };
}

interface Offering {
  type: number;
  nameKey: string;
  icon: string;
  cost: number;
}

const props = defineProps<{
  memorial: Memorial;
  offerings: Offering[];
}>();

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
  "tribute-paid": [memorialId: number, offeringType: number];
  share: [];
}>();

const APP_ID = "miniapp-memorial-shrine";
const { address, connect, invokeContract, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);

const selectedOffering = ref(1);
const message = ref("");
const isPaying = ref(false);

const payTribute = async () => {
  if (isPaying.value) return;
  isPaying.value = true;
  
  try {
    const offering = props.offerings.find(o => o.type === selectedOffering.value);
    if (!offering) throw new Error(t("invalidOffering"));
    
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("connectWallet"));
    
    const contract = await getContractAddress();
    
    const payment = await payGAS(String(offering.cost), `tribute:${props.memorial.id}:${offering.type}`);
    const receiptId = payment?.receipt_id;
    if (!receiptId) throw new Error(t("paymentFailed"));
    
    await invokeContract({
      contractAddress: contract,
      operation: "payTribute",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: String(props.memorial.id) },
        { type: "Integer", value: String(selectedOffering.value) },
        { type: "String", value: message.value },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    
    uni.showToast({ title: t("tributeSuccess"), icon: "success" });
    message.value = "";
    emit("tribute-paid", props.memorial.id, selectedOffering.value);
  } catch (e: any) {
    uni.showToast({ title: e?.message || t("error"), icon: "error" });
  } finally {
    isPaying.value = false;
  }
};
</script>

<style lang="scss" scoped>
$gold: #c9a962;
$gold-light: #e6d4a8;
$bg-dark: #12161f;
$bg-medium: #1a1f2e;
$text: #e8e6e3;
$muted: #6b6965;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  max-height: 85vh;
  background: $bg-dark;
  border-radius: 16px;
  border: 1px solid rgba($gold, 0.3);
  overflow-y: auto;
  position: relative;
}

.header-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.action-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: $text;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.close {
    font-size: 22px;
  }
}

.tombstone-header {
  text-align: center;
  padding: 24px 16px;
  background: linear-gradient(180deg, $bg-medium, $bg-dark);
  border-radius: 16px 16px 0 0;
}

.photo-frame {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  border: 3px solid $gold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba($gold, 0.1), transparent);
  overflow: hidden;
  
  image {
    width: 100%;
    height: 100%;
  }
  
  .default-icon {
    font-size: 32px;
  }
}

.name {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: $gold;
  margin-bottom: 4px;
}

.lifespan {
  display: block;
  font-size: 14px;
  color: $muted;
}

.relationship {
  display: block;
  font-size: 12px;
  color: $muted;
  margin-top: 4px;
}

.section {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title {
  display: block;
  font-size: 14px;
  color: $gold-light;
  margin-bottom: 12px;
}

.biography {
  font-size: 13px;
  color: $text;
  line-height: 1.6;
}

.offering-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.count-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  font-size: 12px;
  
  .icon { font-size: 14px; }
  .label { color: $text; }
  .count { color: $gold-light; font-weight: 600; }
}

.offerings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.offering-option {
  flex: 1;
  min-width: 80px;
  padding: 10px 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  
  &.selected {
    border-color: $gold;
    background: rgba($gold, 0.15);
  }
  
  .icon { display: block; font-size: 24px; margin-bottom: 4px; }
  .name { display: block; font-size: 12px; color: $text; }
  .cost { display: block; font-size: 10px; color: $muted; }
}

.message-input {
  margin-bottom: 12px;
  
  .input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: $text;
    font-size: 13px;
  }
}

.tribute-btn {
  padding: 14px;
  background: linear-gradient(135deg, $gold, #a08040);
  border-radius: 10px;
  text-align: center;
  
  text {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  &.disabled {
    opacity: 0.6;
  }
}
</style>
