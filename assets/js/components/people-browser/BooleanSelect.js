import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'

import MaterialFormSelect from '../MaterialFormSelect'

export const BooleanSelect = props => {
    return (
        <MaterialFormSelect {...props}>
            <MenuItem value='contains'>Contains</MenuItem>
            <MenuItem value='is'>Is exactly</MenuItem>
        </MaterialFormSelect>
    )
}

export default BooleanSelect
