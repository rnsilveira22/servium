import { describe, expect, it } from 'vitest';
import { SERVICE_NAME, SERVICE_VERSION } from './index.js';

describe('shared-types', () => {
  it('expõe identidade do serviço de forma estável', () => {
    expect(SERVICE_NAME).toBe('servium-api');
    expect(SERVICE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
