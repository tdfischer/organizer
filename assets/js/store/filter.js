import _ from 'lodash'

export const SET_FILTER = 'SET_FILTER'

export const setFilter = (key, filter) => {
    return {
        type: SET_FILTER,
        key: key,
        filter: filter
    }
}

export default class Filterable {
    constructor(key, reducer = _.identity, matcher = _.isMatch) {
        this.key = key
        this.reducer = reducer
        this.matcher = matcher
    }

    filtered(state, values) {
        const regexp = _.get(state.filters.filters, this.key)
        return _.filter(values, v => this.matcher(this.reducer(v), regexp))
    }

    bindActionCreators(dispatch) {
        return {
            set: f => dispatch(setFilter(this.key, f))
        }
    }
}
