/**
 * Multi-Account Management
 * Handles storage and management of multiple wallet accounts
 */

import * as SecureStore from "expo-secure-store";

const ACCOUNTS_KEY = "wallet_accounts";
const ACTIVE_ACCOUNT_KEY = "active_account";

export interface Account {
  id: string;
  name: string;
  address: string;
  createdAt: number;
}

export async function loadAccounts(): Promise<Account[]> {
  const data = await SecureStore.getItemAsync(ACCOUNTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveAccount(account: Account): Promise<void> {
  const accounts = await loadAccounts();
  const exists = accounts.some((a) => a.id === account.id);
  if (!exists) {
    accounts.push(account);
    await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<void> {
  const accounts = await loadAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index !== -1) {
    accounts[index] = { ...accounts[index], ...updates };
    await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export async function removeAccount(id: string): Promise<void> {
  const accounts = await loadAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(filtered));
}

export async function getActiveAccountId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_ACCOUNT_KEY);
}

export async function setActiveAccountId(id: string): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, id);
}

export function generateAccountId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
