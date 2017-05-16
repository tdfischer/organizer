import { createSelector } from 'reselect'
import _ from 'lodash'
import moment from 'moment'
import slug from 'slug'
import geolib from 'geolib'
import { getGeocache }  from '../selectors/geocache'
import { bindActionCreators } from 'redux'

import { csrftoken } from '../Django'
import { fetchGeocodeWithCache } from '../actions/geocache'
import Queue from 'promise-queue'

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
    })
}

const preprocessors = {
    'members': m => {
        return {
            ...m.fields,
            id: m.id
        }
    }
}

const sideloaders = {
    members: (m, dispatch) => {
        dispatch(fetchGeocodeWithCache(m.fields['Full Address'], m.fields['Geocode Cache']))
    },
    people: (m, dispatch) => {
        dispatch(fetchGeocodeWithCache(m.address.raw, ''))
    }
}

const recipes = {
    members: {
        geo: (member, state) => _.get(getGeocache(state), member['Full Address'])
    },
    people: {
        geo: (person, state) => _.get(getGeocache(state), person.address.raw)
    },
    actions: {
        slug: action => slug(action.name || 'Untitled'),
        date: action => moment(action.date)
    }
}

const getAllModels = state => state.model.models

const modelCooker = _.memoize((name) => {
    return createSelector(
        [getAllModels, _.identity],
        (models, state) => {
            const myModels = _.get(models, name, [])
            const myRecipe = _.get(recipes, name, {})
            return _.map(myModels, model => {
                const cookedProperties = _.mapValues(myRecipe, relationFunc => {
                    return relationFunc(model, state)
                })
                return {
                    ...model,
                    ...cookedProperties
                }
            })
        }
    )
})

export class ModelSelector {

    constructor(slice) {
        this.slice = slice
        this[Symbol.iterator] = function* () {
            yield* this.slice
        }
    }

    all() {
        return this.filter(_.constant(true))
    }

    filter(filter = _.constant(true)) {
        return new ModelSelector(_.filter(this.slice, filter))
    }

    filterBy(key, value) {
        return this.filter(_.matchesProperty(key, value))
    }

    first() {
        return _.head(this.slice)
    }

    shouldFetch(id) {
        return this.filterBy('id', id).first() ? true : false
    }

    sortBy(key) {
        return new ModelSelector(_.sortBy(this.slice, _.property(key)))
    }

    withGeo() {
        return this.filter(m => m.geo && !_.isEmpty(m.geo))
    }

    nearby(currentLocation, radius = 0) {
        const modelsWithDistance = _.map(this.withGeo().slice, m => ({
            ...m,
            distance: geolib.getDistance(m.geo, currentLocation)
        }))
        const sorted = _.sortBy(modelsWithDistance, [m => m.distance])
        if (radius > 0) {
            return new ModelSelector(_.filter(sorted, m => m.distance <= radius))
        } else {
            return new ModelSelector(sorted)
        }
    }
}

export default class Model {
    constructor(name, options = {}) {
        this.name = name
        this.options = options
    }

    select(state) {
        return new ModelSelector(modelCooker(this.name)(state))
    }

    bindActionCreators(dispatch) {
        const funcNames = ['saving', 'saved', 'save', 'fetchOne', 'fetchIfNeeded', 'refresh', 'fetchAll', 'update', 'updateAndSave', 'request', 'receive']
        const funcPairs = _.map(funcNames, name => [name, _.bind(_.get(this, name), this)])
        const bindable = _.fromPairs(funcPairs)
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
            const selector = new Model(this.name).select(getState())
            const model = selector.filterBy('id', id).first()
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
            
            console.group('PUT %s %s', this.name, id)
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
            if (this.select(getState()).shouldFetch(id)) {
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

    refresh() {
        return (dispatch, getState) => {
            if (this.select(getState()).all().slice.length == 0) {
                return dispatch(this.fetchAll())
            }
        }
    }

    fetchAll(params = {}) {
        return dispatch => {
            dispatch(this.request())
            const url = _.get(this.options, 'url', '/api/'+this.name+'/')
            const urlParams = new URLSearchParams(Object.entries(params))
            const preprocessor = _.get(preprocessors, this.name, _.identity)
            const sideloader = _.get(sideloaders, this.name, _.identity)
            console.group('GET %s page=%s', this.name, _.get(params, 'page', 1))
            console.log(params)
            console.groupEnd()
            return queuedFetch(url+'?'+urlParams, {credentials: 'include'})
                .then(response => response.json())
                .then(json => {
                    const processedResults = _.map(json.results, r => {
                        sideloader(r, dispatch)
                        return preprocessor(r)
                    })
                    if (json.next) {
                        const nextPage = (params.page || 1) + 1
                        const ret = dispatch(this.fetchAll({...params, page: nextPage}, this.options))
                        dispatch(this.receive(processedResults))
                        return ret
                    } else {
                        return dispatch(this.receive(processedResults))
                    }
                })
        }
    }

    update(id, dataOrCallback) {
        return (dispatch, getState) => {
            if (typeof dataOrCallback == 'function') {
                const foundItem = this.select(getState()).filterBy('id', id).first()
                return dispatch(this.update(id, dataOrCallback(foundItem)))
            } else {
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

    updateAndSave(id, dataOrCallback) {
        return dispatch => {
            dispatch(this.update(id, dataOrCallback))
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
