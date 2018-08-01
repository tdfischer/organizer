export const Geocache = require('./geocache')
export const Auth = require('./auth')

export const getCurrentID = state => state.currentAction.id

export const getModified = state => state.model.modified
export const getSaving = state => state.model.saving
export const getLoading = state => state.model.loading
