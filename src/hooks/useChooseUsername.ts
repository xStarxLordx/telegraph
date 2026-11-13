import { validateUsername } from '../domain/validation';
import type { ChooseUsernameValues, FormState } from '../interfaces/hooks';
import { useServices } from '../services/ServicesContext';
import useForm from './useForm';

const initialValues: ChooseUsernameValues = { username: '' };

/**
 * Form to pick the username of an account that has none yet (first Google login). Nothing
 * navigates here: once the account has a username, the route guards let it into the app.
 */
export default function useChooseUsername(): FormState<ChooseUsernameValues> {
  const { authService } = useServices();
  return useForm({
    idPrefix: 'choose-username',
    initialValues,
    validate: ({ username }) => ({ username: validateUsername(username) }),
    submit: ({ username }) => authService.claimUsername(username),
  });
}
