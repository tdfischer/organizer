import { createSelector } from 'reselect'

export const Geocache = require('./geocache')

export const getCurrentID = state => state.currentAction.id

export const getCurrentUser = state => state.auth.user
export const getLoggedIn = createSelector(
    [getCurrentUser],
    currentUser => !!currentUser.id
)

export const getModified = state => state.model.modified
export const getSaving = state => state.model.saving
export const getLoading = state => state.model.loading
