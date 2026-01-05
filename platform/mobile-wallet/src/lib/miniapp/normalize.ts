/**
 * MiniApp Normalization Utilities
 * Validates and normalizes MiniApp data from various sources
 */

import type { MiniAppCategory, MiniAppInfo, MiniAppPermissions, MiniAppLimits } from "@/types/miniapp";

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function normalizeCategory(value: unknown): MiniAppCategory {
  const raw = toString(value).trim().toLowerCase();
  if (
    raw === "gaming" ||
    raw === "defi" ||
    raw === "governance" ||
    raw === "utility" ||
    raw === "social" ||
    raw === "nft"
  ) {
    return raw;
  }
  return "utility";
}

export function normalizePermissions(value: unknown, fallback?: MiniAppPermissions): MiniAppPermissions {
  const raw = asObject(value);
  const has = (key: string) => Object.prototype.hasOwnProperty.call(raw, key);

  const payments = has("payments") ? raw.payments : fallback?.payments;
  const governance = has("governance") ? raw.governance : fallback?.governance;
  const randomness = has("randomness") || has("rng") ? (raw.randomness ?? raw.rng) : fallback?.randomness;
  const datafeed = has("datafeed") ? raw.datafeed : fallback?.datafeed;
  const confidential = has("confidential") ? raw.confidential : fallback?.confidential;
  const automation = has("automation") ? raw.automation : fallback?.automation;

  return {
    payments: Boolean(payments),
    governance: Boolean(governance),
    randomness: Boolean(randomness),
    datafeed: Boolean(datafeed),
    confidential: Boolean(confidential),
    automation: Boolean(automation),
  };
}

export function normalizeLimits(value: unknown, fallback?: MiniAppLimits | null): MiniAppLimits | null {
  const raw = asObject(value);
  const out: MiniAppLimits = {};

  if (raw.max_gas_per_tx !== undefined) {
    out.max_gas_per_tx = toString(raw.max_gas_per_tx);
  }
  if (raw.daily_gas_cap_per_user !== undefined) {
    out.daily_gas_cap_per_user = toString(raw.daily_gas_cap_per_user);
  }
  if (raw.governance_cap !== undefined) {
    out.governance_cap = toString(raw.governance_cap);
  }

  if (Object.keys(out).length === 0) {
    return fallback && Object.keys(fallback).length > 0 ? fallback : null;
  }
  return out;
}

export function normalizeStatus(value: unknown, fallback?: MiniAppInfo["status"]): MiniAppInfo["status"] {
  const raw = toString(value).trim().toLowerCase();
  if (raw === "active" || raw === "disabled" || raw === "pending") {
    return raw;
  }
  return fallback ?? null;
}

/**
 * Coerce raw data into a valid MiniAppInfo object
 * Returns null if required fields are missing
 */
export function coerceMiniAppInfo(raw: unknown, fallback?: MiniAppInfo): MiniAppInfo | null {
  const obj = asObject(raw);
  const appId = toString(obj.app_id ?? obj.appid ?? fallback?.app_id).trim();
  if (!appId) return null;

  const entryUrl = toString(obj.entry_url ?? fallback?.entry_url).trim();
  if (!entryUrl) return null;

  const name = toString(obj.name ?? fallback?.name ?? appId).trim() || appId;
  const description = toString(obj.description ?? fallback?.description ?? "").trim();
  const icon = toString(obj.icon ?? fallback?.icon ?? "🧩").trim() || "🧩";
  const category = normalizeCategory(obj.category ?? fallback?.category);
  const contractHash = toString(obj.contract_hash ?? fallback?.contract_hash ?? "").trim();
  const permissions = normalizePermissions(obj.permissions ?? fallback?.permissions, fallback?.permissions);
  const limits = normalizeLimits(obj.limits ?? fallback?.limits, fallback?.limits);
  const status = normalizeStatus(obj.status, fallback?.status);

  // Self-contained i18n fields
  const nameZh = toString(obj.name_zh ?? fallback?.name_zh ?? "").trim() || undefined;
  const descriptionZh = toString(obj.description_zh ?? fallback?.description_zh ?? "").trim() || undefined;

  return {
    app_id: appId,
    name,
    name_zh: nameZh,
    description,
    description_zh: descriptionZh,
    icon,
    category,
    entry_url: entryUrl,
    contract_hash: contractHash || null,
    status: status ?? null,
    permissions,
    limits,
  };
}

/**
 * Build MiniApp entry URL with query parameters
 */
export function buildMiniAppEntryUrl(entryUrl: string, params: Record<string, string>): string {
  const raw = toString(entryUrl).trim();
  if (!raw) return raw;

  const [base, hash] = raw.split("#");
  const [path, query] = base.split("?");
  const searchParams = new URLSearchParams(query ?? "");

  Object.entries(params).forEach(([key, value]) => {
    if (!key) return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const assembled = queryString ? `${path}?${queryString}` : path;
  return hash ? `${assembled}#${hash}` : assembled;
}
