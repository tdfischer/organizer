import React from 'react'
import { shallow } from 'enzyme'
import ImportDialog from './ImportDialog'
import fetchMock from 'fetch-mock'

it('should render defaults safely', () => {
    fetchMock.mock('/api/people/', {})
    shallow(<ImportDialog />)
})

