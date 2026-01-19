This folder contains the compiled Groth16 artifacts used by the MiniApp:

- withdraw.wasm
- withdraw.zkey

The MiniApp loads them via `/static/zk/withdraw.wasm` and
`/static/zk/withdraw.zkey`.

To regenerate with a new ceremony, rebuild the circuit in
`miniapps-uniapp/apps/piggy-bank/circuits` and export fresh artifacts.
