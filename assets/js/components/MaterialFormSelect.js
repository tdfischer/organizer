import React from 'react'
import Select from '@material-ui/core/Select'
import { asField } from 'informed'

const MaterialFormSelect = asField(({ fieldState, fieldApi, ...props }) => {
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
        <Select
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

export default MaterialFormSelect
