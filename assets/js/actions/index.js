import { csrftoken } from '../Django'

import * as _geocache from './geocache'
export const Geocache = _geocache

export const REQUEST_USER = 'REQUEST_USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const SET_CURRENT_ACTION = 'SET_CURRENT_ACTION'

function shouldFetchUser(state) {
    const validID = !!state.auth.user.id
    const isLoading = state.auth.loading
    if (validID) {
        return false
    } else {
        return !isLoading
    }
}

export const logout = () => {
    return receiveUser({})
}

export const login = () => {
    return (dispatch, getState) => {
        if (shouldFetchUser(getState())) {
            //dispatch(loadingUser())
            const data = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrftoken
                }
            }
            return fetch('/api/users/me/', data).then(response => {
                return dispatch(receiveUser(response.data))
            })
        }
    }
}

export const receiveUser = (u) => {
    return {
        type: RECEIVE_USER,
        user: u
    }
}

export const requestUser = () => {
    return {
        type: REQUEST_USER,
    }
}

export const setCurrentAction = (id) => {
    return {
        type: SET_CURRENT_ACTION,
        id: Number(id)
    }
}
