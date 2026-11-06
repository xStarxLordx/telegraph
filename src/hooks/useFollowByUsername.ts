import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast/ToastContext';
import { validateUsername } from '../domain/validation';
import type { FollowByUsernameValues, FormState } from '../interfaces/hooks';
import { useSocial } from '../social/SocialContext';
import useForm from './useForm';

export default function useFollowByUsername(): FormState<FollowByUsernameValues> {
  const { t } = useTranslation();
  const { followByUsername } = useSocial();
  const { showToast } = useToast();

  const form = useForm<FollowByUsernameValues>({
    idPrefix: 'follow-by-username',
    initialValues: { username: '' },
    validate: ({ username }) => ({ username: validateUsername(username) }),
    submit: async ({ username }) => {
      const followee = await followByUsername(username);
      form.setValues({ username: '' });
      showToast(t('follow.followed', { username: followee.username }));
    },
  });

  return form;
}
