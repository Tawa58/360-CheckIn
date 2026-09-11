const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  const cryptoObj = (globalThis as {crypto?: {getRandomValues: (array: Uint8Array) => Uint8Array}}).crypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, byte => ALPHABET[byte % ALPHABET.length]).join('');
}

export function adminDocumentId(email: string): string {
  const [local = 'admin', domain = ''] = email.trim().toLowerCase().split('@');
  const domainLabel = domain.split('.')[0] || 'mail';
  const slug = `${local}-${domainLabel}`
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'admin';
}

export function attendanceDocumentId(employeeId: string, date: string): string {
  return `${employeeId}_${date}`;
}

export function messageDocumentId(employeeId: string, at = new Date()): string {
  const day = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
  ].join('');
  return `${employeeId}_${day}_${randomChars(4)}`;
}

export function boundaryEventDocumentId(employeeId: string, at = new Date()): string {
  return messageDocumentId(employeeId, at);
}
