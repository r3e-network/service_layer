# Council Governance MiniApp

Decentralized governance for Neo Council members. Only top 21 committee members can create and vote on proposals.

## Features

- **Council Member Validation**: Validates if connected wallet is a council member
- **Proposal Creation**: Council members can create text or policy change proposals
- **Voting**: Council members can vote for or against proposals
- **Proposal Management**: View active proposals, history, and vote status

## Supported Networks

- Neo N3 Mainnet
- Neo N3 Testnet

## Contract Deployment Status

| Network        | Status          | Address                                      |
| -------------- | --------------- | -------------------------------------------- |
| neo-n3-mainnet | ❌ Not Deployed | -                                            |
| neo-n3-testnet | ✅ Deployed     | `0xec2f6de766fcbca43e71d5d2f451d9349f351c79` |

## Deployment Requirements

### Prerequisites

1. **Compiled Contract**: The contract is already compiled at `contracts/build/MiniAppCouncilGovernance.nef`
2. **Deployer Wallet**: A Neo wallet with sufficient GAS for deployment
3. **RPC Endpoint**: Access to Neo N3 testnet/mainnet RPC

### Deployment Steps

1. **Deploy the contract**:

   ```bash
   # Set environment variables
   export NEO_TESTNET_WIF="your-wallet-wif"
   export NEO_RPC_URL="https://testnet1.neo.coz.io:443"

   # Run deployment script
   go run scripts/deploy_miniapp_contracts.go
   ```

2. **Update contract addresses**:
   After deployment, add the contract address to `scripts/sync-contract-addresses.js`:

   ```javascript
   MiniAppCouncilGovernance: "0x...", // Add deployed address
   ```

3. **Sync addresses to neo-manifest.json**:

   ```bash
   node scripts/sync-contract-addresses.js
   ```

4. **Verify deployment**:
   - Check `neo-manifest.json` has the correct contract address
   - Test the miniapp in the host-app

## API Dependencies

The miniapp uses the following API endpoint for council member validation:

- `GET /api/neo/council-members?chain_id={chain_id}&address={address}`
  - Returns `{ isCouncilMember: boolean, chainId: string }`

## Contract Methods

| Method                     | Description                        | Access       |
| -------------------------- | ---------------------------------- | ------------ |
| `GetProposalCount()`       | Get total number of proposals      | Public       |
| `GetProposal(id)`          | Get proposal details               | Public       |
| `CreateProposal(...)`      | Create a new proposal              | Council Only |
| `Vote(voter, id, support)` | Cast a vote                        | Council Only |
| `HasVoted(voter, id)`      | Check if user has voted            | Public       |
| `IsCandidate(address)`     | Check if address is council member | Public       |

## Development

```bash
# Navigate to the miniapp directory
cd miniapps-uniapp/apps/council-governance

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Files Modified for Multi-Chain Support

- `src/pages/index/index.vue`: Updated to use `chain_id` parameter for API calls
