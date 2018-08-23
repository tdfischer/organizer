import * as Select from '../store/select'
import Immutable from 'immutable'

export default function selections(state = Immutable.Map(), action = {}) {
    switch (action.type) {
    case Select.SET_SELECTION:
        return state.mergeDeep({
            selections: {
                [action.key]: Immutable.Set(action.selection)
            }
        })
    case Select.ADD_SELECTION:
        return state.updateIn(
            ['selections', action.key],
            Immutable.Set(),
            currentSelection => currentSelection.add(action.item)
        )
    case Select.REMOVE_SELECTION:
        return state.updateIn(
            ['selections', action.key],
            Immutable.Set(),
            currentSelection => currentSelection.subtract(action.item)
        )
    case Select.TOGGLE_SELECTION: {
        return state.updateIn(
            ['selections', action.key],
            Immutable.Set(),
            currentSelection => currentSelection.substract(action.item)
        )
    }
    default:
        return Immutable.Map({
            selections: [],
        }).mergeDeep(state)
    }
}
