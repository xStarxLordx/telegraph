// @vitest-environment jsdom
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES } from '../domain/constants';
import { compareByFullName } from '../domain/sorting';
import createMockServices from '../services/mock/createMockServices';
import { DEMO_PASSWORD } from '../services/mock/seed';
import stubDialog from '../test/dialogStub';
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

describe('Home page', () => {
  it('shows the feed below the shortcuts, 10 tweets per page, newest first', async () => {
    renderApp('/', { services });
    expect(await screen.findByRole('heading', { level: 2, name: 'Feed' })).toBeTruthy();
    const feed = await screen.findByRole('feed', { name: 'Feed' });

    const expected = await services.tweetService.listFeed(ada.id);
    await waitFor(() => expect(within(feed).getAllByRole('article')).toHaveLength(10));
    expect(within(feed).getAllByRole('article')[0].textContent).toContain(expected.items[0].body);
    // Below the home options: the compose prompt comes first.
    const prompt = screen.getByText('¿Qué quieres contarle al mundo hoy?');
    const documentOrder = [...document.querySelectorAll('*')];
    expect(documentOrder.indexOf(prompt)).toBeLessThan(documentOrder.indexOf(feed));
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

describe('Compose page with media', () => {
  const ADD_MEDIA = 'Añadir foto, GIF o video';

  const fileOf = (name, type, size = 10) => {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    // jsdom has no object URLs: the preview and the mock upload both ask for one.
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it('previews the file and publishes a tweet that is only a picture', async () => {
    const user = userEvent.setup();
    renderApp('/compose', { services });
    const publish = await screen.findByRole('button', { name: 'Publicar' });
    expect(publish.disabled).toBe(true);

    await user.upload(screen.getByLabelText(ADD_MEDIA), fileOf('gato.png', 'image/png'));
    expect(await screen.findByAltText('Vista previa: gato.png')).toBeTruthy();
    expect(publish.disabled).toBe(false);
    await user.click(publish);

    const feed = await screen.findByRole('feed');
    await waitFor(() => {
      const [first] = within(feed).getAllByRole('article');
      const image = within(first).getByAltText('Imagen publicada por Ada Lovelace');
      expect(image.getAttribute('src')).toBe('blob:preview');
    });
  });

  it('sends the text together with a GIF', async () => {
    const user = userEvent.setup();
    renderApp('/compose', { services });
    await user.type(await screen.findByLabelText('Tu tweet'), 'Mira qué gato');
    await user.upload(screen.getByLabelText(ADD_MEDIA), fileOf('baile.gif', 'image/gif'));
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    const feed = await screen.findByRole('feed');
    await waitFor(() => {
      const [first] = within(feed).getAllByRole('article');
      expect(first.textContent).toContain('Mira qué gato');
      expect(within(first).getByAltText('GIF publicado por Ada Lovelace')).toBeTruthy();
    });
  });

  it('explains a file that is not supported and keeps "Publicar" disabled', async () => {
    // The input's `accept` would already filter this file in a real browser's picker.
    const user = userEvent.setup({ applyAccept: false });
    renderApp('/compose', { services });
    const publish = await screen.findByRole('button', { name: 'Publicar' });
    await user.upload(screen.getByLabelText(ADD_MEDIA), fileOf('a.pdf', 'application/pdf'));

    expect((await screen.findByRole('alert')).textContent).toContain('no es compatible');
    expect(publish.disabled).toBe(true);
    expect(screen.queryByAltText(/Vista previa/)).toBeNull();
  });

  it('explains a file that is too large', async () => {
    const user = userEvent.setup();
    renderApp('/compose', { services });
    await screen.findByRole('button', { name: 'Publicar' });
    await user.upload(
      screen.getByLabelText(ADD_MEDIA),
      fileOf('enorme.png', 'image/png', MAX_IMAGE_BYTES + 1),
    );

    expect((await screen.findByRole('alert')).textContent).toContain('demasiado grande');
    expect(screen.getByRole('button', { name: 'Publicar' }).disabled).toBe(true);
  });

  it('removes the file again, which disables "Publicar" when there is no text', async () => {
    const user = userEvent.setup();
    renderApp('/compose', { services });
    const publish = await screen.findByRole('button', { name: 'Publicar' });
    await user.upload(screen.getByLabelText(ADD_MEDIA), fileOf('gato.png', 'image/png'));
    await screen.findByAltText('Vista previa: gato.png');

    await user.click(screen.getByRole('button', { name: 'Quitar archivo' }));

    expect(screen.queryByAltText(/Vista previa/)).toBeNull();
    expect(publish.disabled).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});

describe('Media viewer in the feed', () => {
  let restoreDialog;

  beforeEach(() => {
    restoreDialog = stubDialog();
  });

  afterEach(() => {
    restoreDialog();
  });

  it('enlarges a picture of the feed, offers to download it and closes', async () => {
    const user = userEvent.setup();
    const url = 'https://cataas.com/cat/abc?width=640';
    await services.tweetService.publish({
      authorId: ada.id,
      body: 'Mira',
      media: { kind: 'image', url },
    });
    renderApp('/feed', { services });

    await user.click(
      await screen.findByRole('button', { name: 'Ampliar: Imagen publicada por Ada Lovelace' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Imagen publicada por Ada Lovelace' });
    expect(within(dialog).getByRole('img').getAttribute('src')).toBe(url);
    expect(within(dialog).getByRole('button', { name: 'Descargar' })).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar visor' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
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

describe('Feed for someone who follows nobody', () => {
  it('still shows tweets from the rest of the network', async () => {
    await services.authService.register({
      fullName: 'New Comer',
      username: 'newcomer',
      email: 'newcomer@telegraph.test',
      password: DEMO_PASSWORD,
    });
    renderApp('/feed', { services });

    const feed = await screen.findByRole('feed', { name: 'Feed' });
    await waitFor(() => expect(within(feed).getAllByRole('article')).toHaveLength(10));
  });
});

describe('Search page', () => {
  const resultNames = (list) =>
    within(list)
      .getAllByRole('listitem')
      .map((item) => item.querySelectorAll('a span')[1].textContent);

  it('asks for a term before searching', async () => {
    renderApp('/search', { services });
    expect(await screen.findByRole('heading', { name: 'Busca a alguien' })).toBeTruthy();
  });

  it('lists usernames that start with the term and follows from the results', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByLabelText('Nombre o usuario'), 'M');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    const list = await screen.findByRole('list', { name: 'Resultados de la búsqueda' });
    expect(resultNames(list)).toEqual([
      '@maxwell',
      '@lmeitner',
      '@mcurie',
      '@mshelley',
      '@somerville',
      '@faraday',
    ]);
    await waitFor(() => expect(within(list).getAllByRole('button')).toHaveLength(4));
    await user.click(within(list).getByRole('button', { name: 'Seguir a @maxwell' }));

    await screen.findByText('Ahora sigues a @maxwell.');
    await waitFor(() => expect(within(list).queryAllByRole('button')).toHaveLength(3));
  });

  it('finds people by their name, not only by their username', async () => {
    renderApp('/search?q=Lovelace', { services });
    const list = await screen.findByRole('list', { name: 'Resultados de la búsqueda' });
    expect(resultNames(list)).toEqual(['@ada']);
  });

  it('reads the term from the address', async () => {
    renderApp('/search?q=tesla', { services });
    const list = await screen.findByRole('list', { name: 'Resultados de la búsqueda' });
    expect(resultNames(list)).toEqual(['@tesla']);
  });

  it('says so when nobody matches', async () => {
    renderApp('/search?q=zzz', { services });
    expect(await screen.findByRole('heading', { name: 'Nadie coincide con «zzz»' })).toBeTruthy();
  });

  it('is reachable from the main navigation', async () => {
    const user = userEvent.setup();
    renderApp('/', { services });
    await user.click(await screen.findByRole('link', { name: 'Buscar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Buscar personas' })).toBeTruthy();
  });
});

describe('Follow by username (M2-10)', () => {
  const submit = async (user, username) => {
    await user.type(await screen.findByLabelText('Nombre de usuario'), username);
    await user.click(screen.getByRole('button', { name: 'Seguir' }));
  };

  it('follows the user and the following counter grows', async () => {
    const user = userEvent.setup();
    renderApp('/', { services });
    await waitFor(() => expect(gaugeCount('Siguiendo')).toBeGreaterThan(0));
    const before = gaugeCount('Siguiendo');

    await submit(user, '@Zuse');

    await screen.findByText('Ahora sigues a @zuse.');
    await waitFor(() => expect(gaugeCount('Siguiendo')).toBe(before + 1));
    expect(screen.getByLabelText('Nombre de usuario').value).toBe('');
  });

  it.each([
    ['nobody_here', 'No existe ese usuario.'],
    ['ada', 'No puedes seguirte a ti mismo.'],
    ['tesla', 'Ya sigues a este usuario.'],
    ['ab', 'Usa de 3 a 15 caracteres: letras, números y _.'],
  ])('explains why %s cannot be followed', async (username, message) => {
    const user = userEvent.setup();
    renderApp('/', { services });

    await submit(user, username);

    expect(await screen.findByText(message)).toBeTruthy();
  });
});

describe('Lists of any user (M3-06)', () => {
  const personNames = (list) =>
    within(list)
      .getAllByRole('listitem')
      .map((item) => item.querySelector('a span').textContent);

  it('shows the followers of another user, with "Seguir" only for people I do not follow', async () => {
    const tesla = await services.userService.getUserByUsername('tesla');
    renderApp('/users/tesla/followers', { services });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Seguidores de Nikola Tesla' }),
    ).toBeTruthy();
    const list = await screen.findByRole('list', { name: 'Seguidores de Nikola Tesla' });
    const { items } = await services.followService.listFollowers(tesla.id);
    expect(personNames(list)).toEqual(items.map((person) => person.fullName));

    const status = await services.followService.getFollowingStatus(
      ada.id,
      items.map((person) => person.id),
    );
    await waitFor(() => {
      within(list)
        .getAllByRole('listitem')
        .forEach((item, index) => {
          const isMe = items[index].id === ada.id;
          expect(within(item).queryByRole('button') !== null).toBe(
            !isMe && !status[items[index].id],
          );
        });
    });
  });

  it('shows who another user follows', async () => {
    const tesla = await services.userService.getUserByUsername('tesla');
    renderApp('/users/tesla/following', { services });

    const list = await screen.findByRole('list', { name: 'Seguidos por Nikola Tesla' });
    const { items } = await services.followService.listFollowing(tesla.id);
    expect(personNames(list)).toEqual(items.map((person) => person.fullName));
  });

  it('opens from the counters on a profile', async () => {
    const user = userEvent.setup();
    renderApp('/users/tesla', { services });
    const profile = (
      await screen.findByRole('heading', { level: 1, name: 'Nikola Tesla' })
    ).closest('section');

    await user.click(await within(profile).findByRole('link', { name: /Seguidores/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Seguidores de Nikola Tesla' }),
    ).toBeTruthy();
  });

  it('treats my own username like my own lists', async () => {
    renderApp('/users/ada/followers', { services });
    expect(await screen.findByRole('heading', { level: 1, name: 'Seguidores' })).toBeTruthy();
  });

  it('shows "user not found" for an unknown username', async () => {
    renderApp('/users/nobody_here/following', { services });
    expect(await screen.findByRole('heading', { name: 'Usuario no encontrado' })).toBeTruthy();
  });
});

describe('Search suggestions', () => {
  const optionNames = (listbox) =>
    within(listbox)
      .getAllByRole('option')
      .map((option) => option.querySelectorAll('span')[1].textContent);

  it('recommends people I do not follow when the search box is focused', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.click(await screen.findByRole('combobox', { name: 'Nombre o usuario' }));

    const listbox = await screen.findByRole('listbox', {
      name: 'Personas que quizá quieras seguir',
    });
    const usernames = optionNames(listbox).map((name) => name.slice(1));
    expect(usernames.length).toBeGreaterThan(0);
    expect(usernames.length).toBeLessThanOrEqual(5);
    expect(usernames).not.toContain('ada');
    const people = await Promise.all(
      usernames.map((username) => services.userService.getUserByUsername(username)),
    );
    const status = await services.followService.getFollowingStatus(
      ada.id,
      people.map((person) => person.id),
    );
    expect(Object.values(status).every((followed) => !followed)).toBe(true);
  });

  it('suggests matching people while I type', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByRole('combobox'), 'm');

    const listbox = await screen.findByRole('listbox', { name: 'Coincidencias' });
    expect(optionNames(listbox)).toEqual([
      '@maxwell',
      '@lmeitner',
      '@mcurie',
      '@mshelley',
      '@somerville',
    ]);
  });

  it('says so when nobody matches yet', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByRole('combobox'), 'zzz');

    expect(await screen.findByText('Nadie coincide todavía.')).toBeTruthy();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens a suggestion’s profile with the keyboard', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByRole('combobox'), 'tes');
    await screen.findByRole('option', { name: /@tesla/ });

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /@tesla/ }).getAttribute('aria-selected')).toBe(
      'true',
    );
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { level: 1, name: 'Nikola Tesla' })).toBeTruthy();
  });

  it('opens a suggestion’s profile when it is clicked', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByRole('combobox'), 'tes');

    const option = await screen.findByRole('option', { name: /@tesla/ });
    await user.click(within(option).getByRole('link'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Nikola Tesla' })).toBeTruthy();
  });

  it('closes the suggestions with Escape and still searches with Enter', async () => {
    const user = userEvent.setup();
    renderApp('/search', { services });
    await user.type(await screen.findByRole('combobox'), 'm');
    await screen.findByRole('listbox', { name: 'Coincidencias' });

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.keyboard('{Enter}');
    const results = await screen.findByRole('list', { name: 'Resultados de la búsqueda' });
    expect(within(results).getAllByRole('listitem')).toHaveLength(6);
  });
});

function createObserverStub(observers) {
  return function FakeIntersectionObserver(callback) {
    const observer = {
      callback,
      active: true,
      observe: () => {},
      disconnect: () => {
        observer.active = false;
      },
    };
    observers.push(observer);
    return observer;
  };
}

describe('Feed lazy loading', () => {
  const articles = (feed) => within(feed).queryAllByRole('article');

  const loadEverything = async (user, feed) => {
    const button = screen.queryByRole('button', { name: 'Cargar más' });
    if (!button) return;
    const shown = articles(feed).length;
    await user.click(button);
    await waitFor(() => expect(articles(feed).length).toBeGreaterThan(shown));
    await loadEverything(user, feed);
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the next 10 tweets with "Cargar más" until the feed ends', async () => {
    const user = userEvent.setup();
    const { total } = await services.tweetService.listFeed(ada.id);
    renderApp('/feed', { services });
    const feed = await screen.findByRole('feed', { name: 'Feed' });
    await waitFor(() => expect(articles(feed)).toHaveLength(10));
    expect(screen.getByText(`Mostrando 10 de ${total} tweets`)).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Cargar más' }));
    await waitFor(() => expect(articles(feed)).toHaveLength(20));
    expect(screen.getByText(`Mostrando 20 de ${total} tweets`)).toBeTruthy();

    await loadEverything(user, feed);

    expect(articles(feed)).toHaveLength(total);
    expect(new Set(articles(feed).map((article) => article.textContent)).size).toBe(total);
    expect(screen.getByText(`Has llegado al final: ${total} tweets.`)).toBeTruthy();
  });

  it('loads the next page by itself when the end of the list scrolls into view', async () => {
    const observers = [];
    vi.stubGlobal('IntersectionObserver', createObserverStub(observers));
    renderApp('/feed', { services });
    const feed = await screen.findByRole('feed', { name: 'Feed' });
    await waitFor(() => expect(articles(feed)).toHaveLength(10));
    await waitFor(() => expect(observers.some((observer) => observer.active)).toBe(true));

    act(() => {
      observers
        .filter((observer) => observer.active)
        .forEach((observer) => observer.callback([{ isIntersecting: true }]));
    });

    await waitFor(() => expect(articles(feed)).toHaveLength(20));
  });

  it('does not load anything while the end of the list stays out of view', async () => {
    vi.stubGlobal('IntersectionObserver', createObserverStub([]));
    renderApp('/feed', { services });
    const feed = await screen.findByRole('feed', { name: 'Feed' });
    await waitFor(() => expect(articles(feed)).toHaveLength(10));

    expect(articles(feed)).toHaveLength(10);
  });
});
