import React from 'react'
import { mount } from 'enzyme'
import { Form } from 'informed'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

import MaterialFormText from './MaterialFormText'

it('should render defaults safely', () => {
    const onValueChange = jest.fn()
    const onChange = jest.fn()
    const root = mount(
      <Form onChange={onChange} onValueChange={onValueChange} >
        <MaterialFormText field="select" />
      </Form>
    )
    root.find(TextField).prop('onChange')({target: {value: "Text"}})
    expect(onValueChange).toHaveBeenCalledWith({select: "Text"})
    root.find(TextField).prop('onBlur')()
    expect(onChange.mock.calls[0][0]).toMatchObject({touched: {select: true}})
})

