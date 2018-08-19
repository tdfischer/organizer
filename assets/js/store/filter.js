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
    constructor(key, matcher = _.isMatch) {
        this.key = key
        this.matcher = matcher
    }

    filtered(state, values) {
        const filterConfig = _.get(state.filters.filters, this.key)
        return _.filter(values, value => this.matcher(value, filterConfig))
    }

    bindActionCreators(dispatch) {
        return {
            set: f => dispatch(setFilter(this.key, f))
        }
    }
}
