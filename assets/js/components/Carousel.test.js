import React from 'react'
import { mount } from 'enzyme'
import Button from '@material-ui/core/Button'
import MobileStepper from '@material-ui/core/MobileStepper'
import Carousel from './Carousel'

it('should render defaults safely', () => {
    mount(<Carousel />)
})

it('should execute callbacks when buttons are clicked', () => {
    const setIndex = jest.fn()
    const rendered = mount(<Carousel index={1} setIndex={setIndex}><p /><p /><p /></Carousel>)
    const buttons = rendered.find(Button)
    expect(buttons).toHaveLength(2)
    buttons.first().simulate('click')
    buttons.last().simulate('click')
    expect(setIndex).toHaveBeenCalledTimes(2)
    expect(setIndex).toHaveBeenCalledWith(2)
    expect(setIndex).toHaveBeenCalledWith(0)
})
