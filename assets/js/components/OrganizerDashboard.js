import React from 'react'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'

import MessageCard from './MessageCard'
import { getCurrentUser } from '../selectors/auth'
import { Model, withModelData } from '../store'
import { getLocationStatus } from '../selectors/geocache'
import { STATUS_DENIED, STATUS_UNAVAILABLE, STATUS_TIMEOUT, withCurrentLocation } from '../actions/geocache'
import RawDataExpansionPanel from './RawDataExpansionPanel'
import EventList from './events/EventList'
import NoLocation from './events/NoLocation'

const People = new Model('people')
const Events = new Model('events')
const Broadcasts = new Model('broadcasts')

const mapErrStateToProps = state => {
    return {status: getLocationStatus(state)}
}

const LocationError = connect(mapErrStateToProps)(props => {
    switch (props.status) {
    case STATUS_DENIED:
        return <NoLocation message="You must enable location access to continue" />
    case STATUS_UNAVAILABLE:
    case STATUS_TIMEOUT:
        return <NoLocation message="Location unavailable." />
    case undefined:
        return <NoLocation onStartGeolocation={props.onStartGeolocation} message="You must enable location" />
    default:
        return null
    }
})

export class OrganizerDashboard extends React.Component {
    componentDidMount() {
        this.doCheckin = this.doCheckin.bind(this)
    }

    doCheckin(evt) {
        this.props.events.updateAndSave(evt.id, {
            ...evt,
            attendees: [
                ...evt.attendees, 
                this.props.currentUser.email
            ]
        })
    }

    render() {
        const recentBroadcast = this.props.myBroadcasts.first()
        return (
            <Grid className={this.props.classes.root} container direction="column" alignItems="stretch" spacing={8}>
                <Grid item>
                    <Grid container direction="column" justify="space-evenly" alignItems="stretch" spacing={8}>
                        {recentBroadcast ? <MessageCard message={recentBroadcast} /> : null}
                        {this.props.locationStatus == 0 ? <EventList start={moment()} end={moment().add(1, 'month')} onCheckIn={this.doCheckin} /> : <LocationError onStartGeolocation={this.props.startGeolocation}/>}
                    </Grid>
                </Grid>
                <Grid item>
                    <ExpansionPanel>
                        <ExpansionPanelSummary>
                            <Typography variant="title">Recent Events and Broadcasts</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid direction="column" alignItems="stretch" container spacing={8}>
                                <EventList start={moment().add(-1, 'month')} end={moment()} onCheckIn={this.doCheckin} />
                                {this.props.myBroadcasts.skip(1).map(m => (
                                    <MessageCard key={m} message={m} />
                                )).toArray()}
                            </Grid>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                </Grid>
                <Grid item>
                    <RawDataExpansionPanel title="Your raw data" data={this.props.currentPerson} />
                </Grid>
            </Grid>
        )
    }
}

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.immutableSelect(state).get(currentUser.email)

    const myBroadcasts = Broadcasts.immutableSelect(state)
        .filter(p => p.turf == currentPerson.current_turf.id)
        .map(b => ({...b, sent_on: moment(b.sent_on)}))
        .sort((a, b) => a.sent_on > b.sent_on)
        .reverse()

    return {
        currentUser,
        currentPerson,
        myBroadcasts,
        locationStatus: getLocationStatus(state)
    }
}

const mapDispatchToProps = dispatch => {
    return {
        broadcasts: Broadcasts.bindActionCreators(dispatch),
        events: Events.bindActionCreators(dispatch),
    }
}

const styles = {
    root: {
        padding: '1rem',
        width: '100%',
        margin: 0
    },
}

const mapPropsToModels = props => {
    return {
        people: props.currentUser.email,
        broadcasts: {},
    }
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(withCurrentLocation(OrganizerDashboard))))
