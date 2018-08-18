import React from 'react'
import { MapIndex } from './MapIndex'
import { shallow } from 'enzyme'

it('should render default state', () => {
    const mockModel = {
        fetchAll: jest.fn()
    }
    shallow(<MapIndex people={mockModel} events={mockModel} />)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(3)
})
