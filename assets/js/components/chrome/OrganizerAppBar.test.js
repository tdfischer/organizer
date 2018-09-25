import React from 'react'
import Raven from 'raven-js'
import { shallow } from 'enzyme'
import MenuItem from '@material-ui/core/MenuItem'

import { AppMenu } from './OrganizerAppBar'

jest.mock('raven-js')

it('should trigger a report dialog when the user clicks the report button', () => {
    const wrapper = shallow(<AppMenu onClose={jest.fn()} onLogout={jest.fn()} />)
    const menuItems = wrapper.find(MenuItem)
    menuItems.last().dive().simulate('click')
    expect(Raven.captureMessage).toHaveBeenCalledWith("Manual report")
    expect(Raven.showReportDialog).toHaveBeenCalled()
})

it('should log the user out when the user clicks the logout button', () => {
    const loggerOuter = jest.fn()
    const wrapper = shallow(<AppMenu onClose={jest.fn()} onLogout={loggerOuter} />)
    const menuItems = wrapper.find(MenuItem)
    menuItems.first().dive().simulate('click')
    expect(loggerOuter).toHaveBeenCalled()
})
