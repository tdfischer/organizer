import React from 'react'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import _ from 'lodash'
import moment from 'moment'
import { withStyles } from '@material-ui/core/styles'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import { library as faLibrary } from '@fortawesome/fontawesome'
import distance from '@turf/distance'

faLibrary.add(faCalendar)

import { getCurrentUser } from '../selectors/auth'
import MessageCard from './MessageCard'
import { getCurrentLocation } from '../selectors/geocache'
import { Geocache } from '../actions'
import { Model } from '../store'
import RawDataExpansionPanel from './RawDataExpansionPanel'
import EventCard from './EventCard'

const Events = new Model('events')
const People = new Model('people')
const Broadcasts = new Model('broadcasts')

const noEventsStyles = {
    root: {
        backgroundColor: '#ddd',
        color: '#aaa',
        textAlign: 'center',
        padding: '3rem'
    },
    icon: {
        height: '4rem',
        width: 'auto'
    }
}

const NoEvents = withStyles(noEventsStyles)(props => (
    <div className={props.classes.root}>
        <FontAwesomeIcon icon={['fa', 'calendar']}  className={props.classes.icon} />
        <p>No events.</p>
        <p><em>Go make some trouble.</em></p>
    </div>
))

export class OrganizerDashboard extends React.Component {
    componentDidMount() {
        this.props.people.fetchIfNeeded(this.props.currentUser.email)
        this.props.broadcasts.fetchAll()
        const eventWindow = {
            start: moment().add(-1, 'month'),
            end: moment().add(1, 'month')
        }

        this.props.events.fetchAll({timestamp__gte: eventWindow.start.toISOString(), timestamp__lte: eventWindow.end.toISOString()})
        this.doCheckin = this.doCheckin.bind(this)
        navigator.geolocation.getCurrentPosition(this.props.updateCurrentLocationFromBrowserPosition)
    }

    doCheckin(evt) {
        this.props.events.updateAndSave(evt.id, {
            ...evt,
            attendees: [
                ...evt.attendees, 
                this.props.currentPerson.email
            ]
        })
    }

    render() {
        const upcomingEvents = this.props.upcomingEvents.map(evt => (
            <Grid key={evt.id} item>
                <EventCard event_id={evt.id} onCheckIn={this.doCheckin} />
            </Grid>
        ))
        const previousEvents = this.props.previousEvents.map(evt => (
            <Grid key={evt.id} item>
                <EventCard event_id={evt.id} />
            </Grid>
        ))
        const eventDisplay = (!upcomingEvents.isEmpty()) ? upcomingEvents.toArray() : <NoEvents />
        const recentBroadcast = _.head(this.props.myBroadcasts)
        return (
            <Grid className={this.props.classes.root} container direction="column" alignItems="stretch" spacing={8}>
                <Grid item>
                    <Grid container direction="column" justify="space-evenly" alignItems="stretch" spacing={8}>
                        {recentBroadcast ? <MessageCard message={recentBroadcast} /> : null}
                        <Grid item>
                            <Typography variant="title">Nearby and Upcoming Events</Typography>
                        </Grid>
                        {eventDisplay}
                    </Grid>
                </Grid>
                <Grid item>
                    <ExpansionPanel>
                        <ExpansionPanelSummary>
                            <Typography variant="title">Recent Events and Broadcasts</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid direction="column" alignItems="stretch" container spacing={8}>
                                {previousEvents}
                                {_.map(_.tail(this.props.myBroadcasts), m => (
                                    <MessageCard message={m} />
                                ))}
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

function isWithinWindow(start, end) {
    const eventWindow = {
        start: start,
        end: end
    }
    return evt => (
        evt.timestamp.isSameOrBefore(eventWindow.end) &&
        evt.end_timestamp.isSameOrAfter(eventWindow.start)
    )
}

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.immutableSelect(state).get(currentUser.email)
    const currentLocation = getCurrentLocation(state)
    const relevantEvents = Events.immutableSelect(state)
        .filter(evt => !!evt.geo)
        .map(evt => ({...evt, distance: distance(currentLocation ? currentLocation : evt.geo, evt.geo), end_timestamp: moment(evt.end_timestamp), timestamp: moment(evt.timestamp)}))
        .filter(isWithinWindow(moment().add(-1, 'month'), moment().add(1, 'month')))
        .sort((a, b) => a.distance > b.distance).cacheResult().toIndexedSeq()
    const upcomingEvents = relevantEvents
        .filter(isWithinWindow(moment().add(-1, 'hour'), moment().add(1, 'month')))
    const previousEvents = relevantEvents
        .filter(isWithinWindow(moment().add(-1, 'month'), moment().add(-1, 'hour')))
        .reverse()

    const myBroadcasts = Broadcasts.immutableSelect(state)
        .filter(_.matchesProperty('turf', _.get(currentPerson, 'current_turf.id')))
        .map(b => ({...b, sent_on: moment(b.sent_on)}))
        .sort((a, b) => a.sent_on > b.sent_on)
        .reverse()
    return {
        currentUser,
        currentPerson,
        myBroadcasts: myBroadcasts.toArray(),
        upcomingEvents,
        previousEvents
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
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

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(OrganizerDashboard))
