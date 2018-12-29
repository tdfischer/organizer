import * as Actions from '../actions'
import Immutable from 'immutable'

export default function(state = Immutable.Map(), action = {}) {
    switch (action.type) {
    case Actions.Geocache.UPDATE_CURRENT_LOCATION:
        return state.set('accuracy', action.accuracy).set('currentLocation', action.geo)
    case Actions.Geocache.SET_LOCATION_STATUS:
        return state.set('status', action.status)
    default:
        return Immutable.Map({
            currentLocation: undefined,
            status: undefined,
            accuracy: undefined
        }).merge(state)
    }
}
