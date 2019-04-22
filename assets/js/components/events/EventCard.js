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
import { getCoords } from '@turf/invariant'
import { withStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import faHourglass from '@fortawesome/fontawesome-free-solid/faHourglass'
import faClock from '@fortawesome/fontawesome-free-solid/faClock'
import faCalendarCheck from '@fortawesome/fontawesome-free-solid/faCalendarCheck'
import faCalendarTimes from '@fortawesome/fontawesome-free-solid/faCalendarTimes'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'
import importedComponent from 'react-imported-component'
import UserAvatar from '../UserAvatar'

const MarkerMap = importedComponent(() => import('../mapping/MarkerMap'))

import { getEventsWithLocation } from '../../selectors/events'
import { withModelData } from '../../store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

faLibrary.add(faHourglass, faCalendarTimes, faCalendar, faCalendarCheck, faLocationArrow, faClock)

const CheckInPanel = props => {
    return (
        <Grid style={{textAlign: 'center'}} spacing={8} container alignItems="center" justify="flex-start" >
            <Grid item xs={12} md={4}><CheckInButton {...props} /></Grid>
            <Grid item xs><CheckInFlavor {...props} /></Grid>
        </Grid>
    )
}

const CheckInFlavor = props => {
    const attendeeCount = props.event.attendee_count - (props.event.checkIn.hasCheckedIn ? 1 : 0)

    if (props.event.checkIn.hasCheckedIn) {
        if (props.event.checkIn.hasNotStarted) {
            return (
                <p>You and {attendeeCount} others have RSVP&quot;d!</p>
            )
        } else {
            return (
                <p>You and {attendeeCount} others checked in.</p>
            )
        }
    } else if (props.event.checkIn.canCheckIn) {
        return (
            <p><em>{attendeeCount > 0 ? attendeeCount + ' other people checked in.' : 'Be the first to check in!'}</em></p>
        )
    } else if (props.event.checkIn.isInPast) {
        return (
            <p>This event already happened. {attendeeCount} people checked in without you.</p>
        )
    } else if (props.event.checkIn.hasNotStarted) {
        return (
            <p>This event hasn&apos;t started yet.</p>
        )
    } else {
        return (
            <p>{attendeeCount > 0 ? attendeeCount + ' people are checked in here.' : 'You are too far away to check in.'}</p>
        )
    }
}

export const CheckInButton = props => {
    const haveCheckedIn = props.event.checkIn.hasCheckedIn
    const doCheckIn = () => props.onCheckIn(props.event)
    var buttonContents = null

    if (haveCheckedIn) {
        buttonContents = (
            <Badge
                color="primary"
                badgeContent={<FontAwesomeIcon icon={['fa', 'calendar-check']} />}
                classes={{badge: props.classes.checkedInBadge}}>
                <UserAvatar className={props.classes.checkInAvatar} />
            </Badge>
        )
    } else if (props.event.checkIn.canCheckIn) {
        buttonContents = (
            <React.Fragment>
                <FontAwesomeIcon icon={['fa', 'calendar']} />
                Check in!
            </React.Fragment>
        )
    } else if (props.event.checkIn.isInPast) {
        buttonContents = (
            <React.Fragment>
                <Badge
                    color="error"
                    badgeContent={<FontAwesomeIcon icon={['fa', 'calendar-times']} />}>
                    <UserAvatar className={props.classes.checkInAvatar} />
                </Badge>
                I was here!
            </React.Fragment>
        )
    } else if (props.event.checkIn.hasNotStarted) {
        buttonContents = (
            <React.Fragment>
                <Badge
                    color="secondary"
                    badgeContent={<FontAwesomeIcon icon={['fa', 'hourglass']} />}>
                    <UserAvatar className={props.classes.checkInAvatar} />
                </Badge>
                RSVP
            </React.Fragment>
        )
    } else {
        const eventBearing = props.event.bearing - 45
        buttonContents = (
            <Avatar className={props.classes.eventLocator}>
                <FontAwesomeIcon icon={['fa', 'location-arrow']}  style={{transform: 'rotate('+eventBearing+'deg)'}}/>
            </Avatar>
        )
    }

    return (
        <Button
            variant="outlined"
            size="large"
            onClick={doCheckIn}
            className={props.classes.checkInButton} >
            {buttonContents}
        </Button>
    )
}

export const EventCard = props => {
    return (
        <Card className={props.classes.root + ' ' + props.className} >
            <CardContent style={{position: 'relative', zIndex: 1}}>
                <div className={props.classes.markerBackground}>
                    {props.event.geo ? <MarkerMap position={getCoords(props.event.geo)} center={getCoords(props.event.geo)} /> : null}
                </div>
                <div className={props.classes.markerBackgroundOverlay} />
                <Grid style={{flexWrap: 'nowrap'}} direction="row" spacing={8} alignItems="stretch" container>
                    <Grid xs item>
                        <Typography variant="h5">{props.event.name}</Typography>
                        <Typography variant="subtitle1">
                            <FontAwesomeIcon icon={['fa', 'clock']} />
                            &nbsp;{props.event.timestamp.format('h:mm A')} - {props.event.end_timestamp.format('h:mm A')}
                        </Typography>
                        <p>{props.event.locationDisplay}</p>
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <CheckInPanel {...props} />
            </CardActions>
        </Card>
    )
}

EventCard.propTypes = {
    event: PropTypes.object.isRequired,
}

EventCard.defaultProps = {
    classes: {},
    style: {},
    className: ''
}

const mapStateToProps = (state, props) => {
    const evt = getEventsWithLocation(state, {event_id: props.event_id}).get(props.event_id)
    return {
        event: evt,
    }
}

const buttonHasher = new ColorHash()
const hasher = new ColorHash({lightness: 0.8})
const pastHasher = new ColorHash({lightness: 0.8, saturation: 0.1})

const cardColor = event => (event.checkIn && event.checkIn.isInPast) ? pastHasher.hex(event.uid || '') : hasher.hex(event.uid || '')
const buttonColor = event => buttonHasher.hex(event.uid || '')
const textColor = event => fontColorContrast(cardColor(event))
const fade = event => '-webkit-linear-gradient(left, ' + cardColor(event) + ' 0%, ' + cardColor(event) + 'aa 70%, ' + cardColor(event) + '00 100%)'

const styles = {
    root: {
        background: props => cardColor(props.event || {checkIn:{}}),
        color: props => textColor(props.event || {checkIn:{}})
    },
    '@keyframes swirl-in-bck': {
        '0%': {
            transform: 'rotate(540deg) scale(5)',
            transformOrigin: '0% 100%',
            opacity: 0
        },
        '100%': {
            transform: 'rotate(0) scale(1)',
            transformOrigin: '0% 100%',
            opacity: 1
        }
    },
    markerBackgroundOverlay: {
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        position: 'absolute',
        zIndex: -1,
        background: props => fade(props.event || {})
    },
    markerBackground: {
        width: '175%',
        height: '100%',
        overflow: 'hidden',
        top: 0,
        left: 0,
        flex: 'auto',
        display: 'flex',
        position: 'absolute',
        zIndex: -1
    },
    checkInAvatar: {
        backgroundColor: '#3a5',
        minWidth: 0,
    },
    checkedInBadge: {
        animationName: '$swirl-in-bck',
        animationDuration: '0.65s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'both'
    },
    checkInButton: {
        minWidth: 0,
        backgroundColor: props => buttonColor(props.event || {})
    },
    eventLocator: {
        backgroundColor: '#33f',
        minWidth: 0
    }
}

const mapPropsToModels = props => {
    return {
        events: props.event_id,
    }
}

export default connect(mapStateToProps)(withModelData(mapPropsToModels)(withStyles(styles)(EventCard)))
