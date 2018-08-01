import * as _geocache from './geocache'
export const Geocache = _geocache

export const REQUEST_USER = 'REQUEST_USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const SET_CURRENT_ACTION = 'SET_CURRENT_ACTION'

export const logout = () => {
    return receiveUser({})
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
