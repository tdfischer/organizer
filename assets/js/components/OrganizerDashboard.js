import React from 'react'
import { connect } from 'react-redux'
import { Model } from '../store'
import _ from 'lodash'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Grid from '@material-ui/core/Grid'

import { getCurrentUser } from '../selectors/auth'

const People = new Model('people')

export class OrganizerDashboard extends React.Component {
    componentDidMount() {
        this.props.people.fetchIfNeeded(this.props.currentUser.email)
    }

    render() {
        const metadata = JSON.stringify(this.props.currentPerson, null, 2)
        const name = _.get(this.props.currentPerson, 'name', '')
        return (
            <Grid container direction="column" alignItems="stretch" spacing={8}>
                <Grid item>
                    <Typography variant="title">{name}</Typography>
                    <Typography variant="subheading">{this.props.currentUser.email}</Typography>
                </Grid>
                <Grid item>
                    <ExpansionPanel>
                        <ExpansionPanelSummary>
                            <Typography variant="title">Raw data</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <pre>{metadata}</pre>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                </Grid>
            </Grid>
        )
    }
}

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    return {
        currentUser,
        currentPerson
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch)
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(OrganizerDashboard)
