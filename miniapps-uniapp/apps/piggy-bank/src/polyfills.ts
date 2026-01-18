import { Buffer } from "buffer";

// Polyfill Buffer globally if missing (required for some crypto libs in browser)
if (typeof window !== 'undefined' && !window.Buffer) {
    (window as any).Buffer = Buffer;
}
