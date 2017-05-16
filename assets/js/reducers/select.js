import _ from 'lodash'
import * as Select from '../store/select'

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
        return {
            ...state,
            selections: {
                [action.key]: [..._.get(state.selections, action.key, []), action.item]
            }
        }
    case Select.REMOVE_SELECTION:
        return {
            ...state,
            selections: {
                [action.key]: _.without(_.get(state.selections, action.key, []), action.item)
            }
        }
    case Select.TOGGLE_SELECTION: {
        const currentlySelected = _.get(state.selections, action.key, []).indexOf(action.item) != -1
        if (currentlySelected) {
            return {
                ...state,
                selections: {
                    [action.key]: _.without(_.get(state.selections, action.key, []), action.item)
                }
            }
        } else {
            return {
                ...state,
                selections: {
                    [action.key]: [..._.get(state.selections, action.key, []), action.item]
                }
            }
        }
    }
    default:
        return {
            selections: [],
            ...state
        }
    }
}
