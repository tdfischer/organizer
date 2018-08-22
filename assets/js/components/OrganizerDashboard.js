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

faLibrary.add(faCalendar)

import EventCard from './EventCard'
import { getCurrentUser } from '../selectors/auth'
import MessageCard from './MessageCard'
import { getCurrentLocation } from '../selectors/geocache'
import { Geocache } from '../actions'
import { Model } from '../store'
import RawDataExpansionPanel from './RawDataExpansionPanel'

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
        const upcomingEvents = _.map(this.props.upcomingEvents, evt => (
            <Grid key={evt.id} item>
                <EventCard event_id={evt.id} onCheckIn={this.doCheckin} />
            </Grid>
        ))
        const pastEvents = _.map(this.props.pastEvents, evt => (
            <Grid key={evt.id} item>
                <EventCard event_id={evt.id} />
            </Grid>
        ))
        const eventDisplay = (upcomingEvents.length > 0) ? upcomingEvents : <NoEvents />
        const recentBroadcast = _.head(this.props.myBroadcasts)
        return (
            <Grid className={this.props.classes.root} container direction="column" alignItems="stretch" spacing={8}>
                <Grid item>
                    <Grid container direction="column" alignItems="stretch" spacing={8}>
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
                                {pastEvents.length ? pastEvents : <NoEvents />}
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

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    const eventWindow = {
        start: moment().add(-1, 'month'),
        end: moment().add(1, 'month')
    }
    const currentLocation = getCurrentLocation(state)
    const relevantEvents = Events.select(state).filter(evt => moment(evt.timestamp).isBetween(eventWindow.start, eventWindow.end))
    const pastEvents = relevantEvents.filter(evt => _.find(evt.attendees, currentUser.email) && moment(evt.timestamp).isBefore())
    const upcomingEvents = relevantEvents.filter(evt => moment(evt.timestamp).isSameOrAfter(moment().add(-1, 'day'))).nearby(currentLocation)
    return {
        currentUser,
        currentPerson,
        myBroadcasts: Broadcasts.select(state)
            .filterBy('turf', _.get(currentPerson, 'current_turf.id'))
            .map(f => ({...f, sent_on: moment(f.sent_on)}))
            .sortBy('-sent_on').slice,
        pastEvents: pastEvents.slice,
        upcomingEvents: upcomingEvents.slice,
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
