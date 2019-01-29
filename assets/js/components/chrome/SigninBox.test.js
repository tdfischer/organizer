import React from 'react'
import { shallow, mount } from 'enzyme'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import { Form } from 'informed'

import { IntroText, SigninBox } from './SigninBox'

it('should reject a blank email', () => {
    const createSignup = jest.fn()
    const rendered = shallow(<SigninBox createSignup={createSignup} />)
    rendered.find(Button).first().simulate('click')
    expect(createSignup).toHaveBeenCalledTimes(0)
})

it('should accept an email', () => {
    const createSignup = jest.fn().mockResolvedValue()
    const setHasSaved = jest.fn()
    const rendered = shallow(<SigninBox setHasSaved={setHasSaved} createSignup={createSignup} />)
    rendered.find(Form).prop('onSubmit')({email: 'a@example.com'})
    expect(createSignup).toHaveBeenCalledTimes(1)
})

it('should render a spinner while it is saving', () => {
    const rendered = shallow(<SigninBox isSaving={true} />)
    expect(rendered.find(CircularProgress)).toHaveLength(1)
})

it('should render a thank you after it has saved', () => {
    const rendered = shallow(<SigninBox hasSaved={true} />)
    expect(rendered.find('Thanks')).toHaveLength(1)
})

describe('IntroText', () => {
    it('should match snapshots', () => {
        // Update these snapshots when the IntroText copy is changed.
        expect(mount(<IntroText />)).toMatchSnapshot()
        expect(mount(<IntroText event={{checkIn: {isInPast: true}}} />)).toMatchSnapshot()
        expect(mount(<IntroText event={{checkIn: {hasNotStarted: true}}} />)).toMatchSnapshot()
        expect(mount(<IntroText event={{checkIn: {isNearby: true}}} />)).toMatchSnapshot()
    })
})
