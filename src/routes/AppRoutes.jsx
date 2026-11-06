import { Route, Routes } from 'react-router';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ChooseUsernamePage from '../pages/auth/ChooseUsernamePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ComposePage from '../pages/ComposePage';
import FeedPage from '../pages/FeedPage';
import FollowListPage from '../pages/FollowListPage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import SearchPage from '../pages/SearchPage';
import UserPage from '../pages/UserPage';
import { PublicOnly, RequireAuth, RequireMissingUsername } from './guards';
import { Paths } from './paths';

/** Route table: public pages in AuthLayout, private pages in AppLayout behind RequireAuth. */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route element={<PublicOnly />}>
          <Route path={Paths.LOGIN} element={<LoginPage />} />
          <Route path={Paths.REGISTER} element={<RegisterPage />} />
        </Route>
        <Route element={<RequireMissingUsername />}>
          <Route path={Paths.CHOOSE_USERNAME} element={<ChooseUsernamePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={Paths.HOME} element={<HomePage />} />
          <Route path={Paths.COMPOSE} element={<ComposePage />} />
          <Route path={Paths.FEED} element={<FeedPage />} />
          <Route path={Paths.FOLLOWING} element={<FollowListPage kind="following" />} />
          <Route path={Paths.FOLLOWERS} element={<FollowListPage kind="followers" />} />
          <Route path={Paths.SEARCH} element={<SearchPage />} />
          <Route path={Paths.USER} element={<UserPage />} />
          <Route path={Paths.USER_FOLLOWING} element={<FollowListPage kind="following" />} />
          <Route path={Paths.USER_FOLLOWERS} element={<FollowListPage kind="followers" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
