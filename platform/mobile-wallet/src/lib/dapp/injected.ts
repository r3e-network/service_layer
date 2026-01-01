/**
 * DApp Wallet API Injection Script
 * NeoLine-compatible API for DApp integration
 */

export function generateInjectedScript(address: string, network: string): string {
  return `
(function() {
  window.NEOLine = {
    getProvider: function() {
      return Promise.resolve({
        name: 'Neo Mobile Wallet',
        version: '1.0.0',
        website: 'https://neo.org',
        compatibility: ['NEP-11', 'NEP-17'],
        extra: { theme: 'dark' }
      });
    },
    getNetworks: function() {
      return Promise.resolve({
        networks: ['MainNet', 'TestNet'],
        defaultNetwork: '${network === "mainnet" ? "MainNet" : "TestNet"}'
      });
    },
    getAccount: function() {
      return Promise.resolve({
        address: '${address}',
        label: 'Mobile Wallet'
      });
    },
    getPublicKey: function() {
      return new Promise(function(resolve, reject) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GET_PUBLIC_KEY'
        }));
        window._neolineResolve = resolve;
        window._neolineReject = reject;
      });
    },
    invoke: function(params) {
      return new Promise(function(resolve, reject) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'INVOKE',
          params: params
        }));
        window._neolineResolve = resolve;
        window._neolineReject = reject;
      });
    },
    signMessage: function(params) {
      return new Promise(function(resolve, reject) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SIGN_MESSAGE',
          params: params
        }));
        window._neolineResolve = resolve;
        window._neolineReject = reject;
      });
    }
  };
  window.dispatchEvent(new Event('NEOLine.NEO.EVENT.READY'));
})();
`;
}

export function parseWebViewMessage(data: string): DAppMessage | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export interface DAppMessage {
  type: "GET_PUBLIC_KEY" | "INVOKE" | "SIGN_MESSAGE";
  params?: Record<string, unknown>;
}
