import _ from 'lodash'
import { BloomFilter } from 'bloomfilter'

export const SET_SELECTION = 'SET_SELECTION'
export const ADD_SELECTION = 'ADD_SELECTION'
export const REMOVE_SELECTION = 'REMOVE_SELECTION'
export const TOGGLE_SELECTION = 'TOGGLE_SELECTION'

export const setSelection = (key, selection) => {
    return {
        type: SET_SELECTION,
        key: key,
        selection: selection
    }
}

export const addSelection = (key, newItem) => {
    return {
        type: ADD_SELECTION,
        key: key,
        item: newItem
    }
}

export const removeSelection = (key, oldItem) => {
    return {
        type: REMOVE_SELECTION,
        key: key,
        item: oldItem
    }
}

export const toggleSelection = (key, item) => {
    return {
        type: TOGGLE_SELECTION,
        key: key,
        item: item
    }
}

class SelectionRange {
    constructor(slice) {
        this.slice = slice
        this.bloom = new BloomFilter(32 * 256, 16)
        _.each(slice, i => this.bloom.add(i))
    }

    contains(value) {
        if (this.bloom.test(value)) {
            return this.slice.indexOf(value) != -1
        } else {
            return false
        }
    }
}

export default class Selectable {
    constructor(key) {
        this.key = key
    }

    selected(state) {
        return new SelectionRange(state.getIn(['selections', 'selections', this.key], []))
    }

    bindActionCreators(dispatch) {
        return {
            add: id => dispatch(addSelection(this.key, id)),
            remove: id => dispatch(removeSelection(this.key, id)),
            set: selection => dispatch(setSelection(this.key, selection)),
            toggle: id => dispatch(toggleSelection(this.key, id))
        }
    }
}
