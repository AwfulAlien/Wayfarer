import { resolveApiBaseUrl } from './api-url';

describe('resolveApiBaseUrl', () => {
  const productionApiBaseUrl = 'https://wayfarer-api-p4by.onrender.com';

  it('uses the configured backend origin on production hosts', () => {
    expect(resolveApiBaseUrl('https://api.example.com/', '03a16d81.wayfarer-139.pages.dev'))
      .toBe('https://api.example.com');
  });

  it('falls back to Render when production runtime config is blank or missing', () => {
    expect(resolveApiBaseUrl('', '03a16d81.wayfarer-139.pages.dev')).toBe(productionApiBaseUrl);
    expect(resolveApiBaseUrl(undefined, 'wayfarer-139.pages.dev')).toBe(productionApiBaseUrl);
  });

  it('keeps localhost requests relative for the Angular development proxy', () => {
    expect(resolveApiBaseUrl('', 'localhost')).toBe('');
    expect(resolveApiBaseUrl(undefined, '127.0.0.1')).toBe('');
    expect(resolveApiBaseUrl('', 'app.localhost')).toBe('');
  });
});
