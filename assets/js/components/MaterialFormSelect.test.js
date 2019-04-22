import React from 'react'
import { mount } from 'enzyme'
import { Form } from 'informed'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import MaterialFormSelect from './MaterialFormSelect'

it('should render defaults safely', () => {
    const onValueChange = jest.fn()
    const onChange = jest.fn()
    const root = mount(
      <Form onChange={onChange} onValueChange={onValueChange} >
        <MaterialFormSelect field="select">
          <MenuItem value={1}>Item Number 1</MenuItem>
        </MaterialFormSelect>
      </Form>
    )
    root.find(Select).prop('onChange')({target: 1})
    expect(onValueChange).toHaveBeenCalled()
    root.find(Select).prop('onBlur')()
    expect(onChange.mock.calls[0][0]).toMatchObject({touched: {select: true}})
})
