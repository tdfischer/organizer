import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import moment from 'moment'
import distance from '@turf/distance'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { getCoord } from '@turf/invariant'

import EventCard from './EventCard'
import NoEvents from './NoEvents'
import { getCurrentLocation } from '../selectors/geocache'
import { Model, withModelData } from '../store'

const Events = new Model('events')

export const EventList = props => {
    const upcomingEvents = props.upcomingEvents.entrySeq().flatMap(([weekDelta, events]) => {
        const header = (
            <Card
                key={'week-'+weekDelta}
                className={props.classes.headerCard}>
                <h1 className={props.classes.timeHeader}>{daysToDescription(weekDelta)}</h1>
            </Card>
        )
        return [header, ...events.entrySeq().flatMap(([walkTime, events]) => {
            const walkHeader = (
                <h2 key={'walk-'+walkTime+weekDelta}>{walktimeToDescription(walkTime)}</h2>
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

function compareScores(a, b) {
    const scoreA = a.distance * 1000
    const scoreB = b.distance * 1000
    if (scoreA == scoreB)
        return 0
    if (scoreA < scoreB)
        return -1
    return 1
}

const DAY_BREAKPOINTS = [
    [0, 'Today'],
    [1, 'Tomorrow'],
    [7, 'This week'],
    [14, 'Next week'],
    [7 * 4, 'Later this month'],
    [7 * 6, 'Later this year'],
    [undefined, 'In the distant future']
]

const WALKTIME_BREAKPOINTS = [
    [5, 'Nearby'],
    [15, 'By bike'],
    [35, 'By bus'],
    [undefined, 'Far away'],
]

function getDayBreakpoint(days) {
    return DAY_BREAKPOINTS.filter(breakpoint => days <= breakpoint[0] || breakpoint[0] == undefined)[0]
}

function groupByTime(evt) {
    const days = evt.timestamp.diff(moment(), 'days')
    return getDayBreakpoint(days)[0]
}

function daysToDescription(days) {
    return getDayBreakpoint(days)[1]
}

function getWalktimeBreakpoint(minutes) {
    return WALKTIME_BREAKPOINTS.filter(breakpoint => minutes <= breakpoint[0] || breakpoint[0] == undefined)[0]
}

function groupByWalktime(evt) {
    return getWalktimeBreakpoint(evt.distance / 87)[0]
}

function walktimeToDescription(minutes) {
    return getWalktimeBreakpoint(minutes)[1]
}

const mapStateToProps = (state, props) => {
    const currentLocation = getCurrentLocation(state)

    const relevantEvents = Events.immutableSelect(state)
        .filter(evt => (getCoord(evt.geo)[0] != undefined))
        .map(evt => ({...evt, distance: distance(currentLocation ? currentLocation : evt.geo, evt.geo), end_timestamp: moment(evt.end_timestamp), timestamp: moment(evt.timestamp)}))
        .filter(isWithinWindow(props.start, props.end)).cacheResult().toIndexedSeq()
        .sort((a, b)=> a.timestamp.diff(b.timestamp)).cacheResult().toIndexedSeq()

    const upcomingEvents = relevantEvents
        .filter(isWithinWindow(props.start, props.end))
        .groupBy(groupByTime).toKeyedSeq()
        .map(events => events.groupBy(groupByWalktime).sort(compareScores)).cacheResult()

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
