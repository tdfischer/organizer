import Immutable from 'immutable'
import * as Actions from '../actions'

export default function(state = Immutable.Map(), action={}) {
    switch (action.type) {
    case Actions.RECEIVE_USER:
        return state.merge({
            user: action.user
        })
    default: {
        const hasInline = (typeof window.CURRENT_USER != 'undefined')
        const defaultUser = hasInline ? window.CURRENT_USER : {}
        return Immutable.Map({
            user: defaultUser,
        }).merge(state)
    }
    }
}


