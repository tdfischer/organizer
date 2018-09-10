import { point } from '@turf/helpers'

export const getCurrentLocation = state => state.getIn(['geocache', 'currentLocation']) ? point(state.getIn(['geocache', 'currentLocation'])) : null
