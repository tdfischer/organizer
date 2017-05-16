import * as Filter from '../store/filter'

export default function(state = {}, action) {
    switch (action.type) {
    case Filter.SET_FILTER:
        return {
            ...state,
            filters: {
                [action.key]: action.filter
            }
        }
    default:
        return {
            filters: [],
            ...state
        }
    }
}


