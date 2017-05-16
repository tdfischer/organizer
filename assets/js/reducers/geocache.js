import * as Actions from '../actions'

export default function(state = {}, action) {
    switch (action.type) {
    case Actions.Geocache.REQUEST_GEOCODE:
        return {
            ...state,
            cache: {
                [action.address]: {},
                ...state.cache
            }
        }
    case Actions.Geocache.RECEIVE_GEOCODE:
        return {
            ...state,
            cache: {
                ...state.cache,
                [action.address]: action.geo
            }
        }
    case Actions.Geocache.UPDATE_CURRENT_LOCATION:
        return {
            ...state,
            currentLocation: action.geo
        }
    default:
        return {
            cache: {},
            currentLocation: [0, 0],
            ...state
        }
    }
}
