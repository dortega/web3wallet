import { useContext } from 'react';
import { ServicesContext } from '../context/services.js';

export function useServices() {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return services;
}
