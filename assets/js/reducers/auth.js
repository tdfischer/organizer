import * as Actions from '../actions'

export default function(state = {}, action) {
    switch (action.type) {
    case Actions.RECEIVE_USER:
        return {
            ...state,
            loading: false,
            user: action.user
        }
    case Actions.REQUEST_USER:
        return {
            ...state,
            loading: true
        }
    default: {
        const hasInline = (typeof window.CURRENT_USER != 'undefined')
        const defaultUser = hasInline ? window.CURRENT_USER : {}
        if (hasInline && !state.user && window.Raven) {
            window.Raven.captureBreadcrumb({
                message: 'User loaded from sideload cache',
                category: 'action',
                data: window.CURRENT_USER,
            })
        }
        return {
            loading: false,
            user: defaultUser,
            ...state
        }
    }
    }
}


