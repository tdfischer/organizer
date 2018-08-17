import React from 'react'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Typography from '@material-ui/core/Typography'
import PropTypes from 'prop-types'

const RawDataExpansionPanel = props => (
    <ExpansionPanel>
        <ExpansionPanelSummary>
            <Typography variant="title">{props.title || 'Raw Data'}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
            <pre>{JSON.stringify(props.data, null, 2)}</pre>
        </ExpansionPanelDetails>
    </ExpansionPanel>
)

RawDataExpansionPanel.propTypes = {
    title: PropTypes.string,
    data: PropTypes.any
}

export default RawDataExpansionPanel
