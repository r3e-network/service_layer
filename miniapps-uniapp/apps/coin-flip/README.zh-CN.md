# 抛硬币

50/50 抛硬币游戏 - 赢取双倍 GAS

## 概述

| 属性 | 值 |
|------|-----|
| **应用 ID** | `miniapp-coinflip` |
| **分类** | 游戏 |
| **版本** | 1.0.0 |
| **框架** | Vue 3 (uni-app) |

## 功能特性

- Coinflip
- Gambling
- Randomness

## 权限要求

| 权限 | 是否需要 |
|------|----------|
| 支付 | ✅ 是 |
| 随机数 | ✅ 是 |
| 数据源 | ❌ 否 |
| 治理 | ❌ 否 |

## 网络配置

### 测试网 (Testnet)

| 属性 | 值 |
|------|-----|
| **合约地址** | `0xbd4c9203495048900e34cd9c4618c05994e86cc0` |
| **RPC 节点** | `https://testnet1.neo.coz.io:443` |
| **区块浏览器** | [在 NeoTube 查看](https://testnet.neotube.io/contract/0xbd4c9203495048900e34cd9c4618c05994e86cc0) |
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
- **单笔最大**: 20 GAS
- **每日上限**: 200 GAS

## 许可证

MIT License - R3E Network
