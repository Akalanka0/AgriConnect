import { describe, expect, it } from 'vitest';
import { ApiError, ErrorHandler, ValidationHelper } from './errorHandling';

describe('ErrorHandler', () => {
  it('maps HTTP status codes to friendly ApiErrors', () => {
    const err = new ApiError('Original message', 401, 'ANY');
    const handled = ErrorHandler.handle(err);

    expect(handled).toBeInstanceOf(ApiError);
    expect(handled.code).toBe('UNAUTHORIZED');
    expect(handled.message).toBe('Authentication required. Please login.');
  });

  it('converts fetch TypeError into network error', () => {
    const fetchError = new TypeError('Failed to fetch');
    const handled = ErrorHandler.handle(fetchError);

    expect(handled.code).toBe('NETWORK_ERROR');
  });
});

describe('ValidationHelper', () => {
  it('validates email formats', () => {
    expect(ValidationHelper.validateEmail('farmer@example.com')).toBe(true);
    expect(ValidationHelper.validateEmail('invalid-email')).toBe(false);
  });

  it('sanitizes angle brackets from input', () => {
    expect(ValidationHelper.sanitizeInput('  <script>alert(1)</script>  ')).toBe('scriptalert(1)/script');
  });
});
