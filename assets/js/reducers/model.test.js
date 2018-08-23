import modelReducer from './model'
import Model from '../store/model'
import _ from 'lodash'
import Immutable from 'immutable'

function updateModel(data) {
    return {
        type: 'UPDATE_MODEL',
        id: data.id,
        data: data,
        name: 'test'
    }
}

it('should append models to an empty store', () => {
    const testModel = new Model('test')
    var testRows = []
    var state = undefined
    for(var i = 0; i < 100; i++) {
        const modelInstance = {id: i}
        testRows.push(modelInstance)
        state = modelReducer(state, updateModel(modelInstance))
    }
    expect(state)
      .toMatchObject({models: {test: expect.arrayContaining(testRows)}})
})

it('should update models', () => {
    const testModel = new Model('test')
    const testRows = []
    const updatedRows = []
    var state = undefined
    for(var i = 0; i < 100; i++) {
        const modelInstance = {id: i}
        testRows.push(modelInstance)
    }
    state = {models: {test: testRows}}

    for(var i = 0; i < 100; i++) {
        const modelInstance = {id: i, updated: i % 3}
        updatedRows.push(modelInstance)
        state = modelReducer(state, updateModel(modelInstance))
    }

    expect(state)
      .toMatchObject({models: {test: expect.arrayContaining(updatedRows)}})
})

it('should maintain array order when updating', () => {
    const testModel = new Model('test')
    const testRows = []
    const updatedRows = []
    var state = undefined
    for(var i = 0; i < 100; i++) {
        const modelInstance = {id: i}
        testRows.push(modelInstance)
    }
    state = {models: {test: testRows}}

    for(var i = 0; i < 100; i++) {
        const modelInstance = {id: i, updated: i % 3}
        updatedRows.push(modelInstance)
        state = modelReducer(state, updateModel(modelInstance))
    }

    for(var i = 100; i >= 0; i++) {
        const modelInstance = {id: i, updated: i % 3}
        state = modelReducer(state, updateModel(modelInstance))
    }

    expect(state.toJS())
      .toMatchObject({models: {test: expect.arrayContaining(updatedRows)}})
})
