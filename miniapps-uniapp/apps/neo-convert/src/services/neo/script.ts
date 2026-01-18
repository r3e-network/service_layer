export const OPCODES: Record<string, string> = {
    "00": "PUSH0",
    "11": "ONFAULT",
    "12": "JMPIF",
    "13": "JMP",
    "14": "CALL",
    "21": "PUSHDATA1",
    "40": "RET",
    "57": "PUSH1",
    "61": "NOP",
    "87": "SIZE",
    "9C": "EQUAL",
    "A1": "INC",
    "A2": "DEC",
    "A5": "ADD",
    "A6": "SUB",
    "AC": "CHECKSIG", // Crucial for N3 verification plots
    "C0": "ARRAY",
    "C5": "PACK",
    "C6": "UNPACK",
};

export const validateHexScript = (script: string): boolean => {
    const clean = script.replace(/^0x/i, "");
    return clean.length > 0 && clean.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(clean);
};

export const disassembleScript = (hex: string): string[] => {
    const cleanHex = hex.replace(/^0x/i, "");
    const result: string[] = [];

    // Simple byte-by-byte lookahead could be implemented here for PUSHDATA
    // For now, mapping known opcodes is sufficient for basic verification
    for (let i = 0; i < cleanHex.length; i += 2) {
        const byte = cleanHex.substring(i, i + 2).toUpperCase();
        const op = OPCODES[byte];
        if (op) {
            result.push(op);
        } else {
            result.push(`0x${byte}`);
        }
    }
    return result;
};
