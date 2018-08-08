import React from 'react'
import { shallow } from 'enzyme'
import { PeopleIndex } from './PeopleIndex'

it('should render default state', () => {
    const mockModel = {
        refresh: jest.fn()
    }
    shallow(<PeopleIndex people={mockModel} />)
    expect(mockModel.refresh).toHaveBeenCalledTimes(1)
})
