import React from 'react'
import { LoginSplash } from './LoginSplash'
import { shallow } from 'enzyme'
import Button from '@material-ui/core/Button'
import fc from 'fast-check'

it('should render an empty login splash', () => {
    const wrapper = shallow(<LoginSplash />)
    expect(wrapper.find(Button)).toHaveLength(0)
})

it('should render a list of login URLs', () => {
    fc.assert(fc.property(fc.array(fc.tuple(fc.string(), fc.string())), urls => {
        global.LOGIN_URLS = urls
        const wrapper = shallow(<LoginSplash />)
        expect(wrapper.find(Button)).toHaveLength(urls.length)
    }))
})
