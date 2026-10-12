import { createContext, useContext } from 'react';

/** @type {import('react').Context<import('./contracts').Services|null>} */
export const ServicesContext = createContext(null);

/**
 * Returns the service implementations injected by <ServicesProvider>.
 * Components and hooks get data only through here, never by importing an implementation.
 * @returns {import('./contracts').Services}
 */
export function useServices() {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used inside <ServicesProvider>.');
  }
  return services;
}
