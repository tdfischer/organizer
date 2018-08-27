import React from 'react'
import { CaptainIndex } from './CaptainIndex'
import { shallow } from 'enzyme'

it('should render defaults safely', () => {
    const component = shallow(<CaptainIndex currentUser={{}} classes={{}}/>)
})
