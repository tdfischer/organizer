export const SET_FILTER = 'SET_FILTER'

export const setFilter = (key, filter) => {
    return {
        type: SET_FILTER,
        key: key,
        filter: filter
    }
}

const isEqual = (a, b) => a == b

export default class Filterable {
    constructor(key, matcher = isEqual) {
        this.key = key
        this.matcher = matcher
    }

    filtered(state, values) {
        const filterConfig = state.getIn(['filters', 'filters', this.key])
        return values.filter(value => this.matcher(value, filterConfig))
    }

    getFilter(state) {
        return state.getIn(['filters', 'filters', this.key])
    }

    bindActionCreators(dispatch) {
        return {
            set: f => dispatch(setFilter(this.key, f))
        }
    }
}
