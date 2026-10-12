import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import createAppServices from './services/createAppServices';
import ServicesProvider from './services/ServicesProvider';

const services = createAppServices();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <App />
    </ServicesProvider>
  </StrictMode>,
);
