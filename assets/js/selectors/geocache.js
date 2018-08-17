import { point } from '@turf/helpers'

export const getGeocache = state => state.geocache.cache
export const getCurrentLocation = state => state.geocache.currentLocation ? point(state.geocache.currentLocation) : null
