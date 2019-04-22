import organizerApp from '../reducers'

import { compose, createStore, applyMiddleware } from 'redux'
import { getCurrentUser } from '../selectors/auth'
import thunkMiddleware from 'redux-thunk'
import createRavenMiddleware from 'raven-for-redux'
import Raven from 'raven-js'
import { connectRouter, routerMiddleware } from 'connected-react-router/immutable'

const composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const store = createStore(
    connectRouter(history)(organizerApp),
    composer(applyMiddleware(createRavenMiddleware(Raven, {getUserContext: getCurrentUser} ), thunkMiddleware, routerMiddleware(history)))
)
export default store
