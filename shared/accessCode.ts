const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type ByteCrypto = {
  getRandomValues: (array: Uint8Array) => Uint8Array;
};

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const cryptoObj = (globalThis as {crypto?: ByteCrypto}).crypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function generateAccessCode(): string {
  const bytes = randomBytes(6);
  const body = Array.from(bytes, byte => ALPHABET[byte % ALPHABET.length]).join(
    '',
  );
  return `EMP-${body}`;
}

export function generateEmployeeId(): string {
  const bytes = randomBytes(3);
  const n = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  return `CCH-${String(n % 1_000_000).padStart(6, '0')}`;
}

export function normalizeAccessCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isAccessCodeFormat(code: string): boolean {
  return /^EMP-[A-HJ-NP-Z2-9]{6}$/.test(normalizeAccessCode(code));
}
