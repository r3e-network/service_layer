/**
 * MiniApp Normalization Utilities
 * Validates and normalizes MiniApp data from various sources
 */

import type {
  MiniAppCategory,
  MiniAppInfo,
  MiniAppPermissions,
  MiniAppLimits,
  MiniAppChainContracts,
  ChainId,
} from "@/types/miniapp";

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

const CHAIN_ID_PATTERN = /^[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/;

function isValidChainId(value: unknown): value is ChainId {
  if (typeof value !== "string") return false;
  return CHAIN_ID_PATTERN.test(value);
}

function normalizeSupportedChains(value: unknown): ChainId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((v) => toString(v).trim().toLowerCase()).filter(isValidChainId);
  return list.length > 0 ? Array.from(new Set(list)) : undefined;
}

function normalizeChainContracts(value: unknown): MiniAppChainContracts | undefined {
  const obj = asObject(value);
  if (Object.keys(obj).length === 0) return undefined;
  const out: MiniAppChainContracts = {};
  for (const [chainId, raw] of Object.entries(obj)) {
    if (!isValidChainId(chainId)) continue;
    const cfg = asObject(raw);
    const address = toString(cfg.address ?? "").trim();
    out[chainId] = {
      address: address || null,
      active: cfg.active !== false,
      entryUrl: toString(cfg.entryUrl ?? cfg.entry_url ?? "").trim() || undefined,
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
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
  const rng = has("rng") ? raw.rng : fallback?.rng;
  const datafeed = has("datafeed") ? raw.datafeed : fallback?.datafeed;
  const confidential = has("confidential") ? raw.confidential : fallback?.confidential;
  const automation = has("automation") ? raw.automation : fallback?.automation;

  return {
    payments: Boolean(payments),
    governance: Boolean(governance),
    rng: Boolean(rng),
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
  const supportedChains =
    normalizeSupportedChains(obj.supportedChains ?? obj.supported_chains ?? fallback?.supportedChains) ?? [];
  let chainContracts = normalizeChainContracts(obj.chainContracts ?? obj.contracts ?? fallback?.chainContracts);
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
    supportedChains,
    chainContracts,
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

// ============================================================================
// Multi-chain helpers
// ============================================================================

export function getContractForChain(app: MiniAppInfo, chainId: ChainId | null): string | null {
  if (!chainId) return null;
  const contract = app.chainContracts?.[chainId];
  if (contract && contract.active !== false && contract.address) {
    return contract.address;
  }
  return null;
}

export function isChainSupported(app: MiniAppInfo, chainId: ChainId): boolean {
  if (app.supportedChains?.includes(chainId)) return true;
  const contract = app.chainContracts?.[chainId];
  if (contract && contract.active !== false) return true;
  return false;
}

export function getAllSupportedChains(app: MiniAppInfo): ChainId[] {
  const out = new Set<ChainId>();
  if (app.supportedChains) {
    app.supportedChains.forEach((c) => out.add(c));
  }
  if (app.chainContracts) {
    Object.entries(app.chainContracts).forEach(([chainId, contract]) => {
      if (contract?.active === false) return;
      out.add(chainId as ChainId);
    });
  }
  return Array.from(out);
}

export function resolveChainIdForApp(app: MiniAppInfo, requested?: ChainId | null): ChainId | null {
  const supported = getAllSupportedChains(app);
  if (requested && supported.includes(requested)) return requested;
  return supported[0] ?? null;
}

export function getEntryUrlForChain(app: MiniAppInfo, chainId?: ChainId | null): string {
  if (chainId) {
    const contract = app.chainContracts?.[chainId];
    if (contract && contract.active !== false && contract.entryUrl) {
      return contract.entryUrl;
    }
  }
  return app.entry_url;
}
