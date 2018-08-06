import * as Model from '../store/model'
import _ from 'lodash'

function mergeModels(currentModels, updatedModels) {
    return _.unionBy(updatedModels, currentModels, 'id')
}

export default function(state = {}, action) {
    switch (action.type) {
    case Model.UPDATE_MODEL: {
        // Extract full list of models from state
        const currentModels = _.get(state.models, action.name, [])
        const updatedModels = mergeModels(currentModels, [action.data])

        return {
            ...state,
            models: {
                ...state.models,
                [action.name]: updatedModels
            }
        }
    }
    case Model.SAVING_MODEL:
        return {
            ...state,
            saving: state.saving + 1,
            modified: true
        }
    case Model.SAVED_MODEL:
        return {
            ...state,
            saving: state.saving - 1,
            modified: false 
        }
    case Model.REQUEST_MODELS:
        return {
            ...state,
            loading: state.loading + 1
        }
    case Model.RECEIVE_MODELS: {
        const currentModels = _.get(state.models, action.name, [])
        return {
            ...state,
            loading: state.loading - 1,
            models: {
                ...state.models,
                [action.name]: mergeModels(currentModels, action.models)
            }
        }
    }
    default:
        return {
            loading: 0,
            saving: false,
            modified: false,
            models: {},
            ...state
        }
    }
}
