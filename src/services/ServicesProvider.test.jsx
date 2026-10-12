import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import createMockServices from './mock/createMockServices';
import { useServices } from './ServicesContext';
import ServicesProvider from './ServicesProvider';

function ServiceNames() {
  return Object.keys(useServices()).sort().join(',');
}

describe('ServicesProvider', () => {
  it('exposes the injected services through useServices', () => {
    const html = renderToString(
      <ServicesProvider services={createMockServices()}>
        <ServiceNames />
      </ServicesProvider>,
    );
    expect(html).toBe('authService,followService,resetMockData,tweetService,userService');
  });

  it('fails loudly when used outside the provider', () => {
    expect(() => renderToString(<ServiceNames />)).toThrow(/inside <ServicesProvider>/);
  });
});
