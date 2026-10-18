import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { createI18n } from './i18n/i18n';
import createAppServices from './services/createAppServices';
import ServicesProvider from './services/ServicesProvider';
import ThemeProvider from './theme/ThemeProvider';
import { getBrowserStorage } from './utils/storage';

const services = createAppServices();
const i18n = createI18n({ rootElement: document.documentElement });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider storage={getBrowserStorage()} rootElement={document.documentElement}>
        <ServicesProvider services={services}>
          <App />
        </ServicesProvider>
      </ThemeProvider>
    </I18nextProvider>
  </StrictMode>,
);
