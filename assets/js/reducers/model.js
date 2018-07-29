import * as Model from '../store/model'
import _ from 'lodash'

export default function(state = {}, action) {
    switch (action.type) {
    case Model.UPDATE_MODEL: {
        // Extract full list of models from state
        const currentModels = _.get(state.models, action.name, [])

        const index = _.findIndex(currentModels, {id: action.id})

        var updatedModels

        if (index == -1) {
            updatedModels = [...currentModels, action.data]
        } else {
            updatedModels = _.map(currentModels, m => {
                if (m.id == action.id) {
                    return action.data
                } else {
                    return m
                }
            })
        }

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
    case Model.RECEIVE_MODELS:
        return {
            ...state,
            loading: state.loading - 1,
            models: {
                ...state.models,
                [action.name]: [...action.models, ..._.get(state.models, action.name, [])]
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
