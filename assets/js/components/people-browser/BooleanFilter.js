import React from 'react'
import Grid from '@material-ui/core/Grid'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import { Scope, withFormApi, withFieldState } from 'informed'
import faMinusSquare from '@fortawesome/fontawesome-free-solid/faMinusSquare'
import { library as faLibrary } from '@fortawesome/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

faLibrary.add(faMinusSquare)

import MaterialFormSelect from '../MaterialFormSelect'
import MaterialFormStateSelect from '../MaterialFormStateSelect'
import MaterialFormTurfSelect from '../MaterialFormTurfSelect'
import MaterialFormText from '../MaterialFormText'
import BooleanSelect from './BooleanSelect'

const WidgetForField = withFieldState('property')(props => {
    switch(props.fieldState.value) {
    case 'state':
        return (
            <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <MaterialFormStateSelect field="value" />
            </FormControl>
        )
    case 'current_turf.id':
        return (
            <FormControl fullWidth>
                <InputLabel>Turf</InputLabel>
                <MaterialFormTurfSelect field="value" />
            </FormControl>
        )
    default:
        return <MaterialFormText fullWidth label="Value" field="value" />
    }
})

const OperatorWidgetForField = withFieldState('property')(props => {
    switch(props.fieldState.value) {
    case 'current_turf.id':
    case 'state':
        return (
            <FormControl fullWidth>
                <InputLabel>Comparison</InputLabel>
                <MaterialFormSelect initialValue="is" field="op">
                    <MenuItem value='is'>Is</MenuItem>
                </MaterialFormSelect>
            </FormControl>
        )
    default:
        return (
            <FormControl fullWidth>
                <InputLabel>Comparison</InputLabel>
                <BooleanSelect initialValue="contains" field="op"/>
            </FormControl>
        )
    }
})

const RemoveButton = withFormApi(props => (
    <IconButton
        color="secondary"
        onClick={() => {
            const curFilter = props.formApi.getState().values.filter || []
            props.formApi.setValues({filter: curFilter.filter((_v, k) => k != props.index)})
        }}>
        <FontAwesomeIcon icon={['fa', 'minus-square']} />
    </IconButton>
))

const BooleanFilter = props => {
    return (
        <Scope scope={props.field}>
            <Grid container spacing={8}>
                <Grid item xs={2}><RemoveButton index={props.index} /></Grid>
                <Grid item xs={3}>
                    <FormControl fullWidth>
                        <InputLabel>What</InputLabel>
                        <MaterialFormSelect initialValue="name" field="property">
                            <MenuItem value="name">Name</MenuItem>
                            <MenuItem value="email">E-Mail</MenuItem>
                            <MenuItem value="address.locality">City</MenuItem>
                            <MenuItem value="tags">A tag</MenuItem>
                            <MenuItem value="state">State</MenuItem>
                            <MenuItem value="current_turf.id">Turf</MenuItem>
                        </MaterialFormSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={3}>
                    <OperatorWidgetForField />
                </Grid>
                <Grid item xs={4}>
                    <WidgetForField />
                </Grid>
            </Grid>
        </Scope>
    )
}

export default BooleanFilter
