import * as Filter from '../store/filter'
import Immutable from 'immutable'

export default function(state = Immutable.Map(), action = {}) {
    switch (action.type) {
    case Filter.SET_FILTER:
        return state.mergeDeep({
            filters: {
                [action.key]: action.filter
            }
        })
    default:
        return Immutable.Map({
            filters: [],
        }).mergeDeep(state)
    }
}


