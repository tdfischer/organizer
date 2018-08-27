import React from 'react'
import { MapIndex } from './MapIndex'
import { shallow } from 'enzyme'
import Immutable from 'immutable'

it('should render default state', () => {
    shallow(<MapIndex allPeople={Immutable.Map()} />)
})
