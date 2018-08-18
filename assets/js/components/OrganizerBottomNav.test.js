import React from 'react'
import { OrganizerBottomNav } from './OrganizerBottomNav'
import { mount, shallow } from 'enzyme'

import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'

it('should safely render default state', () => {
    shallow(<OrganizerBottomNav />)
})

it('should navigate react-router when clicked', () => {
    const clickHandler = jest.fn()
    const wrapper = mount(<OrganizerBottomNav push={clickHandler} />)
    wrapper.find('button').first().simulate('click')
    expect(clickHandler).toHaveBeenCalledTimes(1)
})

it('should correctly render staff buttons', () => {
    const wrapper = shallow(<OrganizerBottomNav />)
    const staffWrapper = shallow(<OrganizerBottomNav currentUser={{is_staff: true}} />)

    expect(wrapper.find(BottomNavigationAction).find({value: '/captain'})).toHaveLength(0)
    expect(wrapper.find(BottomNavigationAction).find({value: '/people'})).toHaveLength(0)

    expect(staffWrapper.find(BottomNavigationAction).find({value: '/captain'})).toHaveLength(1)
    expect(staffWrapper.find(BottomNavigationAction).find({value: '/people'})).toHaveLength(1)
})
