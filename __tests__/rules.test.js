function isAccessCodeFormat(code) {
  return /^EMP-[A-HJ-NP-Z2-9]{6}$/.test(String(code).trim().toUpperCase());
}

test('issued access codes use the EMP-XXXXXX format', () => {
  expect(isAccessCodeFormat('EMP-7XQ92K')).toBe(true);
  expect(isAccessCodeFormat('bad-code')).toBe(false);
});
