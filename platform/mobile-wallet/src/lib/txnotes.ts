/**
 * Transaction Notes
 * Personal notes for transactions
 */

import * as SecureStore from "expo-secure-store";

const NOTES_KEY = "tx_notes";

export interface TxNote {
  txHash: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Load all notes
 */
export async function loadNotes(): Promise<TxNote[]> {
  const data = await SecureStore.getItemAsync(NOTES_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get note for transaction
 */
export async function getNote(txHash: string): Promise<TxNote | null> {
  const notes = await loadNotes();
  return notes.find((n) => n.txHash === txHash) || null;
}

/**
 * Save note
 */
export async function saveNote(txHash: string, note: string): Promise<void> {
  const notes = await loadNotes();
  const idx = notes.findIndex((n) => n.txHash === txHash);
  const now = Date.now();
  if (idx >= 0) {
    notes[idx] = { ...notes[idx], note, updatedAt: now };
  } else {
    notes.push({ txHash, note, createdAt: now, updatedAt: now });
  }
  await SecureStore.setItemAsync(NOTES_KEY, JSON.stringify(notes));
}

/**
 * Delete note
 */
export async function deleteNote(txHash: string): Promise<void> {
  const notes = await loadNotes();
  const filtered = notes.filter((n) => n.txHash !== txHash);
  await SecureStore.setItemAsync(NOTES_KEY, JSON.stringify(filtered));
}
