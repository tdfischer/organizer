import React from 'react'
import { shallow } from 'enzyme'
import { OrganizerDashboard } from './OrganizerDashboard'

it('should render default state', () => {
    const mockModel = {
        fetchIfNeeded: jest.fn(),
        fetchAll: jest.fn()
    }

    shallow(<OrganizerDashboard people={mockModel} broadcasts={mockModel} currentUser={{}} />)
    expect(mockModel.fetchIfNeeded).toHaveBeenCalledTimes(1)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(1)
})
