import React from 'react'
import { Provider } from 'react-redux'
import { store } from './store'

export const withProvider = Component => {
    return function wrapped(props) {
        return (
            <Provider store={store}>
                <Component {...props} />
            </Provider>
        )
    }
}

export default withProvider
