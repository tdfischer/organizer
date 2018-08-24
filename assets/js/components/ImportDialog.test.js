import React from 'react'
import { shallow } from 'enzyme'
import ImportDialog from './ImportDialog'

it('should render defaults safely', () => {
    shallow(<ImportDialog />)
})

