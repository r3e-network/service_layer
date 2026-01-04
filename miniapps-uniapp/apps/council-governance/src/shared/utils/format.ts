export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals);
}

export function formatAddress(addr: string, chars = 6): string {
  if (!addr || addr.length < chars * 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

export function formatCountdown(expiryTime: number): string {
  const now = Date.now();
  const diff = expiryTime - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
