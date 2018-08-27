import { createSelector } from 'reselect'

export const getCurrentUser = state => state.getIn(['auth', 'user'], {})
export const getLoggedIn = createSelector(
    [getCurrentUser],
    currentUser => !!currentUser.id
)
