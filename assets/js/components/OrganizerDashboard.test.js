import React from 'react'
import { shallow } from 'enzyme'
import { OrganizerDashboard } from './OrganizerDashboard'
import Immutable from 'immutable'

it('should render default state', () => {
    const mockModel = {
        fetchIfNeeded: jest.fn(),
        fetchAll: jest.fn()
    }

    shallow(<OrganizerDashboard classes={{}} people={mockModel} broadcasts={mockModel} upcomingEvents={Immutable.Map()} previousEvents={Immutable.Map()} events={mockModel} currentUser={{}} />)
    expect(mockModel.fetchIfNeeded).toHaveBeenCalledTimes(1)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(2)
})
