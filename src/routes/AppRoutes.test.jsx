// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import createMockServices from '../services/mock/createMockServices';
import { DEMO_PASSWORD } from '../services/mock/seed';
import renderApp from '../test/renderApp';

afterEach(cleanup);

async function logIn(user, username = 'ada', password = DEMO_PASSWORD) {
  await user.type(await screen.findByLabelText('Nombre de usuario'), username);
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('routing and guards (M1-06)', () => {
  it('sends a logged-out visitor to /login, then back to the page they asked for', async () => {
    const user = userEvent.setup();
    renderApp('/following');
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();

    await logIn(user);
    expect(await screen.findByRole('heading', { level: 1, name: 'Siguiendo' })).toBeTruthy();
    // The common header shows the logged-in user (R1.9).
    const header = screen.getByRole('banner');
    expect(within(header).getByText('@ada')).toBeTruthy();
  });

  it('shows an error on wrong credentials and stays on /login', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await logIn(user, 'ada', 'not-the-password');
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Usuario o contraseña incorrectos.',
    );
  });

  it('logs out back to /login', async () => {
    const user = userEvent.setup();
    const services = createMockServices();
    await services.authService.loginWithUsername({ username: 'ada', password: DEMO_PASSWORD });
    renderApp('/', { services });
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(await services.authService.getCurrentUser()).toBeNull();
  });

  it("does not send the next user to the previous user's page after a logout", async () => {
    const user = userEvent.setup();
    renderApp('/following');
    await logIn(user);
    await screen.findByRole('heading', { level: 1, name: 'Siguiendo' });

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await logIn(user, 'tesla');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Nikola Tesla' }),
    ).toBeTruthy();
  });

  it('shows translated validation errors on the registration form', async () => {
    const user = userEvent.setup();
    renderApp('/register');
    await user.type(await screen.findByLabelText('Nombre completo'), 'Nueva Persona');
    await user.type(screen.getByLabelText('Nombre de usuario'), 'no spaces');
    await user.type(screen.getByLabelText('Correo electrónico'), 'not-an-email');
    await user.type(screen.getByLabelText('Contraseña'), 'short');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'other');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByLabelText('Nombre de usuario').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Escribe un correo válido, como nombre@dominio.com.')).toBeTruthy();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    // Focus goes to the first invalid field.
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre de usuario'));
  });

  it('switches every visible text to English', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
    expect(screen.queryByText(/sesión|Contraseña|Regístrate/)).toBeNull();
  });

  it('makes a first-time Google account choose a username', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Continuar con Google' }));
    expect(await screen.findByRole('heading', { name: 'Elige tu nombre de usuario' })).toBeTruthy();

    await user.type(screen.getByLabelText('Nombre de usuario'), 'gdemo');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Google Demo' }),
    ).toBeTruthy();
  });

  it('shows the 404 page for an unknown URL', async () => {
    renderApp('/no/such/page');
    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeTruthy();
  });
});
