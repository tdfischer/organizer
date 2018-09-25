import * as _geocache from './geocache'
export const Geocache = _geocache

export const RECEIVE_USER = 'RECEIVE_USER'

export const logout = () => {
    return dispatch => {
        return fetch('/api/users/logout/').then(() =>
            Promise.resolve(dispatch(receiveUser({})))
        )
    }
}

export const receiveUser = (u) => {
    return {
        type: RECEIVE_USER,
        user: u
    }
}
