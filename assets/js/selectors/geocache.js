import { point } from '@turf/helpers'

export const getCurrentLocation = state => state.getIn(['geocache', 'currentLocation']) ? point(state.getIn(['geocache', 'currentLocation'])) : null
export const getAccuracy = state => state.getIn(['geocache', 'accuracy'])

export const getLocationStatus = state => state.getIn(['geocache', 'status'])
