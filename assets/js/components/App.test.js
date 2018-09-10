import React from 'react'
import { App } from './App'
import { mount } from 'enzyme'

it('should safely render a default state', () => {
    const wrapper = mount(<App />)
    expect(wrapper.find('.the-app')).toHaveLength(1)
})
