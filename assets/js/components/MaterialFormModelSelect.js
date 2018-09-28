import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import MenuItem from '@material-ui/core/MenuItem'
import PropTypes from 'prop-types'

import { Model, withModelData } from '../store'
import MaterialFormSelect from './MaterialFormSelect'

const mapStateToProps = (state, props) => {
    const model = new Model(props.model)
    return {
        rows: model.immutableSelect(state).sortBy(r => props.display ? props.display(r.name) : r.name)
    }
}

const MaterialFormModelSelect = props => (
    <MaterialFormSelect {..._.omit(props, 'display', 'value', 'dispatch', 'rows')}>
        {props.rows.map(row=> (<MenuItem key={row.id} value={props.value(row)}>{props.display(row)}</MenuItem>)).toArray()}
    </MaterialFormSelect>
)

MaterialFormModelSelect.defaultProps = {
    display: d => d.name,
    value: d => d.name
}

MaterialFormModelSelect.propTypes = {
    display: PropTypes.func.isRequired,
    value: PropTypes.func.isRequired
}

const mapModelToFetch = props => {
    return {
        [props.model]: {}
    }
}

export default withModelData(mapModelToFetch)(connect(mapStateToProps)(MaterialFormModelSelect))
