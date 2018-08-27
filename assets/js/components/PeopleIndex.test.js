import React from 'react'
import { shallow } from 'enzyme'
import { PeopleIndex } from './PeopleIndex'
import Immutable from 'immutable'

it('should render default state', () => {
    shallow(<PeopleIndex allStates={Immutable.List()} selection={{slice:[]}} />)
})
