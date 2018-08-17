import React from 'react'
import { shallow } from 'enzyme'
import { OrganizerDashboard } from './OrganizerDashboard'

it('should render default state', () => {
    const mockModel = {
        fetchIfNeeded: jest.fn(),
        fetchAll: jest.fn()
    }

    shallow(<OrganizerDashboard classes={{}} people={mockModel} broadcasts={mockModel} events={mockModel} currentUser={{}} />)
    expect(mockModel.fetchIfNeeded).toHaveBeenCalledTimes(1)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(3)
})
