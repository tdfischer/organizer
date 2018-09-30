import React from 'react'
import { asField } from 'informed'
import Switch from '@material-ui/core/Switch'

const MaterialFormSwitch = asField(({fieldState, fieldApi, ...props}) => {
    const {
        value
    } = fieldState
    const {
        setValue,
    } = fieldApi
    const {
        onChange,
        forwardedRef,
        ...rest
    } = props
    return (
        <Switch
            {...rest}
            ref={forwardedRef}
            checked={!!value}
            onChange={e => {
                setValue(e.target.checked)
                if (onChange) {
                    onChange(e)
                }
            }}
        />
    )
})

export default MaterialFormSwitch
