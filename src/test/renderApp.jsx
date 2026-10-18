// Renders the whole app (real routes, providers and mock services) at a given URL, for
// integration tests. Requires the jsdom environment.
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import AppProviders from '../AppProviders';
import { createI18n } from '../i18n/i18n';
import AppRoutes from '../routes/AppRoutes';
import createMockServices from '../services/mock/createMockServices';
import ServicesProvider from '../services/ServicesProvider';
import ThemeProvider from '../theme/ThemeProvider';
import { createMemoryStorage } from '../utils/storage';

export default function renderApp(path, { services = createMockServices(), lng = 'es' } = {}) {
  const view = render(
    <I18nextProvider i18n={createI18n({ lng })}>
      <ThemeProvider storage={createMemoryStorage()} rootElement={document.documentElement}>
        <ServicesProvider services={services}>
          <MemoryRouter initialEntries={[path]}>
            <AppProviders>
              <AppRoutes />
            </AppProviders>
          </MemoryRouter>
        </ServicesProvider>
      </ThemeProvider>
    </I18nextProvider>,
  );
  return { ...view, services };
}
