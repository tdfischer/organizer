export const Geocache = require('./geocache')
export const Auth = require('./auth')

export const getSaving = state => state.getIn(['model', 'saving'])
export const getLoading = state => state.getIn(['model', 'loading'])
