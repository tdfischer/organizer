import React from 'react'
import Raven from 'raven-js'
import { shallow } from 'enzyme'
import CircularProgress from '@material-ui/core/CircularProgress'

import { BusyIndicator } from './BusyIndicator'

it('should render nothing when there is nothing happening', () => {
    const wrapper = shallow(<BusyIndicator queueSize={0} />)
    expect(wrapper.find(CircularProgress)).toHaveLength(0)
})

it('should render something when there is nothing happening', () => {
    const wrapper = shallow(<BusyIndicator queueSize={1} />)
    expect(wrapper.find(CircularProgress)).toHaveLength(1)
})
