import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'

import Model, { UPDATE_MODEL, REQUEST_MODELS, RECEIVE_MODELS, SAVING_MODEL, SAVED_MODEL } from './model'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
    fetchMock.restore()
})

it('should bind action creators', () => {
    const func = jest.fn()
    const model = new Model('test')
    const boundCalls = model.bindActionCreators(func)
    Object.values(boundCalls).forEach(c => c())
    expect(func).toHaveBeenCalledTimes(11)
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
          expect(store.getActions()[0]).toEqual({id: 0, type: SAVING_MODEL, name: 'test'})
          expect(store.getActions()[1]).toEqual({data: {id: id}, id: id, type: UPDATE_MODEL, name: 'test'})
          expect(store.getActions()[2]).toEqual({id: id, type: SAVED_MODEL, name: 'test'})
      })
})

it('should decode geo data properly', () => {
    const model = new Model('test')
    expect(model.deserializeGeo({})).toBeUndefined()
    expect(model.deserializeGeo({lat: undefined, lng: 0})).toBeUndefined()
    expect(model.deserializeGeo({lat: 0, lng: undefined})).toBeUndefined()
    expect(model.deserializeGeo({lat: 0, lng: 0})).not.toBeUndefined()
})
