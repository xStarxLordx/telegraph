import { useCallback, useState } from 'react';
import { ErrorCode } from '../domain/errors';

/**
 * Form state shared by every form: values, per-field error codes and a form-level error code.
 * `validate(values)` returns `{ [field]: code|null }` and runs before `submit`; a ServiceError
 * thrown by `submit` lands on its `field` when it has one, otherwise on the whole form.
 * After a failed validation the first invalid control (`${idPrefix}-${field}`) gets the focus.
 *
 * @template {Record<string, string>} V
 * @param {{ idPrefix: string, initialValues: V,
 *   validate: (values: V) => Record<string, string|null>,
 *   submit: (values: V) => Promise<unknown> }} options
 */
export default function useForm({ idPrefix, initialValues, validate, submit }) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [pending, setPending] = useState(false);

  const setField = useCallback((name, value) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    // Editing a field clears its error; the next submit validates again.
    setFieldErrors((previous) => (previous[name] ? { ...previous, [name]: null } : previous));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const errors = validate(values);
    const firstInvalid = Object.keys(errors).find((field) => errors[field]);
    setFieldErrors(errors);
    setFormError(null);
    if (firstInvalid) {
      form.elements.namedItem(`${idPrefix}-${firstInvalid}`)?.focus();
      return;
    }
    setPending(true);
    try {
      await submit(values);
    } catch (error) {
      if (error?.field) {
        setFieldErrors({ [error.field]: error.code });
        form.elements.namedItem(`${idPrefix}-${error.field}`)?.focus();
      } else {
        setFormError(error?.code ?? ErrorCode.UNKNOWN);
      }
    } finally {
      setPending(false);
    }
  };

  const clearFormError = useCallback(() => setFormError(null), []);

  /** Props for a TextField / TextArea bound to `name`. */
  const fieldProps = (name, translateError) => ({
    id: `${idPrefix}-${name}`,
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
