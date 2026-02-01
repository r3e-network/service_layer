/**
 * AI Assistant
 * Chat-based wallet assistant
 */

import * as SecureStore from "expo-secure-store";

const CHAT_HISTORY_KEY = "ai_chat_history";
const AI_SETTINGS_KEY = "ai_settings";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AISettings {
  enabled: boolean;
  suggestions: boolean;
  language: string;
}

const DEFAULT_SETTINGS: AISettings = {
  enabled: true,
  suggestions: true,
  language: "en",
};

/**
 * Load chat history
 */
export async function loadChatHistory(): Promise<ChatMessage[]> {
  const data = await SecureStore.getItemAsync(CHAT_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save chat message
 */
export async function saveChatMessage(
  msg: Omit<ChatMessage, "id" | "timestamp">
): Promise<ChatMessage> {
  const history = await loadChatHistory();
  const message: ChatMessage = {
    ...msg,
    id: generateMessageId(),
    timestamp: Date.now(),
  };
  history.push(message);
  await SecureStore.setItemAsync(CHAT_HISTORY_KEY, JSON.stringify(history.slice(-100)));
  return message;
}

/**
 * Clear chat history
 */
export async function clearChatHistory(): Promise<void> {
  await SecureStore.setItemAsync(CHAT_HISTORY_KEY, JSON.stringify([]));
}

/**
 * Load AI settings
 */
export async function loadAISettings(): Promise<AISettings> {
  const data = await SecureStore.getItemAsync(AI_SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

/**
 * Save AI settings
 */
export async function saveAISettings(settings: AISettings): Promise<void> {
  await SecureStore.setItemAsync(AI_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Generate message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
