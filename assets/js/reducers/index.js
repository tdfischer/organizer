import { combineReducers } from 'redux'
import model from './model'
import geocache from './geocache'
import selections from './select'
import auth from './auth'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import filters from './filters'

const geocacheConfig = {
    key: 'geocache',
    storage: storage
}

const organizerApp = combineReducers({
    auth,
    model,
    selections,
    filters,
    geocache: persistReducer(geocacheConfig, geocache),
})

export default organizerApp
