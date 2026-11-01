import { createContext, useContext } from 'react';
import type { Services } from '../interfaces/services';

export const ServicesContext = createContext<Services | null>(null);

/**
 * Returns the service implementations injected by <ServicesProvider>.
 * Components and hooks get data only through here, never by importing an implementation.
 */
export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used inside <ServicesProvider>.');
  }
  return services;
}
