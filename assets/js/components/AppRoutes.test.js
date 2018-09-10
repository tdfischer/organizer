import React from 'react'
import { AppRoutes } from './AppRoutes'
import LoginSplash  from './LoginSplash'
import { withProvider } from '../store'
import { mount } from 'enzyme'

const MountableRoutes = withProvider(AppRoutes)

it('should safely render a logged out state', () => {
    const wrapper = mount(<MountableRoutes logged_in={false} />)
    expect(wrapper.find(LoginSplash)).toHaveLength(1)
})

it('should safely render a logged in state', () => {
    const wrapper = mount(<MountableRoutes logged_in={true} />)
    expect(wrapper.find(LoginSplash)).toHaveLength(0)
})

