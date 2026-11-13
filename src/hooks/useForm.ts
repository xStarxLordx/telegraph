import { useCallback, useState, type FormEvent } from 'react';
import { ErrorCode, type ServiceError } from '../domain/errors';
import type { AppErrorCode } from '../interfaces/errors';
import type { FieldErrors, FormOptions, FormState, FormValues } from '../interfaces/hooks';

/**
 * Form state shared by every form: values, per-field error codes and a form-level error code.
 * `validate(values)` returns `{ [field]: code|null }` and runs before `submit`; a ServiceError
 * thrown by `submit` lands on its `field` when it has one, otherwise on the whole form.
 * After a failed validation the first invalid control (`${idPrefix}-${field}`) gets the focus.
 */
export default function useForm<V extends FormValues<V>>({
  idPrefix,
  initialValues,
  validate,
  submit,
}: FormOptions<V>): FormState<V> {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<V>>({});
  const [formError, setFormError] = useState<AppErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  const setField = useCallback((name: keyof V, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    // Editing a field clears its error; the next submit validates again.
    setFieldErrors((previous) => (previous[name] ? { ...previous, [name]: null } : previous));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const focusField = (field: string) =>
      (form.elements.namedItem(`${idPrefix}-${field}`) as HTMLElement | null)?.focus();
    const errors = validate(values);
    const firstInvalid = (Object.keys(errors) as (keyof V & string)[]).find(
      (field) => errors[field],
    );
    setFieldErrors(errors);
    setFormError(null);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    setPending(true);
    try {
      await submit(values);
    } catch (error) {
      const { field, code } = (error ?? {}) as Partial<ServiceError>;
      if (field) {
        setFieldErrors({ [field]: code } as FieldErrors<V>);
        focusField(field);
      } else {
        setFormError(code ?? ErrorCode.UNKNOWN);
      }
    } finally {
      setPending(false);
    }
  };

  const clearFormError = useCallback(() => setFormError(null), []);

  /** Props for a TextField / TextArea bound to `name`. */
  const fieldProps: FormState<V>['fieldProps'] = (name, translateError) => ({
    id: `${idPrefix}-${String(name)}`,
    value: values[name],
    onChange: (value) => setField(name, value),
    error: translateError(fieldErrors[name]),
  });

  return {
    values,
    setValues,
    setField,
    fieldErrors,
    formError,
    clearFormError,
    pending,
    handleSubmit,
    fieldProps,
  };
}
