import React from 'react'
import TextField from '@material-ui/core/TextField'
import { asField } from 'informed'

const MaterialFormText = asField(({ fieldState, fieldApi, ...props }) => {
    const {
        value
    } = fieldState
    const {
        setValue,
        setTouched
    } = fieldApi
    const {
        onChange,
        onBlur,
        forwardedRef,
        ...rest
    } = props
    return (
        <TextField
            {...rest}
            ref={forwardedRef}
            value={!value && value !== 0 ? '' : value}
            onChange={e => {
                setValue(e.target.value)
                if (onChange) {
                    onChange(e)
                }
            }}
            onBlur={e => {
                setTouched()
                if (onBlur) {
                    onBlur(e)
                }
            }}
        />
    )
})

export default MaterialFormText
