import _ from 'lodash'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'

import Model, { UPDATE_MODEL, REQUEST_MODELS, RECEIVE_MODELS } from './model'
import organizerApp from '../reducers'

const mockStore = configureMockStore([thunk])

it('should bind action creators', () => {
    const func = jest.fn()
    const model = new Model('test')
    const boundCalls = model.bindActionCreators(func)
    _.each(boundCalls, c => c())
    expect(func).toHaveBeenCalledTimes(12)
})

it('should update', () => {
    const store = mockStore()
    const model = new Model('test')
    return store.dispatch(model.update(1, {id: 1}))
      .then(() => {
          expect(store.getActions()[0]).toEqual({type: UPDATE_MODEL, id: 1, data: {id: 1}, name: 'test'})
      })
})

it('should fetch one page', () => {
    const store = mockStore()
    const model = new Model('test')
    fetchMock.mock('/api/test/?', {results: []})
    return store.dispatch(model.fetchAll())
      .then(() => {
          expect(store.getActions()).toHaveLength(2)
          expect(store.getActions()[0]).toEqual({type: REQUEST_MODELS, name: 'test'})
          expect(store.getActions()[1]).toEqual({type: RECEIVE_MODELS, models: [], name: 'test'})
      })
})

it('should create data', () => {
    const store = mockStore()
    const model = new Model('test')
    fetchMock.mock('/api/test/', {id: 1})
    return store.dispatch(model.create({}))
      .then((id) => {
          expect(store.getActions()[0]).toEqual({data: {id: id}, id: id, type: UPDATE_MODEL, name: 'test'})
      })
})
