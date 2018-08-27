import React from 'react'
import { shallow } from 'enzyme'
import { PeopleIndex } from './PeopleIndex'
import Immutable from 'immutable'

it('should render default state', () => {
    const mockModel = {
        fetchAll: jest.fn()
    }
    shallow(<PeopleIndex allStates={Immutable.List()} selection={{slice:[]}} states={mockModel} people={mockModel} />)
    expect(mockModel.fetchAll).toHaveBeenCalledTimes(2)
})
