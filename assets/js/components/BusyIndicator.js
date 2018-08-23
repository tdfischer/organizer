import React from 'react'
import { connect } from 'react-redux'
import CircularProgress from '@material-ui/core/CircularProgress'
import { getSaving, getLoading } from '../selectors'

const mapStateToProps = state => {
    return {
        queueSize: getSaving(state) + getLoading(state)
    }
}

const BusyIndicator = connect(mapStateToProps)(props => (
    (props.queueSize > 0) ? <CircularProgress color="secondary" /> : null
))

export default BusyIndicator
