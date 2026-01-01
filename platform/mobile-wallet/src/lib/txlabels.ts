/**
 * Transaction Labels
 * Custom labels and categories for transactions
 */

import * as SecureStore from "expo-secure-store";

const LABELS_KEY = "tx_labels";
const CATEGORIES_KEY = "tx_categories";

export interface TxLabel {
  txHash: string;
  label: string;
  category?: string;
  notes?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "income", name: "Income", color: "#00d4aa", icon: "arrow-down" },
  { id: "expense", name: "Expense", color: "#ff4444", icon: "arrow-up" },
  { id: "transfer", name: "Transfer", color: "#4488ff", icon: "swap-horizontal" },
  { id: "defi", name: "DeFi", color: "#aa44ff", icon: "layers" },
  { id: "nft", name: "NFT", color: "#ff8844", icon: "image" },
];

/**
 * Load all labels
 */
export async function loadLabels(): Promise<TxLabel[]> {
  const data = await SecureStore.getItemAsync(LABELS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get label for transaction
 */
export async function getLabel(txHash: string): Promise<TxLabel | null> {
  const labels = await loadLabels();
  return labels.find((l) => l.txHash === txHash) || null;
}

/**
 * Save label
 */
export async function saveLabel(label: TxLabel): Promise<void> {
  const labels = await loadLabels();
  const idx = labels.findIndex((l) => l.txHash === label.txHash);
  if (idx >= 0) {
    labels[idx] = label;
  } else {
    labels.push(label);
  }
  await SecureStore.setItemAsync(LABELS_KEY, JSON.stringify(labels));
}

/**
 * Remove label
 */
export async function removeLabel(txHash: string): Promise<void> {
  const labels = await loadLabels();
  const filtered = labels.filter((l) => l.txHash !== txHash);
  await SecureStore.setItemAsync(LABELS_KEY, JSON.stringify(filtered));
}

/**
 * Load categories
 */
export async function loadCategories(): Promise<Category[]> {
  const data = await SecureStore.getItemAsync(CATEGORIES_KEY);
  return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

/**
 * Save custom category
 */
export async function saveCategory(category: Category): Promise<void> {
  const categories = await loadCategories();
  const idx = categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) {
    categories[idx] = category;
  } else {
    categories.push(category);
  }
  await SecureStore.setItemAsync(CATEGORIES_KEY, JSON.stringify(categories));
}

/**
 * Generate category ID
 */
export function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get category by ID
 */
export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
