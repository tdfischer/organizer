import React from 'react'
import { MapIndex } from './MapIndex'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

it('should render default state', () => {
    const mockModel = {
        fetchAll: jest.fn()
    }
    shallow(<MapIndex allPeople={Immutable.Map()} people={mockModel} events={mockModel} />)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(1)
})
