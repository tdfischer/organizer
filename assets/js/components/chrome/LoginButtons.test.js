import React from 'react'
import LoginButtons from './LoginButtons'
import { shallow } from 'enzyme'
import Button from '@material-ui/core/Button'
import fc from 'fast-check'

it('should render an empty login splash', () => {
    const wrapper = shallow(<LoginButtons />)
    expect(wrapper.find(Button)).toHaveLength(0)
})

it('should render a list of login URLs', () => {
    fc.assert(fc.property(fc.array(fc.tuple(fc.string(), fc.string())), urls => {
        global.LOGIN_URLS = urls
        global.ORG_METADATA = {name: 'Name', shortname: 'Shortname'}
        const wrapper = shallow(<LoginButtons />)
        expect(wrapper.find(Button)).toHaveLength(urls.length)
    }))
})
