import PropTypes from 'prop-types';
import { useFollowingStatus } from '../../hooks/useFollowData';
import useFollowUser from '../../hooks/useFollowUser';
import useErrorMessage from '../../i18n/useErrorMessage';
import Notice from '../Notice/Notice';
import PagedList from '../PagedList/PagedList';
import UserListItem from '../UserListItem/UserListItem';

function PeopleList({ list, label, emptyState, showFollow = true }) {
  const errorMessage = useErrorMessage();
  const { data: following, loading: statusLoading } = useFollowingStatus(
    showFollow ? list.items : [],
  );
  const { followUser, isPending, error } = useFollowUser();

  return (
    <>
      {error && <Notice variant="error">{errorMessage(error)}</Notice>}
      <PagedList list={list} label={label} emptyState={emptyState}>
        {list.items.map((person) => (
          <UserListItem
            key={person.id}
            user={person}
            canFollow={
              showFollow &&
              (isPending(person.id) || (!statusLoading && following?.[person.id] === false))
            }
            onFollow={followUser}
            followPending={isPending(person.id)}
          />
        ))}
      </PagedList>
    </>
  );
}

PeopleList.propTypes = {
  list: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  emptyState: PropTypes.node.isRequired,
  showFollow: PropTypes.bool,
};

export default PeopleList;
