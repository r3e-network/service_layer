<template>
  <NeoDoc
    :title="t('app.title')"
    :subtitle="t('app.subtitle')"
    :description="description"
    :steps="steps"
    :features="features"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import NeoDoc from '@/shared/components/NeoDoc.vue';

const { t, locale } = useI18n();

const description = computed(() => {
  return locale.value === 'zh' 
    ? "零知识存钱罐允许您为特定目标存入任意ERC-20代币（包括ETH、USDT、USDC、wBTC等任何以太坊代币），并锁定到一个特定日期。使用零知识证明技术，您的储蓄余额对外界完全保密，直到您'砸碎'存钱罐。请先连接 EVM 钱包并配置 RPC（Alchemy）。"
    : "ZK Piggy Bank allows you to save ANY ERC-20 token (including ETH, USDT, USDC, wBTC, or any Ethereum token) towards a goal, locked until a specific date. Using Zero-Knowledge proofs, your savings balance is kept completely private until you 'smash' the piggy bank. Connect an EVM wallet and configure Alchemy RPC before use.";
});

const steps = computed(() => {
  return locale.value === 'zh'
    ? [
        "连接 EVM 钱包并选择网络，配置 Alchemy RPC。",
        "创建一个新的存钱罐，设置目标代币、金额和解锁日期。",
        "存入任意ERC-20代币到您的存钱罐。可选择热门代币（ETH、USDT、USDC等）或输入任意代币合约地址。",
        "使用 ZK 验证功能检查您是否达到了目标，而无需向任何人透露确切金额。",
        "解锁日期到达后，'砸碎'存钱罐，一次性提取所有代币到您的钱包。"
      ]
    : [
        "Connect an EVM wallet, pick a network, and configure Alchemy RPC.",
        "Create a new Piggy Bank with a target token, amount, and unlock date.",
        "Deposit any ERC-20 token into your Piggy Bank. Choose from popular tokens (ETH, USDT, USDC, etc.) or enter any token contract address.",
        "Use the ZK Verify function to check if you've reached your goal without revealing the exact amount to anyone.",
        "Once the unlock date arrives, 'Smash' the piggy bank and withdraw all tokens to your wallet in one batch."
      ];
});

const features = computed(() => {
  return locale.value === 'zh'
    ? [
        { name: "零知识隐私", desc: "余额和存款通过密码学承诺隐藏，实现完全隐私。" },
        { name: "支持任意ERC-20", desc: "可存入以太坊上的任何代币，包括meme币、治理代币、LP代币等。" },
        { name: "时间锁定智能合约", desc: "资金在您选定的日期之前通过智能合约安全锁定，无法提前取出。" },
        { name: "多链兼容", desc: "支持以太坊、Polygon、Arbitrum、Base、Optimism 等 EVM 网络。" },
        { name: "本地密钥存储", desc: "您的存款密钥仅存储在本地设备上，确保最高安全性。" },
        { name: "可配置 RPC", desc: "支持使用 Alchemy RPC 访问主流 EVM 网络。" }
      ]
    : [
        { name: "Zero-Knowledge Privacy", desc: "Balances and deposits are hidden with cryptographic commitments for complete privacy." },
        { name: "Any ERC-20 Token", desc: "Deposit any token on Ethereum including meme coins, governance tokens, LP tokens, and more." },
        { name: "Time-Locked Smart Contracts", desc: "Funds are secured by smart contracts until your chosen date - no early withdrawals possible." },
        { name: "Multi-Chain Support", desc: "Works on Ethereum, Polygon, Arbitrum, Base, Optimism and other EVM networks." },
        { name: "Local Key Storage", desc: "Your deposit secrets are stored only on your device for maximum security." },
        { name: "Configurable RPC", desc: "Uses Alchemy RPC to access major EVM networks." }
      ];
});
</script>
