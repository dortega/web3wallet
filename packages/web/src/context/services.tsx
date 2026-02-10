import { createContext, type ReactNode } from 'react';
import { type Services, createServices } from '../lib/service-factory.js';

export const ServicesContext = createContext<Services | null>(null);

const services = createServices();

export function ServicesProvider({ children }: { children: ReactNode }) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}
