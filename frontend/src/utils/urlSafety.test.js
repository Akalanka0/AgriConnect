import { describe, expect, it } from 'vitest';
import { sanitizeExternalUrl } from './urlSafety';

describe('sanitizeExternalUrl', () => {
  it('returns # for empty or invalid values', () => {
    expect(sanitizeExternalUrl('')).toBe('#');
    expect(sanitizeExternalUrl(null)).toBe('#');
    expect(sanitizeExternalUrl('http://[::1')).toBe('#');
  });

  it('allows http and https URLs', () => {
    expect(sanitizeExternalUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeExternalUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('blocks javascript protocol URLs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBe('#');
  });
});
