import React from 'react'
import { AppRoutes } from './AppRoutes'
import CheckinActivity from './activities/checkin'
import { withProvider } from '../store'
import { mount } from 'enzyme'
import fetchMock from 'fetch-mock'

const MountableRoutes = withProvider(AppRoutes)

beforeEach(() => {
    fetchMock.restore()
})

it('should safely render a logged out state', () => {
    fetchMock.mock('begin:/api/events/', {})
    const wrapper = mount(<MountableRoutes logged_in={false} />)
    expect(wrapper.find(CheckinActivity)).toHaveLength(1)
})

it('should safely render a logged in state', () => {
    fetchMock.mock('begin:/api/events/', {})
    const wrapper = mount(<MountableRoutes logged_in={true} />)
    expect(wrapper.find(CheckinActivity)).toHaveLength(1)
})

