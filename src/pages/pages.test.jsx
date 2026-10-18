// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compareByFullName } from '../domain/sorting';
import createMockServices from '../services/mock/createMockServices';
import { DEMO_PASSWORD } from '../services/mock/seed';
import renderApp from '../test/renderApp';

let services;
let ada;

beforeEach(async () => {
  // jsdom doesn't implement scrolling (Pagination scrolls to the top).
  window.scrollTo = vi.fn();
  services = createMockServices();
  ada = await services.authService.loginWithUsername({ username: 'ada', password: DEMO_PASSWORD });
});

afterEach(cleanup);

const gaugeCount = (label) =>
  Number(within(screen.getByRole('complementary')).getByText(label).previousSibling.textContent);

describe('Followers page (M1-15)', () => {
  it('shows "Seguir" only for followers I do not follow, and following grows after a click', async () => {
    // Real latency, so the window between "followed" and "status reloaded" exists.
    services = createMockServices({ latencyMs: 40 });
    ada = await services.authService.loginWithUsername({
      username: 'ada',
      password: DEMO_PASSWORD,
    });
    const user = userEvent.setup();
    renderApp('/followers', { services });
    const list = await screen.findByRole('list', { name: 'Seguidores' });
    await waitFor(() => expect(within(list).getAllByRole('button').length).toBeGreaterThan(0));

    // Every person with a button is someone ada doesn't follow, and vice versa.
    const items = within(list).getAllByRole('listitem');
    const people = (await services.followService.listFollowers(ada.id)).items;
    const status = await services.followService.getFollowingStatus(
      ada.id,
      people.map((person) => person.id),
    );
    items.forEach((item, index) => {
      const hasButton = within(item).queryByRole('button') !== null;
      expect(hasButton).toBe(!status[people[index].id]);
    });

    await waitFor(() => expect(gaugeCount('Siguiendo')).toBeGreaterThan(0));
    const followingBefore = gaugeCount('Siguiendo');
    const [firstButton] = within(list).getAllByRole('button');
    const username = firstButton.getAttribute('aria-label').replace('Seguir a @', '');
    await user.click(firstButton);

    // From the confirmation on, the button never comes back (not even while statuses reload).
    await screen.findByText(`Ahora sigues a @${username}.`);
    const followButton = () =>
      within(list).queryByRole('button', { name: `Seguir a @${username}` });
    expect(followButton()).toBeNull();
    await waitFor(() => expect(gaugeCount('Siguiendo')).toBe(followingBefore + 1));
    expect(followButton()).toBeNull();
  });
});

describe('Following page (M1-14)', () => {
  it('lists people alphabetically across pages', async () => {
    const user = userEvent.setup();
    renderApp('/following', { services });
    const names = async () => {
      const list = await screen.findByRole('list', { name: 'Siguiendo' });
      return within(list)
        .getAllByRole('listitem')
        .map((item) => {
          const [fullName, username] = item.querySelectorAll('a span');
          return { fullName: fullName.textContent, username: username.textContent.slice(1) };
        });
    };
    const firstPage = await names();
    expect(firstPage).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));
    await screen.findByText('Página 2 de 2');
    await waitFor(async () => expect((await names())[0]).not.toEqual(firstPage[0]));
    const secondPage = await names();

    const all = [...firstPage, ...secondPage];
    // The domain order (accent- and case-insensitive, code-point order like Firestore).
    expect(all).toEqual([...all].sort(compareByFullName));
    expect(new Set(all.map((person) => person.username)).size).toBe(all.length);
  });
});

describe('Compose page (M1-13)', () => {
  it('publishes and shows the new tweet first in the feed', async () => {
    const user = userEvent.setup();
    renderApp('/compose', { services });
    const publish = await screen.findByRole('button', { name: 'Publicar' });
    expect(publish.disabled).toBe(true);

    await user.type(screen.getByLabelText('Tu tweet'), 'Hola desde las pruebas 🚂');
    expect(screen.getByText('24 / 280')).toBeTruthy();
    await user.click(publish);

    expect(await screen.findByRole('heading', { level: 1, name: 'Feed' })).toBeTruthy();
    const feed = await screen.findByRole('feed');
    await waitFor(() =>
      expect(within(feed).getAllByRole('article')[0].textContent).toContain(
        'Hola desde las pruebas 🚂',
      ),
    );
  });
});

describe('User tweets page (M1-16)', () => {
  it('never shows "Seguir" on my own profile', async () => {
    renderApp('/users/ada', { services });
    expect(await screen.findByText('Este es tu perfil.')).toBeTruthy();
    // Wait until the profile has fully loaded before asserting the absence.
    await screen.findByText(/^\d+ tweets$/);
    expect(screen.queryByRole('button', { name: 'Seguir' })).toBeNull();
  });

  it('shows "Seguir" on a profile I do not follow; following adds one follower', async () => {
    const user = userEvent.setup();
    // Someone who follows ada but whom ada doesn't follow back (seed: users #16-#22).
    const followers = (await services.followService.listFollowers(ada.id)).items;
    const status = await services.followService.getFollowingStatus(
      ada.id,
      followers.map((person) => person.id),
    );
    const stranger = followers.find((person) => !status[person.id]);
    const before = await services.followService.getCounts(stranger.id);

    renderApp(`/users/${stranger.username}`, { services });
    expect(await screen.findByRole('heading', { level: 1, name: stranger.fullName })).toBeTruthy();
    await user.click(await screen.findByRole('button', { name: 'Seguir' }));

    await screen.findByText(`Ahora sigues a @${stranger.username}.`);
    expect(screen.queryByRole('button', { name: 'Seguir' })).toBeNull();
    const profile = screen.getByRole('heading', { level: 1 }).closest('section');
    const followersCount = () =>
      Number(within(profile).getByText('Seguidores').previousSibling.textContent);
    await waitFor(() => expect(followersCount()).toBe(before.followers + 1));
  });

  it('shows "user not found" for an unknown username', async () => {
    renderApp('/users/nobody_here', { services });
    expect(await screen.findByRole('heading', { name: 'Usuario no encontrado' })).toBeTruthy();
  });
});
