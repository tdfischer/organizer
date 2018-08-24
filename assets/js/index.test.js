import React from 'react'
import { render } from 'enzyme'
import App from './components/App'
import { PersistentApp } from './store'

it('should render defaults safely', () => {
    render(<PersistentApp><App /></PersistentApp>)
})
