import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import { Paths } from '../../routes/paths';
import { LinkButton } from '../Button/Button';
import ButtonVariant from '../Button/buttonVariant';
import EmptyState from '../EmptyState/EmptyState';

function UserNotFound({ username }) {
  const { t } = useTranslation();
  usePageTitle(t('user.notFoundTitle'));
  return (
    <EmptyState
      title={t('user.notFoundTitle')}
      message={t('user.notFoundMessage', { username })}
      action={
        <LinkButton to={Paths.HOME} variant={ButtonVariant.GHOST}>
          {t('notFound.backHome')}
        </LinkButton>
      }
    />
  );
}

UserNotFound.propTypes = {
  username: PropTypes.string.isRequired,
};

export default UserNotFound;
