import React from 'react'
import { connect } from 'react-redux'
import { Model } from '../store'
import _ from 'lodash'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Grid from '@material-ui/core/Grid'
import Slide from '@material-ui/core/Slide'
import moment from 'moment'

import { getCurrentUser } from '../selectors/auth'
import MessageCard from './MessageCard'

const People = new Model('people')
const Broadcasts = new Model('broadcasts')

export class OrganizerDashboard extends React.Component {
    componentDidMount() {
        this.props.people.fetchIfNeeded(this.props.currentUser.email)
        this.props.broadcasts.fetchAll()
    }

    render() {
        const metadata = JSON.stringify(this.props.currentPerson, null, 2)
        const name = _.get(this.props.currentPerson, 'name', '')
        const turf = _.get(this.props.currentPerson, 'current_turf_membership.name')
        return (
            <Grid container direction="column" alignItems="stretch" spacing={8}>
                <Grid item>
                    <Typography variant="title">{name}</Typography>
                    <Typography variant="subheading">{this.props.currentUser.email}</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="title">Recent broadcasts in {turf}</Typography>
                    <Grid container direction="column" alignItems="stretch">
                        {_.map(this.props.myBroadcasts, m => (
                            <Slide key={m.id} in={true} direction="down">
                                <MessageCard message={m} />
                            </Slide>
                        ))}
                    </Grid>
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
        currentPerson,
        myBroadcasts: Broadcasts.select(state)
            .filterBy('turf', _.get(currentPerson, 'current_turf_membership.turf'))
            .map(f => ({...f, sent_on: moment(f.sent_on)}))
            .sortBy('-sent_on').slice
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        broadcasts: Broadcasts.bindActionCreators(dispatch)
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(OrganizerDashboard)
