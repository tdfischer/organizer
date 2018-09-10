import React from 'react'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import ColorHash from 'color-hash'

import { Model, withModelData } from '../store'
import MaterialFormSelect from './MaterialFormSelect'

const turfHasher = new ColorHash()
const Turfs = new Model('turfs')

const mapStateToProps = state => {
    const turfs = Turfs.immutableSelect(state)
    return {
        turfs
    }
}

const MaterialFormTurfSelect = props => (
    <MaterialFormSelect {...props}>
        {props.turfs.map(turf => (<MenuItem key={turf.id} style={{backgroundColor: turfHasher.hex(turf.name)}} value={turf.id}>{turf.name}</MenuItem>)).toArray()}
    </MaterialFormSelect>
)

const mapModelToFetch = _props => {
    return {
        turfs: {}
    }
}

export default withModelData(mapModelToFetch)(connect(mapStateToProps)(MaterialFormTurfSelect))
