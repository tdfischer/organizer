export const getCurrentUser = state => state.getIn(['auth', 'user'], {})
export const getLoggedIn = state => !!getCurrentUser(state).id
