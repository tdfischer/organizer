import React from 'react'
import { App } from './App'
import { shallow } from 'enzyme'

it('should safely render a default state', () => {
    const wrapper = shallow(<App />)
    expect(wrapper.find('.the-app')).toHaveLength(0)
})

it('should safely render a logged in state', () => {
    const wrapper = shallow(<App logged_in={true} />)
    expect(wrapper.find('.the-app')).toHaveLength(1)
})
