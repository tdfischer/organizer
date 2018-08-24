import * as Actions from '../actions'
import Immutable from 'immutable'

export default function(state = Immutable.Map(), action = {}) {
    if (!Immutable.isImmutable(state)) {
        state = Immutable.Map()
    }
    switch (action.type) {
    case Actions.Geocache.REQUEST_GEOCODE:
        return state.setIn(['cache', action.address], {})
    case Actions.Geocache.RECEIVE_GEOCODE:
        return state.setIn(['cache', action.address], Immutable.fromJS(action.geo))
    case Actions.Geocache.UPDATE_CURRENT_LOCATION:
        return state.set('currentLocation', Immutable.fromJS(action.geo))
    default:
        return Immutable.Map({
            cache: Immutable.Map(),
            currentLocation: undefined,
        }).mergeDeep(state)
    }
}
