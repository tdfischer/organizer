import { createSelector } from 'reselect'

export const getCurrentUser = state => state.auth.user
export const getLoggedIn = createSelector(
    [getCurrentUser],
    currentUser => !!currentUser.id
)
