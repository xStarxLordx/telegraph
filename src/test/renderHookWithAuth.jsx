import { renderHook } from '@testing-library/react';
import ServicesProvider from '../services/ServicesProvider';

/** Renders a hook inside a `ServicesProvider` whose `authService` is the given fake. */
export default function renderHookWithAuth(useHook, authService) {
  const services = { authService, userService: {}, tweetService: {}, followService: {} };
  const wrapper = ({ children }) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
  );
  return renderHook(useHook, { wrapper });
}
