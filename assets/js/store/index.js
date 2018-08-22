import React from 'react'
import { compose, createStore, applyMiddleware } from 'redux'
import organizerApp from '../reducers'
import thunkMiddleware from 'redux-thunk'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import createRavenMiddleware from 'raven-for-redux'
import Raven from 'raven-js'
import _model from './model'
import _selectable from './select'
import _filterable from './filter'

import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'
import { getCurrentUser } from '../selectors/auth'

export const Model = _model
export const Selectable = _selectable
export const Filterable = _filterable

const composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

const store = createStore(
    connectRouter(history)(organizerApp),
    composer(applyMiddleware(createRavenMiddleware(Raven, {getUserContext: getCurrentUser} ), thunkMiddleware, routerMiddleware(history)))
)

const persistor = persistStore(store)

export const PersistentApp = (props) => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>{props.children}</PersistGate>
    </Provider>
)

if (module.hot) {
    module.hot.accept('../reducers', () => {
        store.replaceReducer(require('../reducers').default)
    })
}
