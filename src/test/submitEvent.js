/** A form submit event that is enough for `useForm.handleSubmit` (no DOM, nothing to focus). */
export default function submitEvent() {
  return {
    preventDefault: () => {},
    currentTarget: { elements: { namedItem: () => null } },
  };
}
