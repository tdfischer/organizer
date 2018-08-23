import { point } from '@turf/helpers'

export const getGeocache = state => state.getIn(['geocache', 'cache']).toJS()
export const getCurrentLocation = state => state.getIn(['geocache', 'currentLocation']) ? point(state.getIn(['geocache', 'currentLocation']).toJS()) : null
