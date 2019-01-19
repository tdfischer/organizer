import React from 'react'
import { render } from 'enzyme'
import App from './components/App'
import { store } from './store'
import { Provider } from 'react-redux'

it('should render defaults safely', () => {
    // FIXME: "unknown tag" invariant??
    render(<Provider store={store}><App /></Provider>)
})

it('should import index.js and boot up to an App', () => {
    jest.mock('raven-js')
    jest.mock('@material-ui/styles')
    require('@material-ui/styles').install = jest.fn()
    document.body.innerHTML = `<div id="container"></div>`

    require('./index')
    expect(require('@material-ui/styles').install).toHaveBeenCalled()
})
