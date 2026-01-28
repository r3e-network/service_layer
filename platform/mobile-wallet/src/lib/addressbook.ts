/**
 * Address Book Management
 * Handles storage and management of saved addresses
 */

import * as SecureStore from "expo-secure-store";

const ADDRESSBOOK_KEY = "address_book";

export interface Contact {
  id: string;
  name: string;
  address: string;
  memo?: string;
  createdAt: number;
  updatedAt: number;
}

export async function loadContacts(): Promise<Contact[]> {
  const data = await SecureStore.getItemAsync(ADDRESSBOOK_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveContact(
  contact: Omit<Contact, "id" | "createdAt" | "updatedAt">
): Promise<Contact> {
  const contacts = await loadContacts();
  const now = Date.now();
  const newContact: Contact = {
    ...contact,
    id: generateContactId(),
    createdAt: now,
    updatedAt: now,
  };
  contacts.push(newContact);
  await SecureStore.setItemAsync(ADDRESSBOOK_KEY, JSON.stringify(contacts));
  return newContact;
}

export async function updateContact(
  id: string,
  updates: Partial<Omit<Contact, "id" | "createdAt">>
): Promise<void> {
  const contacts = await loadContacts();
  const index = contacts.findIndex((c) => c.id === id);
  if (index !== -1) {
    contacts[index] = {
      ...contacts[index],
      ...updates,
      updatedAt: Date.now(),
    };
    await SecureStore.setItemAsync(ADDRESSBOOK_KEY, JSON.stringify(contacts));
  }
}

export async function removeContact(id: string): Promise<void> {
  const contacts = await loadContacts();
  const filtered = contacts.filter((c) => c.id !== id);
  await SecureStore.setItemAsync(ADDRESSBOOK_KEY, JSON.stringify(filtered));
}

export async function getContactByAddress(address: string): Promise<Contact | undefined> {
  const contacts = await loadContacts();
  return contacts.find((c) => c.address === address);
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const contacts = await loadContacts();
  const lowerQuery = query.toLowerCase();
  return contacts.filter(
    (c) => c.name.toLowerCase().includes(lowerQuery) || c.address.toLowerCase().includes(lowerQuery)
  );
}

export function generateContactId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidNeoAddress(address: string): boolean {
  // Neo N3 addresses start with 'N' and are 34 characters
  return /^N[A-Za-z0-9]{33}$/.test(address);
}
