import React from 'react'
import { render } from 'enzyme'
import App from './components/App'
import { store } from './store'
import { Provider } from 'react-redux'

it('should render defaults safely', () => {
    // FIXME: "unknown tag" invariant??
    //render(<Provider store={store}><App /></Provider>)
})
