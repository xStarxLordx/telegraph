// What the hooks in src/hooks take and return.
import type { FormEvent } from 'react';
import type { CounterState } from '../hooks/useTweetDraft';
import type { AppErrorCode } from './errors';
import type { Page, PageRequest } from './pagination';
import type { Tweet } from './tweet';
import type { User } from './user';

/** What `useAsyncAction().run` resolves to: it never throws. */
export type AsyncActionResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface AsyncActionState<A extends unknown[], T> {
  run(...args: A): Promise<AsyncActionResult<T>>;
  pending: boolean;
  /** The last failure, until the next run or `clearError()`. */
  error: unknown;
  clearError(): void;
}

/** A load result, remembering which `load` produced it. */
export interface AsyncDataResult<T> {
  load: (() => Promise<T>) | null;
  data: T | undefined;
  error: unknown;
}

export interface AsyncDataState<T> {
  /** While it reloads, the previous data stays available. */
  data: T | undefined;
  loading: boolean;
  error: unknown;
}

/** Form values: every field is text. */
export type FormValues<V> = Record<keyof V, string>;

/** An error code (or null) per field. */
export type FieldErrors<V extends FormValues<V>> = Partial<Record<keyof V, AppErrorCode | null>>;

export interface FormOptions<V extends FormValues<V>> {
  /** Field controls have the id `${idPrefix}-${field}`. */
  idPrefix: string;
  initialValues: V;
  /** Runs before `submit`. */
  validate(values: V): FieldErrors<V>;
  /** A ServiceError it throws lands on its `field`, otherwise on the whole form. */
  submit(values: V): Promise<unknown>;
}

/** Props for a TextField / TextArea bound to one field. */
export interface FieldProps {
  id: string;
  value: string;
  onChange(value: string): void;
  error: string;
}

export interface FormState<V extends FormValues<V>> {
  values: V;
  setValues(values: V): void;
  setField(name: keyof V, value: string): void;
  fieldErrors: FieldErrors<V>;
  /** Error code of the whole form. */
  formError: AppErrorCode | null;
  clearFormError(): void;
  pending: boolean;
  handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void>;
  fieldProps(
    name: keyof V,
    translateError: (code: AppErrorCode | null | undefined) => string,
  ): FieldProps;
}

export interface LoginValues {
  username: string;
  password: string;
}

export interface RegisterValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  /** UI-only: must repeat `password`. */
  confirmPassword: string;
}

export interface FollowByUsernameValues {
  username: string;
}

export interface ChooseUsernameValues {
  username: string;
}

export interface LoginState {
  form: FormState<LoginValues>;
  loginWithGoogle(): Promise<AsyncActionResult<unknown>>;
  googlePending: boolean;
  /** True while either login method is running. */
  pending: boolean;
  /** Error code or ServiceError of the latest failed attempt (translate with useErrorMessage). */
  error: unknown;
}

/** Loads one page of a list; memoize it (useCallback). */
export type PageFetcher<T> = (request: Required<PageRequest>) => Promise<Page<T>>;

/** One page load of usePaginatedList: which source, which cursor, which reload. */
export interface PageLoad<T> {
  fetchPage: PageFetcher<T>;
  cursor: string | null;
  pageIndex: number;
  reloadToken: number;
}

/** The last page load that finished, and its outcome. */
export interface SettledPageLoad<T> {
  request: PageLoad<T> | null;
  page: Page<T>;
  error: unknown;
}

export interface PaginatedList<T> {
  /** While another page loads, the previous page's items stay visible. */
  items: T[];
  total: number;
  /** 1-based. */
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  next(): void;
  prev(): void;
  loading: boolean;
  /** True once a page of the current source has loaded (totals are meaningful). */
  settled: boolean;
  error: unknown;
  reload(): void;
  /** Back to page 1 (e.g. after an invalid cursor), reloading it. */
  first(): void;
}

export type CounterStateValue = (typeof CounterState)[keyof typeof CounterState];

export interface TweetCounter {
  count: number;
  max: number;
  state: CounterStateValue;
  canPublish: boolean;
}

export interface TweetDraft {
  text: string;
  setText(text: string): void;
  counter: TweetCounter;
  /** Posts the draft as the logged-in user. */
  publish(): Promise<Tweet>;
}

export interface FollowUserState {
  followUser(user: User): Promise<void>;
  isPending(userId: string): boolean;
  error: unknown;
}
