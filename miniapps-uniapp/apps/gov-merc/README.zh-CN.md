# 众筹算力

出租投票权，NEO 版 Curve War，投票权明码标价

## 概述

| 属性 | 值 |
|------|-----|
| **应用 ID** | `miniapp-gov-merc` |
| **分类** | 治理 |
| **版本** | 1.0.0 |
| **框架** | Vue 3 (uni-app) |

## 功能特性

- Governance
- Voting
- Marketplace

## 权限要求

| 权限 | 是否需要 |
|------|----------|
| 支付 | ✅ 是 |
| 随机数 | ❌ 否 |
| 数据源 | ❌ 否 |
| 治理 | ✅ 是 |

## 网络配置

### 测试网 (Testnet)

| 属性 | 值 |
|------|-----|
| **合约地址** | `0x05d4ed2e60141043d6d20f5cde274704bd42c0dc` |
| **RPC 节点** | `https://testnet1.neo.coz.io:443` |
| **区块浏览器** | [在 NeoTube 查看](https://testnet.neotube.io/contract/0x05d4ed2e60141043d6d20f5cde274704bd42c0dc) |
| **网络魔数** | `894710606` |

### 主网 (Mainnet)

| 属性 | 值 |
|------|-----|
| **合约地址** | 未部署 |
| **RPC 节点** | `https://mainnet1.neo.coz.io:443` |
| **区块浏览器** | [NeoTube](https://neotube.io) |
| **网络魔数** | `860833102` |

## 平台合约

| 合约 | 测试网地址 |
|------|------------|
| PaymentHub | `NLyxAiXdbc7pvckLw8aHpEiYb7P7NYHpQq` |
| RandomnessLog | `NWkXBKnpvQTVy3exMD2dWNDzdtc399eLaD` |
| PriceFeed | `Ndx6Lia3FsF7K1t73F138HXHaKwLYca2yM` |
| AppRegistry | `NX25pqQJSjpeyKBvcdReRtzuXMeEyJkyiy` |

## 开发指南

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建 H5 版本
npm run build
```

## 资产配置

- **允许的资产**: GAS


## 许可证

MIT License - R3E Network
