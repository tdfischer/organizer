import Immutable from 'immutable'
import { createSelector } from 'reselect'

export const getCurrentUser = state => state.getIn(['auth', 'user'], Immutable.Map()).toJS()
export const getLoggedIn = createSelector(
    [getCurrentUser],
    currentUser => !!currentUser.id
)
