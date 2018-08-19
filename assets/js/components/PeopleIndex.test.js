import React from 'react'
import { shallow } from 'enzyme'
import { PeopleIndex } from './PeopleIndex'

it('should render default state', () => {
    const mockModel = {
        fetchAll: jest.fn()
    }
    shallow(<PeopleIndex allStates={[]} selection={{slice:[]}} states={mockModel} people={mockModel} />)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(2)
})
