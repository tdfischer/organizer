import React from 'react'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import ColorHash from 'color-hash'

import { Model, withModelData } from '../store'
import MaterialFormSelect from './MaterialFormSelect'

const stateHasher = new ColorHash()
const States = new Model('states')

const mapStateToProps = state => {
    const states = States.immutableSelect(state)
    return {
        states
    }
}

const MaterialFormStateSelect = props => (
    <MaterialFormSelect {...props}>
        {props.states.map(state => (<MenuItem style={{backgroundColor: stateHasher.hex(state.name)}} key={state.id} value={state.name}>{state.name}</MenuItem>)).toArray()}
    </MaterialFormSelect>
)

const mapModelToFetch = _props => {
    return {
        states: {}
    }
}

export default withModelData(mapModelToFetch)(connect(mapStateToProps)(MaterialFormStateSelect))
