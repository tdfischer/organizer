import React from 'react'
import { shallow } from 'enzyme'

import { Search } from './Search'
import { BooleanFilter } from './BooleanFilter'
import { BooleanSelect } from './BooleanSelect'

describe('Search', () => {
    it('should render defaults safely', () => {
        shallow(<Search />)
    })
})

describe('BooleanFilter', () => {
    it('should render defaults safely', () => {
        shallow(<BooleanFilter />)
    })
})

describe('BooleanSelect', () => {
    it('should render defaults safely', () => {
        shallow(<BooleanSelect />)
    })
})
