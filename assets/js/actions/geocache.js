import _ from 'lodash'
import base64 from 'base-64'
import Queue from 'promise-queue'

import { OpenStreetMapProvider } from 'leaflet-geosearch'

const provider = new OpenStreetMapProvider()

export const REQUEST_GEOCODE = 'REQUEST_GEOCODE'
export const RECEIVE_GEOCODE = 'RECEIVE_GEOCODE'
export const UPDATE_CURRENT_LOCATION = 'UPDATE_CURRENT_LOCATION'

export const updateCurrentLocation = coords => {
    return dispatch => {
        dispatch({
            type: UPDATE_CURRENT_LOCATION,
            geo: coords
        })
    }
}

export const requestGeocode = address => {
    return {
        type: REQUEST_GEOCODE,
        address: address
    }
}

export const receiveGeocode = (address, geo) => {
    return {
        type: RECEIVE_GEOCODE,
        address: address,
        geo: geo
    }
}

const fetchQueue = new Queue(2)

export const fetchGeocode = address => {
    return dispatch => {
        dispatch(requestGeocode(address))
        return fetchQueue.add(() => provider.search({query: address}))
            .then(addr => {
                if (addr[0]) {
                    return dispatch(receiveGeocode(address, {
                        lat: parseFloat(addr[0].y),
                        lng: parseFloat(addr[0].x),
                        label: addr[0].display_name
                    }))
                }
            })
    }
}

const getGeocache = state => state.geocache.cache

const shouldFetchGeocode = (state, address) => {
    const addr = _.get(getGeocache(state), address)
    if (addr) {
        return false
    } else {
        return true
    }
}

export const fetchGeocodeWithCache = (address, cache) => {
    return (dispatch, getState) => {
        if (!shouldFetchGeocode(getState(), address)) {
            return
        }
        const cacheMarker = '🔵'

        if (cache && _.startsWith(cache, cacheMarker)) {
            const decodedCache = JSON.parse(base64.decode(_.trimStart(cache, cacheMarker)))
            if (decodedCache) {
                return dispatch(receiveGeocode(address, decodedCache.o))
            }
        }
        return dispatch(fetchGeocode(address))
    }
}
