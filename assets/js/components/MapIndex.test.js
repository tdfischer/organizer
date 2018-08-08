import React from 'react'
import { MapIndex } from './MapIndex'
import { shallow } from 'enzyme'

it('should render default state', () => {
    const mockModel = {
        refresh: jest.fn()
    }
    shallow(<MapIndex people={mockModel} allPeople={{slice: []}}/>)
    expect(mockModel.refresh).toHaveBeenCalledTimes(1)
})
