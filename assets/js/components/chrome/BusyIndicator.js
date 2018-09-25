import React from 'react'
import { connect } from 'react-redux'
import CircularProgress from '@material-ui/core/CircularProgress'
import { getActivityCount } from '../../selectors'

const mapStateToProps = state => {
    return {
        queueSize: getActivityCount(state)
    }
}

export const BusyIndicator = props => (
    (props.queueSize > 0) ? <CircularProgress color="secondary" /> : null
)

export default connect(mapStateToProps)(BusyIndicator)
