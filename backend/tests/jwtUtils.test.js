import test from 'node:test';
import assert from 'node:assert/strict';
import { generateJWTSecret, validateJWTSecret } from '../utils/jwtUtils.js';

test('generateJWTSecret returns a 128-char hex string', () => {
  const secret = generateJWTSecret();

  assert.equal(secret.length, 128);
  assert.match(secret, /^[a-f0-9]+$/i);
});

test('validateJWTSecret rejects missing or weak secrets', () => {
  const missing = validateJWTSecret();
  assert.equal(missing.valid, false);

  const shortSecret = validateJWTSecret('short');
  assert.equal(shortSecret.valid, false);

  const placeholder = validateJWTSecret('your_jwt_secret_key_here');
  assert.equal(placeholder.valid, false);
});

test('validateJWTSecret accepts a strong custom secret', () => {
  const strongSecret = 'a'.repeat(48);
  const result = validateJWTSecret(strongSecret);

  assert.equal(result.valid, true);
});
