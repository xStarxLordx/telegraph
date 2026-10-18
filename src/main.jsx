import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import createAppServices from './services/createAppServices';
import ServicesProvider from './services/ServicesProvider';
import ThemeProvider from './theme/ThemeProvider';
import { getBrowserStorage } from './utils/storage';

const services = createAppServices();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider storage={getBrowserStorage()} rootElement={document.documentElement}>
      <ServicesProvider services={services}>
        <App />
      </ServicesProvider>
    </ThemeProvider>
  </StrictMode>,
);
