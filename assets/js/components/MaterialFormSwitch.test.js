import React from 'react'
import { mount } from 'enzyme'
import { Form } from 'informed'
import Switch from '@material-ui/core/Switch'
import MenuItem from '@material-ui/core/MenuItem'

import MaterialFormSwitch from './MaterialFormSwitch'

it('should render defaults safely', () => {
    const onValueChange = jest.fn()
    const root = mount(
      <Form onValueChange={onValueChange} >
        <MaterialFormSwitch field="select" />
      </Form>
    )
    root.find(Switch).prop('onChange')({target: {checked: true}})
    expect(onValueChange).toHaveBeenCalledWith({select: true})
    root.find(Switch).prop('onChange')({target: {checked: false}})
    expect(onValueChange).toHaveBeenCalledWith({select: false})
})

