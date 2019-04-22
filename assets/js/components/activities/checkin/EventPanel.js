import React from 'react'
import { connect } from 'react-redux'
import { withState } from 'recompose'
import { withStyles } from '@material-ui/styles'
import Dialog from '@material-ui/core/Dialog'
import importedComponent from 'react-imported-component'
import moment from 'moment'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Typography from '@material-ui/core/Typography'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'

const LoadingDisplay = _props => (
    <React.Fragment>
        <DialogTitle>
            Checking you in...
        </DialogTitle>
        <DialogContent>
            <LoadingSpinner />
        </DialogContent>
    </React.Fragment>
)

import LoadingSpinner from '../../chrome/LoadingSpinner'

import { getEventsWithLocation } from '../../../selectors/events'
import { getCurrentUser, getLoggedIn } from '../../../selectors/auth'
import { withCurrentLocation } from '../../../actions/geocache'
import NoEvents from '../../events/NoEvents'
import { withModelData, Model } from '../../../store'
import Grid from '@material-ui/core/Grid'
import EventCard from '../../events/EventCard.js'
import Skeleton from './Skeleton'

const Signups = new Model('signups')

const SignupForm = importedComponent(() => import('./SignupForm'), {
    LoadingComponent: () => <LoadingDisplay />
})

const listStyles = {
    container: {
    },
    card: {
        margin: '1rem',
    }
}

const grouper = evt => evt.timestamp.format('D MMM, ddd')
const mapGroupContents = (events, onCheckIn, className) => events.map(evt => (
    <Grid key={evt.id} item>
        <EventCard className={className} onCheckIn={onCheckIn} event_id={evt.id} />
    </Grid>
))
const mapEntries = (onCheckIn, className) => ([groupKey, contents], idx, fullSet) => {
    const positionals = {
        previous: idx > 0 ? idx - 1 : undefined,
        next: idx < fullSet.size ? idx + 1 : undefined,
        index: idx
    }
    return [
        <GroupHeader {...positionals} size={contents.size} key={groupKey} timestamp={contents.first().timestamp} />,
        ...mapGroupContents(contents, onCheckIn, className)
    ]
}

const headerStyles = {
    container: {
        borderTop: '1px solid #ddd',
        marginTop: '1rem',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: '#eee',
        padding: '1rem'
    },
    day: {
        backgroundColor: props => props.timestamp.isBefore(moment(), 'day') ? '#aaa' : (props.timestamp.isSame(moment(), 'day') ? '#33a' : '#a33'),
        margin: 'auto'
    },
    dayText: {
        marginRight: '1rem'
    }
}

const GroupHeader = withStyles(headerStyles)(props => (
    <Grid className={props.classes.container} item container alignItems="center" id={props.index}>
        <Grid item xs={2}>
            <Avatar className={props.classes.day} >{props.timestamp.format('D')}</Avatar>
        </Grid>
        <Grid item xs>
            <Typography className={props.classes.dayText} variant="caption">{props.timestamp.format('MMM, ddd')}</Typography>
            <Typography variant="caption">{props.size} event{props.size == 1 ? null : 's'} {props.timestamp.calendar(null, {sameDay: '[today]', nextDay: '[tomorrow]', lastDay: '[yesterday]', lastWeek: '[last] dddd', nextWeek: '[this] dddd' })}</Typography>
        </Grid>
        <Grid item xs={2}>{props.previous != undefined ? <a href={'#'+props.previous}><Button size="small" variant="outlined">&laquo;</Button></a> : null}</Grid>
        <Grid item xs={2}>{props.next != undefined ? <a href={'#'+props.next}><Button size="small" variant="outlined">&raquo;</Button></a> : null}</Grid>
    </Grid>
))

const EventList = withStyles(listStyles)(props => (
    <div className={props.classes.container}>
        <Grid direction="column" container>
            {props.events
                .groupBy(grouper)
                .entrySeq()
                .flatMap(mapEntries(props.onCheckIn, props.classes.card))}
        </Grid>
    </div>
))

export const EventPanel = props => {
    const eventID = props.eventID
    const doCheckIn = (eventID) => {
        props.setIndex(eventID)
        if (props.loggedIn) {
            props.createSignup({email: props.currentUser.email}, eventID)
        } else {
            props.setOpen(true)
        }
    }
    return (
        props.hasFetched ? (
            <React.Fragment>
                <NoEvents show={props.nearbyEvents.count() > 0}>
                    <EventList
                        events={props.nearbyEvents}
                        onCheckIn={doCheckIn} />
                </NoEvents>
                <Dialog open={props.isOpen} onClose={() => props.setOpen(false)}>
                    <SignupForm createSignup={props.createSignup} event_id={eventID} />
                </Dialog>
            </React.Fragment>
        ) : (
            <Skeleton />
        )
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        createSignup: (values, eventID) => {
            return dispatch(Signups.create({
                ...values,
                event: eventID
            }))
        }
    }
}

const mapStateToProps = state => {
    const nearbyEvents = getEventsWithLocation(state)
        .slice(0, 10)
        .toIndexedSeq()
    const currentUser = getCurrentUser(state)
    const loggedIn = getLoggedIn(state)
    return {
        nearbyEvents,
        currentUser,
        loggedIn
    }
}

const mapPropsToModels = _props => {
    //FIXME: Fine tune query to only search by timestamp and geolocation
    const start = moment().add(-3, 'days')
    const end = moment().add(1, 'month')
    return {
        events: {
            end_timestamp__gte: start.toISOString(),
            timestamp__lte: end.toISOString()
        }
    }
}

export default withCurrentLocation(withModelData(mapPropsToModels)(withState('isOpen', 'setOpen', false)(withState('index', 'setIndex', -1)(connect(mapStateToProps, mapDispatchToProps)(EventPanel)))))
