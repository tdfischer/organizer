import React from 'react'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import Badge from '@material-ui/core/Badge'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { connect } from 'react-redux'
import ColorHash from 'color-hash'
import fontColorContrast from 'font-color-contrast'
import { library as faLibrary } from '@fortawesome/fontawesome'
import distance from '@turf/distance'
import bearing from '@turf/bearing'
import { getCoords } from '@turf/invariant'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import faHourglass from '@fortawesome/fontawesome-free-solid/faHourglass'
import faClock from '@fortawesome/fontawesome-free-solid/faClock'
import faCalendarCheck from '@fortawesome/fontawesome-free-solid/faCalendarCheck'
import faCalendarTimes from '@fortawesome/fontawesome-free-solid/faCalendarTimes'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'
import importedComponent from 'react-imported-component'
import gravatar from 'gravatar'
import Breakpoint from '../../Breakpoint'

const MarkerMap = importedComponent(() => import('../mapping/MarkerMap'))

import { getCurrentLocation } from '../../selectors/geocache'
import { getCurrentUser } from '../../selectors/auth'
import { WALKTIME_BREAKPOINTS, getEventsWithLocation } from '../../selectors/events'
import { withModelData } from '../../store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

faLibrary.add(faHourglass, faCalendarTimes, faCalendar, faCalendarCheck, faLocationArrow, faClock)

const hasher = new ColorHash({lightness: 0.8})
const buttonHasher = new ColorHash()
const colorForEvent = evt => hasher.hex(evt.uid || '')

const SEGMENT = (360 / 8)
const OFFSET = SEGMENT / 2

const COMPASS_BREAKPOINTS = new Breakpoint([
    [-OFFSET, 'North'],
    [SEGMENT - OFFSET, 'Northeast'],
    [SEGMENT*2 - OFFSET, 'East'],
    [SEGMENT*3 - OFFSET, 'Southeast'],
    [SEGMENT*4 - OFFSET, 'South'],
    [SEGMENT*5 - OFFSET, 'Southwest'],
    [SEGMENT*6 - OFFSET, 'West'],
    [SEGMENT*7 - OFFSET, 'North West'],
    [undefined, 'North'],
])

const locationDisplay = (evt, currentLocation) => {
    if (currentLocation) {
        const distanceDisplay = Math.round(distance(currentLocation, evt.geo, {units: 'miles'})) + ' miles'
        const compassDisplay = COMPASS_BREAKPOINTS.getValue(bearing(currentLocation, evt.geo))
        const walktimeDisplay = WALKTIME_BREAKPOINTS.getValue(evt.walktime)
        const relativeDisplay = walktimeDisplay + ': ' + distanceDisplay + ' ' + compassDisplay
        if (evt.location) {
            return evt.location.raw + ' - ' + relativeDisplay
        } else {
            return relativeDisplay
        }
    } else {
        if (evt.location) {
            return evt.location.raw
        } else {
            return ''
        }
    }
}

export const CheckInButton = props => {
    const haveCheckedIn = props.checkedIn
    const attendeeCount = props.event.attendees.length - (haveCheckedIn ? 1 : 0)

    if (haveCheckedIn) {
        return (
            <React.Fragment>
                <Grid item xs={2} style={{textAlign: 'center'}}><Badge color="primary" badgeContent={<FontAwesomeIcon icon={['fa', 'calendar-check']} />}><Avatar src={gravatar.url(props.currentUser.email, {s:32, d: 'retro'})} className={props.classes.checkedInBadge} /></Badge></Grid>
                <Grid item xs><p>You and {attendeeCount} others checked in.</p></Grid>
            </React.Fragment>
        )
    } else if (props.event.checkIn.canCheckIn) {
        return (
            <React.Fragment>
                <Grid item xs={2} style={{textAlign: 'center'}}><Button style={{backgroundColor: buttonHasher.hex(props.event.uid)}} variant="outlined" size="large" className={props.classes.checkInButton} onClick={() => props.onCheckIn(props.event)}>
                    <FontAwesomeIcon icon={['fa', 'calendar']} />
                </Button></Grid>
                <Grid item xs><p><em>{attendeeCount > 0 ? attendeeCount + ' other people checked in.' : 'Be the first to check in!'}</em></p></Grid>
            </React.Fragment>
        )
    } else if (props.event.checkIn.isInPast) {
        return (
            <React.Fragment>
                <Grid item xs={2} style={{textAlign: 'center'}}><Badge color="error" badgeContent={<FontAwesomeIcon icon={['fa', 'calendar-times']} />}><Avatar src={gravatar.url(props.currentUser.email, {s:32, d: 'retro'})} className={props.classes.checkedInBadge} /></Badge></Grid>
                <Grid item xs><p>This event already happened. {attendeeCount} people checked in without you.</p></Grid>
            </React.Fragment>
        )
    } else if (props.event.checkIn.hasNotStarted) {
        return (
            <React.Fragment>
                <Grid item xs={2} style={{textAlign: 'center'}}><Badge color="secondary" badgeContent={<FontAwesomeIcon icon={['fa', 'hourglass']} />}><Avatar src={gravatar.url(props.currentUser.email, {s:32, d: 'retro'})} className={props.classes.checkedInBadge} /></Badge></Grid>
                <Grid item xs><p>This event hasn&apos;t started yet.</p></Grid>
            </React.Fragment>
        )
    } else {
        const eventBearing = props.currentLocation ? bearing(props.currentLocation, props.event.geo) - 45 : 0
        return (
            <React.Fragment>
                <Grid item xs={2} style={{textAlign: 'center'}}><Avatar className={props.classes.eventLocator}>
                    <FontAwesomeIcon icon={['fa', 'location-arrow']}  style={{transform: 'rotate('+eventBearing+'deg)'}}/>
                </Avatar></Grid>
                <Grid item xs><p>{attendeeCount > 0 ? attendeeCount + ' people are checked in here.' : 'You are too far away to check in.'}</p></Grid>
            </React.Fragment>
        )
    }
}

export const EventCard = props => {
    const cardColor = colorForEvent(props.event)
    const textColor = fontColorContrast(cardColor)

    const background = '-webkit-linear-gradient(left, ' + cardColor + ' 0%, ' + cardColor + 'aa 70%, ' + cardColor + '00 100%)'

    return (
        <Card className={props.className} style={{backgroundColor: cardColor, color: textColor, ...props.style}}>
            <CardContent style={{position: 'relative', zIndex: 1}}>
                <div style={{width: '175%', height: '100%', overflow: 'hidden', top: 0, left: 0, flex: 'auto', display: 'flex', position: 'absolute', zIndex: -1}}>
                    {props.event.geo ? <MarkerMap position={getCoords(props.event.geo)} center={getCoords(props.event.geo)} /> : null}
                </div>
                <div style={{width: '100%', height: '100%', top: 0, left: 0, position: 'absolute', zIndex: -1, background: background}} />
                <Grid style={{flexWrap: 'nowrap'}} direction="row" spacing={8} alignItems="stretch" container>
                    <Grid xs item>
                        <Typography variant="headline">{props.event.name}</Typography>
                        <Typography variant="subheading">
                            <FontAwesomeIcon icon={['fa', 'clock']} />
                            &nbsp;{props.event.timestamp.calendar()} - {props.event.end_timestamp.calendar()}
                        </Typography>
                        <p>{locationDisplay(props.event, props.currentLocation)}</p>
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <Grid spacing={8} container alignItems="center" justify="flex-start" ><CheckInButton {...props} /></Grid>
            </CardActions>
        </Card>
    )
}

EventCard.propTypes = {
    event: PropTypes.object.isRequired,
    currentLocation: PropTypes.object
}

EventCard.defaultProps = {
    classes: {},
    style: {}
}

const mapStateToProps = (state, props) => {
    const currentUser = getCurrentUser(state)
    const evt = getEventsWithLocation(state).get(props.event_id)
    const checkedIn = evt.attendees.indexOf(currentUser.email) != -1
    const currentLocation = getCurrentLocation(state)
    return {
        currentUser,
        event: evt,
        checkedIn,
        currentLocation
    }
}

const styles = {
    checkedInBadge: {
        backgroundColor: '#3a5',
        minWidth: 0
    },
    checkInButton: {
        backgroundColor: '#ddd',
        minWidth: 0
    },
    eventLocator: {
        backgroundColor: '#33f',
        minWidth: 0
    }
}

const mapPropsToModels = props => {
    return {
        events: props.event_id
    }
}

export default withStyles(styles)(connect(mapStateToProps)(withModelData(mapPropsToModels)(EventCard)))
