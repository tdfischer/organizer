import { createSelector } from 'reselect'
import _ from 'lodash'
import _memoize from 'lodash/memoize'
import _fromPairs from 'lodash/fromPairs'
import _map from 'lodash/map'
import _get from 'lodash/get'
import _isEmpty from 'lodash/isEmpty'
import _pickBy from 'lodash/pickBy'
import { bindActionCreators } from 'redux'
import { point } from '@turf/helpers'

import { csrftoken } from '../Django'
import Queue from 'promise-queue'
import Immutable from 'immutable'

export const REQUEST_MODELS = 'REQUEST_MODELS'
export const RECEIVE_MODELS = 'RECEIVE_MODELS'
export const UPDATE_MODEL = 'UPDATE_MODEL'
export const SAVING_MODEL = 'SAVING_MODEL'
export const SAVED_MODEL = 'SAVED_MODEL'

const fetchQueue = new Queue(2)

function queuedFetch() {
    const args = arguments
    return fetchQueue.add(() => {
        return fetch.apply(null, args)
            .then(response => {
                if (!response.ok) {
                    return Promise.reject(response)
                } else {
                    return response
                }
            })
    })
}

const getAllModels = state => state.getIn(['model', 'models'])

const modelGetter = _memoize((name) => {
    return createSelector(
        [getAllModels],
        models => {
            return models.get(name, Immutable.Map())
        }
    )
})

export default class Model {
    constructor(name, options = {}) {
        this.name = name
        this.options = options
    }

    immutableSelect(state) {
        return modelGetter(this.name)(state).toKeyedSeq().map(m => {
            const geo = (m.geo && m.geo.lat && m.geo.lng) ? point([m.geo.lat, m.geo.lng]) : undefined
            return {
                ...m,
                geo: geo
            }
        })
    }

    bindActionCreators(dispatch) {
        const funcNames = ['saving', 'saved', 'save', 'fetchOne', 'fetchIfNeeded', 'fetchAll', 'update', 'create', 'updateAndSave', 'request', 'receive']
        const funcPairs = _map(funcNames, name => [name, this[name].bind(this)])
        const bindable = _fromPairs(funcPairs)
        return bindActionCreators(bindable, dispatch)
    }

    saving(id) {
        return {
            type: SAVING_MODEL,
            id: Number(id)
        }
    }

    saved(id) {
        return {
            type: SAVED_MODEL,
            id: Number(id)
        }
    }

    save(id) {
        return (dispatch, getState) => {
            const selector = new Model(this.name).immutableSelect(getState())
            const model = selector.get(id)
            dispatch(this.saving(id))
            const data = {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(model)
            }
            
            console.groupCollapsed('PUT %s %s', this.name, id)
            console.log(data)
            console.groupEnd()
            return queuedFetch('/api/'+this.name+'/'+id+'/', data).then(() => {
                dispatch(this.saved(id))
                return Promise.resolve()
            })
        }
    }

    fetchIfNeeded(id) {
        return (dispatch, getState) => {
            if (!this.immutableSelect(getState()).has(id)) {
                return dispatch(this.fetchOne(id))
            }
        }
    }

    fetchOne(id) {
        return dispatch => {
            dispatch(this.request())
            console.log('GET %s %s', this.name, id)
            return queuedFetch('/api/'+this.name+'/'+id+'/', {credentials: 'include'})
                .then(response => response.json())
                .then(json => {
                    if (!_.isEmpty(json))
                        return dispatch(this.receive([json]))
                })
        }
    }

    fetchAll(params = {}) {
        return dispatch => {
            dispatch(this.request())
            const url = _get(this.options, 'url', '/api/'+this.name+'/')
            const urlParams = new URLSearchParams(Object.entries(_pickBy(params, p => p != undefined)))
            console.groupCollapsed('GET %s page=%s', this.name, _get(params, 'page', 1))
            console.log(params)
            console.groupEnd()
            return queuedFetch(url+'?'+urlParams, {credentials: 'include'})
                .then(response => response.json())
                .then(json => {
                    if (json.next) {
                        const nextPage = (params.page || 1) + 1
                        const ret = dispatch(this.fetchAll({...params, page: nextPage}, this.options))
                        dispatch(this.receive(json.results))
                        return ret
                    } else {
                        return dispatch(this.receive(json.results))
                    }
                })
        }
    }

    update(id, dataOrCallback) {
        return (dispatch, getState) => {
            if (typeof dataOrCallback == 'function') {
                const foundItem = this.immutableSelect(getState()).get(id)
                return dispatch(this.update(id, dataOrCallback(foundItem)))
            } else {
                console.groupCollapsed('update %s %s', this.name, id)
                console.log(dataOrCallback)
                console.groupEnd()
                dispatch({
                    type: UPDATE_MODEL,
                    id: id,
                    data: dataOrCallback,
                    name: this.name
                })
                return Promise.resolve()
            }
        }
    }

    create(modelData) {
        return dispatch => {
            const data = {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(modelData)
            }
            console.groupCollapsed('POST %s', this.name)
            console.log(data)
            console.groupEnd()
            return queuedFetch('/api/'+this.name+'/', data)
                .then(response => response.json())
                .then(json => {
                    if (!_isEmpty(json)) {
                        dispatch(this.update(json.id, json))
                        return Promise.resolve(json.id)
                    }
                })
        }
    }

    updateAndSave(id, dataOrCallback) {
        return dispatch => {
            return dispatch(this.update(id, dataOrCallback))
                .then(() => dispatch(this.save(id)))
        }
    }

    request() {
        return {
            type: REQUEST_MODELS,
            name: this.name
        }
    }

    receive(results) {
        return {
            type: RECEIVE_MODELS,
            name: this.name,
            models: results || []
        }
    }
}
