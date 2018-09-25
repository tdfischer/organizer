import { RECEIVE_USER, logout } from './'
import fetchMock from 'fetch-mock'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
    fetchMock.restore()
})

it('should fetch the logout endpoint when the logout action is dispatched', () => {
    const store = mockStore()
    fetchMock.mock('/api/users/logout/', {})
    return store.dispatch(logout())
        .then(() => {
            expect(store.getActions()).toHaveLength(1)
            expect(store.getActions()[0]).toEqual({type: RECEIVE_USER, user: {}})
        })
})
