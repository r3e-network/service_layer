# MiniApp Contract Address Refactoring Report

## Summary
All MiniApps have been reviewed and refactored to replace hardcoded contract addresses with dynamic references using the user's wallet SDK (`getContractAddress`). This ensures that MiniApps automatically adapt to the connected network (Mainnet vs Testnet) without code changes.

## Refactoring Details

### 1. Dynamic Address Implementation
The following MiniApps were updated to fetch their contract address via `useWallet().getContractAddress()`:
- **Heritage Trust**: Removed hardcoded placeholder.
- **Breakup Contract**: Removed `0xc56f...` placeholder.
- **Doomsday Clock**: Removed `0xc56f...` placeholder.
- **Self Loan**: Removed `SELF_LOAN_CONTRACT` constant.
- **Graveyard**: Removed placeholder/demo contract address.
- **Neo Swap**: Updated manifest to include router address; updated code to fetch dynamically.
- **NeoBurger**: Updated manifest to include bNEO contract; updated code to fetch dynamically.

### 2. Manifest Updates (Critical Fixes)
During the refactoring, it was discovered that some MiniApps lacked the necessary contract addresses in their `neo-manifest.json` configuration, which would have caused `getContractAddress` to return `null`.
- **NeoBurger**: Added `0x48c40d4666f93408be1bef038b6722404d9a4c2a` (bNEO) to `neo-manifest.json`.
- **Neo Swap**: Added `0xf970f4ccecd765b63732b821775dc38c25d74f23` (Flamingo Router) to `neo-manifest.json`.

### 3. Documentation Updates
- **Flashloan**: Updated the "Simulator" documentation to display the contract hash defined in the manifest (`0xee51...`) instead of an arbitrary mismatching hash (`0x794b...`).

### 4. Verified System Contracts
The following apps correctly retain hardcoded addresses as they reference immutable system contracts (same across all N3 networks):
- **Candidate Vote**: Uses native NEO Token contract (`0xef40...`).
- **NeoNS**: Uses native NameService contract (`0x50ac...`).
- **Gas Sponsor**: Uses native GAS Token contract (`0xd2a4...`).

### 5. No Action Required
- **GrantShare**: Uses `payGAS` and external API; no contract address needed in frontend code.
- **Unbreakable Vault**: Uses `payGAS` only; no contract invocation.

## Verification
- Code scanning (`grep`) confirms no stray `0x...` contract hashes remain in the `src` logical code of any MiniApp (excluding system constants).
- Build checks passed for heavily modified apps (`neoburger`, `graveyard`).

## Next Steps
- Deploy the updated MiniApps to the platform environment.
- Perform functional testing on both Neo N3 Mainnet and Testnet to confirm:
    1.  The SDK correctly resolves the address from the manifest.
    2.  Transactions are built with the correct script hashes.
