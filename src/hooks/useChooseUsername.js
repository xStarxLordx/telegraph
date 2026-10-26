import { validateUsername } from '../domain/validation';
import { useServices } from '../services/ServicesContext';
import useForm from './useForm';

const initialValues = { username: '' };

/**
 * Form to pick the username of an account that has none yet (first Google login). Nothing
 * navigates here: once the account has a username, the route guards let it into the app.
 */
export default function useChooseUsername() {
  const { authService } = useServices();
  return useForm({
    idPrefix: 'choose-username',
    initialValues,
    validate: ({ username }) => ({ username: validateUsername(username) }),
    submit: ({ username }) => authService.claimUsername(username),
  });
}
