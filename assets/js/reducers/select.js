import _ from 'lodash'
import * as Select from '../store/select'

function addSelection(state, action) {
    return {
        ...state,
        selections: {
            [action.key]: [..._.get(state.selections, action.key, []), action.item]
        }
    }
}

function removeSelection(state, action) {
    return {
        ...state,
        selections: {
            [action.key]: _.without(_.get(state.selections, action.key, []), action.item)
        }
    }
}

export default function selections(state = {}, action) {
    switch (action.type) {
    case Select.SET_SELECTION:
        return {
            ...state,
            selections: {
                [action.key]: action.selection
            }
        }
    case Select.ADD_SELECTION:
        return addSelection(state, action)
    case Select.REMOVE_SELECTION:
        return removeSelection(state, action)
    case Select.TOGGLE_SELECTION: {
        const currentlySelected = _.get(state.selections, action.key, []).indexOf(action.item) != -1
        if (currentlySelected) {
            return removeSelection(state, action)
        } else {
            return addSelection(state, action)
        }
    }
    default:
        return {
            selections: [],
            ...state
        }
    }
}
