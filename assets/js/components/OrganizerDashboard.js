import React from 'react'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'

import MessageCard from './MessageCard'
import { getCurrentUser } from '../selectors/auth'
import { Geocache } from '../actions'
import { Model, withModelData } from '../store'
import RawDataExpansionPanel from './RawDataExpansionPanel'
import EventList from './events/EventList'

const People = new Model('people')
const Events = new Model('events')
const Broadcasts = new Model('broadcasts')

export class OrganizerDashboard extends React.Component {
    componentDidMount() {
        this.doCheckin = this.doCheckin.bind(this)
        navigator.geolocation.getCurrentPosition(this.props.updateCurrentLocationFromBrowserPosition)
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
                        <EventList start={moment()} end={moment().add(1, 'month')} onCheckin={this.onCheckin} />
                    </Grid>
                </Grid>
                <Grid item>
                    <ExpansionPanel>
                        <ExpansionPanelSummary>
                            <Typography variant="title">Recent Events and Broadcasts</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid direction="column" alignItems="stretch" container spacing={8}>
                                <EventList start={moment().add(-1, 'month')} end={moment()} onCheckin={this.onCheckin} />
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
        myBroadcasts
    }
}

const mapDispatchToProps = dispatch => {
    return {
        broadcasts: Broadcasts.bindActionCreators(dispatch),
        events: Events.bindActionCreators(dispatch),
        ...bindActionCreators({
            updateCurrentLocationFromBrowserPosition: Geocache.updateCurrentLocationFromBrowserPosition
        }, dispatch)
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

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(OrganizerDashboard)))
