<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <text class="title">Neo Chat</text>
      <text class="subtitle">Decentralized Messaging</text>
      <view v-if="userAddress" class="user-badge">
        <text>{{ shortenAddress(userAddress) }}</text>
      </view>
    </view>

    <!-- Tab Switcher -->
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'rooms' }" @click="activeTab = 'rooms'">
        <text>Rooms</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 'direct' }" @click="activeTab = 'direct'">
        <text>Direct</text>
      </view>
    </view>

    <!-- Rooms List -->
    <view v-if="activeTab === 'rooms' && !currentRoom" class="panel">
      <view class="section-header">
        <text class="section-title">Public Rooms</text>
        <button class="create-btn" @click="showCreateRoom = true">+ New</button>
      </view>
      <view v-for="room in rooms" :key="room.id" class="room-item" @click="enterRoom(room)">
        <view class="room-icon">{{ room.icon }}</view>
        <view class="room-info">
          <text class="room-name">{{ room.name }}</text>
          <text class="room-members">{{ room.members }} members</text>
        </view>
        <view class="room-unread" v-if="room.unread > 0">{{ room.unread }}</view>
      </view>
    </view>

    <!-- Direct Messages List -->
    <view v-if="activeTab === 'direct' && !currentDM" class="panel">
      <view class="section-header">
        <text class="section-title">Direct Messages</text>
        <button class="create-btn" @click="showNewDM = true">+ New</button>
      </view>
      <view v-for="dm in directMessages" :key="dm.address" class="dm-item" @click="enterDM(dm)">
        <view class="dm-avatar">{{ dm.address.slice(-2) }}</view>
        <view class="dm-info">
          <text class="dm-name">{{ shortenAddress(dm.address) }}</text>
          <text class="dm-preview">{{ dm.lastMessage }}</text>
        </view>
        <view class="dm-unread" v-if="dm.unread > 0">{{ dm.unread }}</view>
      </view>
    </view>

    <!-- Chat View -->
    <view v-if="currentRoom || currentDM" class="chat-view">
      <view class="chat-header">
        <button class="back-btn" @click="exitChat">←</button>
        <text class="chat-title">{{ currentRoom?.name || shortenAddress(currentDM?.address || "") }}</text>
      </view>
      <scroll-view class="messages-container" scroll-y :scroll-top="scrollTop">
        <view v-for="msg in currentMessages" :key="msg.id" class="message" :class="{ own: msg.sender === userAddress }">
          <text class="msg-sender">{{ shortenAddress(msg.sender) }}</text>
          <text class="msg-content">{{ msg.content }}</text>
          <text class="msg-time">{{ formatTime(msg.timestamp) }}</text>
        </view>
      </scroll-view>
      <view class="input-bar">
        <input v-model="newMessage" placeholder="Type a message..." class="msg-input" @confirm="sendMessage" />
        <button class="send-btn" @click="sendMessage">Send</button>
      </view>
    </view>

    <!-- Create Room Modal -->
    <view v-if="showCreateRoom" class="modal-overlay" @click="showCreateRoom = false">
      <view class="modal" @click.stop>
        <text class="modal-title">Create Room</text>
        <view class="input-group">
          <text class="input-label">Room Name</text>
          <input v-model="newRoomName" placeholder="Enter room name" class="text-input" />
        </view>
        <view class="modal-actions">
          <button class="cancel-btn" @click="showCreateRoom = false">Cancel</button>
          <button class="confirm-btn" @click="createRoom">Create</button>
        </view>
      </view>
    </view>

    <!-- New DM Modal -->
    <view v-if="showNewDM" class="modal-overlay" @click="showNewDM = false">
      <view class="modal" @click.stop>
        <text class="modal-title">New Message</text>
        <view class="input-group">
          <text class="input-label">Wallet Address</text>
          <input v-model="newDMAddress" placeholder="NX..." class="text-input" />
        </view>
        <view class="modal-actions">
          <button class="cancel-btn" @click="showNewDM = false">Cancel</button>
          <button class="confirm-btn" @click="startDM">Start Chat</button>
        </view>
      </view>
    </view>

    <!-- Status -->
    <view v-if="statusMessage" class="status" :class="statusType">
      <text>{{ statusMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";

const { address, connect } = useWallet();

interface Room {
  id: string;
  name: string;
  icon: string;
  members: number;
  unread: number;
}

interface DirectMessage {
  address: string;
  lastMessage: string;
  unread: number;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

// State
const activeTab = ref<"rooms" | "direct">("rooms");
const userAddress = ref("");
const rooms = ref<Room[]>([
  { id: "1", name: "Neo General", icon: "💬", members: 128, unread: 3 },
  { id: "2", name: "DeFi Discussion", icon: "💰", members: 45, unread: 0 },
  { id: "3", name: "NFT Collectors", icon: "🎨", members: 67, unread: 1 },
]);
const directMessages = ref<DirectMessage[]>([
  { address: "NXtest123abc", lastMessage: "Hey, how are you?", unread: 2 },
  { address: "NXdev456def", lastMessage: "Thanks for the help!", unread: 0 },
]);
const currentRoom = ref<Room | null>(null);
const currentDM = ref<DirectMessage | null>(null);
const currentMessages = ref<Message[]>([]);
const newMessage = ref("");
const scrollTop = ref(0);
const showCreateRoom = ref(false);
const showNewDM = ref(false);
const newRoomName = ref("");
const newDMAddress = ref("");
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");

// Methods
function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function showStatus(msg: string, type: "success" | "error") {
  statusMessage.value = msg;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 3000);
}

function enterRoom(room: Room) {
  currentRoom.value = room;
  room.unread = 0;
  loadRoomMessages(room.id);
}

function enterDM(dm: DirectMessage) {
  currentDM.value = dm;
  dm.unread = 0;
  loadDMMessages(dm.address);
}

function exitChat() {
  currentRoom.value = null;
  currentDM.value = null;
  currentMessages.value = [];
}

function loadRoomMessages(roomId: string) {
  currentMessages.value = [
    { id: "1", sender: "NXuser1", content: "Welcome to the room!", timestamp: Date.now() - 60000 },
    { id: "2", sender: "NXuser2", content: "Hello everyone!", timestamp: Date.now() - 30000 },
  ];
  scrollToBottom();
}

function loadDMMessages(address: string) {
  currentMessages.value = [
    { id: "1", sender: address, content: "Hey there!", timestamp: Date.now() - 120000 },
    { id: "2", sender: userAddress.value, content: "Hi! How can I help?", timestamp: Date.now() - 60000 },
  ];
  scrollToBottom();
}

function scrollToBottom() {
  setTimeout(() => (scrollTop.value = 99999), 100);
}

async function sendMessage() {
  if (!newMessage.value.trim()) return;
  const msg: Message = {
    id: Date.now().toString(),
    sender: userAddress.value,
    content: newMessage.value,
    timestamp: Date.now(),
  };
  currentMessages.value.push(msg);
  newMessage.value = "";
  scrollToBottom();
}

function createRoom() {
  if (!newRoomName.value.trim()) return;
  const room: Room = {
    id: Date.now().toString(),
    name: newRoomName.value,
    icon: "💬",
    members: 1,
    unread: 0,
  };
  rooms.value.unshift(room);
  newRoomName.value = "";
  showCreateRoom.value = false;
  showStatus("Room created!", "success");
}

function startDM() {
  if (!newDMAddress.value.trim()) return;
  const dm: DirectMessage = {
    address: newDMAddress.value,
    lastMessage: "",
    unread: 0,
  };
  directMessages.value.unshift(dm);
  newDMAddress.value = "";
  showNewDM.value = false;
  enterDM(dm);
}

onMounted(async () => {
  await connect();
  userAddress.value = address.value || "NXguest";
});
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px;
  text-align: center;
}

.title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #60a5fa;
}

.subtitle {
  display: block;
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.user-badge {
  margin-top: 8px;
  display: inline-block;
  background: rgba(96, 165, 250, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  color: #60a5fa;
  font-size: 12px;
}

.tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  margin: 0 20px 16px;
  border-radius: 12px;
  padding: 4px;
}

.tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  color: #888;
}

.tab.active {
  background: #60a5fa;
  color: #0f0f1a;
  font-weight: 600;
}

.panel {
  flex: 1;
  padding: 0 20px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.create-btn {
  background: #60a5fa;
  color: #0f0f1a;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.room-item,
.dm-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.room-icon,
.dm-avatar {
  width: 44px;
  height: 44px;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #60a5fa;
}

.room-info,
.dm-info {
  flex: 1;
  margin-left: 12px;
}

.room-name,
.dm-name {
  display: block;
  font-size: 16px;
  color: #fff;
}

.room-members,
.dm-preview {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.room-unread,
.dm-unread {
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
}

.back-btn {
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 20px;
  padding: 8px;
}

.chat-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-left: 8px;
}

.messages-container {
  flex: 1;
  padding: 16px 20px;
  height: 400px;
}

.message {
  max-width: 80%;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.message.own {
  margin-left: auto;
  background: rgba(96, 165, 250, 0.3);
}

.msg-sender {
  display: block;
  font-size: 11px;
  color: #60a5fa;
  margin-bottom: 4px;
}

.msg-content {
  display: block;
  font-size: 14px;
  color: #fff;
}

.msg-time {
  display: block;
  font-size: 10px;
  color: #666;
  text-align: right;
  margin-top: 4px;
}

.input-bar {
  display: flex;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  gap: 8px;
}

.msg-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 20px;
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
}

.send-btn {
  background: #60a5fa;
  color: #0f0f1a;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modal-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #888;
}

.confirm-btn {
  background: #60a5fa;
  color: #0f0f1a;
}

.status {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.status.success {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.status.error {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}
</style>
