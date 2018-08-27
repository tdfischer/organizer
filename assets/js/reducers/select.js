import * as Select from '../store/select'
import Immutable from 'immutable'

export default function selections(state = Immutable.Map(), action = {}) {
    switch (action.type) {
    case Select.SET_SELECTION:
        return state.setIn(['selections', action.key], Immutable.Set(action.selection))
    case Select.ADD_SELECTION:
        return state.updateIn(
            ['selections', action.key],
            (currentSelection = Immutable.Set()) => currentSelection.add(action.item)
        )
    case Select.REMOVE_SELECTION:
        return state.updateIn(
            ['selections', action.key],
            (currentSelection = Immutable.Set()) => currentSelection.delete(action.item)
        )
    case Select.TOGGLE_SELECTION: {
        return state.updateIn(
            ['selections', action.key],
            (currentSelection = Immutable.Set()) => (currentSelection.contains(action.item) ? currentSelection.delete(action.item) : currentSelection.add(action.item))
        )
    }
    default:
        return Immutable.Map({
            selections: Immutable.Map(),
        }).mergeDeep(state)
    }
}
