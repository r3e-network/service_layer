/**
 * MiniApp entry URL helpers for the wallet
 */

import { buildMiniAppEntryUrl } from "./normalize";

export function buildMiniAppEntryUrlForWallet(entryUrl: string, params: Record<string, string>): string {
  return buildMiniAppEntryUrl(entryUrl, { ...params, layout: "mobile" });
}
