import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import moment from 'moment'
import distance from '@turf/distance'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import EventCard from './EventCard'
import NoEvents from './NoEvents'
import { getCurrentLocation } from '../../selectors/geocache'
import { Model, withModelData } from '../../store'
import Breakpoint from '../../Breakpoint'

const Events = new Model('events')

export const EventList = props => {
    const upcomingEvents = props.upcomingEvents.entrySeq().flatMap(([weekDelta, events]) => {
        const header = (
            <Card
                key={'week-'+weekDelta}
                className={props.classes.headerCard}>
                <h1 className={props.classes.timeHeader}>{DAY_BREAKPOINTS.getValue(weekDelta)}</h1>
            </Card>
        )
        return [header, ...events.entrySeq().flatMap(([walkTime, events]) => {
            const walkHeader = (
                <h2 key={'walk-'+walkTime+weekDelta}>{WALKTIME_BREAKPOINTS.getValue(walkTime)}</h2>
            )
            return [walkHeader, ...events.map(evt => (
                <EventCard className={props.classes.eventCard} key={evt.id} event_id={evt.id} onCheckIn={props.onCheckin} />
            ))]
        })]
    })

    return (!upcomingEvents.isEmpty()) ? <React.Fragment>{upcomingEvents.toArray()}</React.Fragment> : <NoEvents />
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

const DAY_BREAKPOINTS = new Breakpoint([
    [-60, 'Forever ago'],
    [-30, 'Earlier this year'],
    [-14, 'Earlier this month'],
    [-7, 'Last week'],
    [-1, 'Yesterday'],
    [0, 'Today'],
    [1, 'Tomorrow'],
    [7, 'This week'],
    [14, 'Next week'],
    [7 * 4, 'Later this month'],
    [7 * 6, 'Later this year'],
    [undefined, 'In the distant future']
])

const WALKTIME_BREAKPOINTS = new Breakpoint([
    [5, 'Nearby'],
    [15, 'By bike'],
    [35, 'By bus'],
    [undefined, 'Far away'],
])

const mapStateToProps = (state, props) => {
    const currentLocation = getCurrentLocation(state)

    const relevantEvents = Events.immutableSelect(state)
        .filter(evt => evt.geo != undefined)
        .map(evt => ({...evt, distance: distance(currentLocation ? currentLocation : evt.geo, evt.geo), end_timestamp: moment(evt.end_timestamp), timestamp: moment(evt.timestamp)}))
        .filter(isWithinWindow(props.start, props.end)).cacheResult().toIndexedSeq()
        .sort((a, b)=> a.timestamp.diff(b.timestamp)).cacheResult().toIndexedSeq()

    const now = moment()

    const upcomingEvents = relevantEvents
        .filter(isWithinWindow(props.start, props.end))
        .map(evt => ({...evt, walktime: (evt.distance * 1000) / 84}))
        .groupBy(evt => DAY_BREAKPOINTS.getPoint(evt.timestamp.diff(now, 'days'))).toKeyedSeq()
        .map(events => 
            events.groupBy(evt => WALKTIME_BREAKPOINTS.getPoint(evt.walktime))
                .sort((a, b) => a.distance - b.distance))
        .cacheResult()

    return {
        upcomingEvents,
    }
}

const styles = {
    headerCard: {
        marginLeft: '-1rem',
        marginRight: '-1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
    },
    timeHeader: {
        paddingLeft: '1rem'
    },
    eventCard: {
        marginBottom: '2rem'
    }
}

const mapPropsToModels = props => {
    return {
        events: {
            timestamp__gte: props.start.toISOString(),
            timestamp__lte: props.end.toISOString()
        }
    }
}

EventList.propTypes = {
    start: PropTypes.object.isRequired,
    end: PropTypes.object.isRequired
}

EventList.defaultProps = {
    start: moment(),
    end: moment(),
    classes: {},
}

export default withStyles(styles)(connect(mapStateToProps)(withModelData(mapPropsToModels)(EventList)))
