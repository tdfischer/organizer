import * as Actions from '../actions'
import Immutable from 'immutable'

export default function(state = Immutable.Map(), action = {}) {
    switch (action.type) {
    case Actions.Geocache.UPDATE_CURRENT_LOCATION:
        return state.set('currentLocation', action.geo)
    default:
        return Immutable.Map({
            currentLocation: undefined,
        }).merge(state)
    }
}
