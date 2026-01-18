pragma circom 2.0.0;

include "./circomlib/circuits/poseidon.circom";

template Withdraw() {
    signal input secret;
    signal input nullifier;
    signal input amount;
    signal input unlockTime;
    signal input token;
    signal input recipient;

    signal input commitment;
    signal input nullifierHash;

    // Commitment Hash = Poseidon(secret, nullifier, amount, unlockTime, token, recipient)
    component hasher = Poseidon(6);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== nullifier;
    hasher.inputs[2] <== amount;
    hasher.inputs[3] <== unlockTime;
    hasher.inputs[4] <== token;
    hasher.inputs[5] <== recipient;
    commitment === hasher.out;

    // Nullifier Hash = Poseidon(nullifier, secret)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== secret;
    nullifierHash === nullifierHasher.out;
}

component main {public [commitment, nullifierHash, recipient, token, amount, unlockTime]} = Withdraw();
