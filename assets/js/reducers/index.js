import { combineReducers } from 'redux-immutable'
import model from './model'
import geocache from './geocache'
import selections from './select'
import auth from './auth'
import filters from './filters'

const organizerApp = combineReducers({
    auth,
    model,
    selections,
    filters,
    geocache
})

export default organizerApp
