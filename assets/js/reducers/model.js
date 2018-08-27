import * as Model from '../store/model'
import _ from 'lodash'
import Immutable from 'immutable'

export default function(state = Immutable.Map(), action = {}) {
    if (!Immutable.isImmutable(state)) {
        state = Immutable.Map()
    }
    switch (action.type) {
    case Model.UPDATE_MODEL: {
        return state.updateIn(['models', action.name], (models = Immutable.Map()) => (
            models.set(action.id, action.data)
        ))
    }
    case Model.SAVING_MODEL:
        return state.update('saving', i => i + 1)
    case Model.SAVED_MODEL:
        return state.update('saving', i => i - 1)
    case Model.REQUEST_MODELS:
        return state.update('loading', i => i + 1)
    case Model.RECEIVE_MODELS: {
        return state.updateIn(['models', action.name], (models = Immutable.Map()) => (
            models.merge(_.fromPairs(_.map(action.models, m => [m.id, m])))
        )).update('loading', i => i - 1)
    }
    default:
        return Immutable.Map({
            loading: 0,
            saving: false,
            modified: false,
            models: Immutable.Map(),
        }).mergeDeep(state)
    }
}
