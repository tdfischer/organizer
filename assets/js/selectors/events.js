import { createSelector } from 'reselect'
import { Model } from '../store'
import distance from '@turf/distance'
import bearing from '@turf/bearing'
import { convertLength } from '@turf/helpers'
import moment from 'moment'
import Breakpoint from '../Breakpoint'
import { getCurrentLocation, getAccuracy } from './geocache'
import { getCurrentUser } from './auth'

const Events = new Model('events')
const Signups = new Model('signups')

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

export const WALKTIME_BREAKPOINTS = new Breakpoint([
    [5, 'Nearby'],
    [15, 'By bike'],
    [35, 'By bus'],
    [undefined, 'Far away'],
])


export function isWithinWindow(start, end) {
    if (!start || !end) {
        return () => true
    }
    const eventWindow = {
        start: start,
        end: end
    }
    return evt => (
        evt.timestamp.isSameOrBefore(eventWindow.end) &&
        evt.end_timestamp.isSameOrAfter(eventWindow.start)
    )
}

const getSignups = (state, {event_id} = {}) => (
    Signups.immutableSelect(state)
        .filter(signup => event_id ? signup.event == event_id : true)
)

const getSignupsForCurrentUser = createSelector(
    getCurrentUser,
    getSignups,
    (currentUser, allSignups) => (
        allSignups.filter(signup => signup.email == currentUser.email)
    )
)

const getEvents = (state, {start, end} = {}) => (
    Events.immutableSelect(state)
        .map(evt => ({
            ...evt, 
            end_timestamp: moment(evt.end_timestamp), 
            timestamp: moment(evt.timestamp),
        }))
        .filter(isWithinWindow(start, end))
)

export const getEventsInWindow = (state, {start, end} = {}) => (
    getEvents(state)
        .filter(isWithinWindow(start, end))
)

export const locationDisplay = (evt, currentLocation) => {
    if (currentLocation) {
        const distanceDisplay = Math.round(convertLength(evt.distance, 'meters', 'miles')) + ' miles'
        const compassDisplay = COMPASS_BREAKPOINTS.getValue(evt.bearing)
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

export const cookEventWithLocation = (currentLocation, accuracy, evt, now, signups) => {
    const hasSignedUp = !!signups.find(signup => signup.event == evt.id)
    const distanceFromHere = Math.max(0, distance(currentLocation ? currentLocation : evt.geo, evt.geo, {units: 'meters'}) - accuracy)
    const isNearby = distanceFromHere <= 2500
    const timeFromNow = evt.timestamp.diff(now, 'minutes')
    const endTimeFromNow = evt.end_timestamp.diff(now, 'minutes')
    const hasNotStarted = timeFromNow >= 30
    const isInPast = endTimeFromNow <= -120
    const canCheckIn = isNearby && !isInPast && !hasNotStarted
    const walktime = (distanceFromHere * 1000) / 84
    // Five minutes is about how long it takes someone to decide and get out the door
    const absoluteRelevance = (timeFromNow/15) - (walktime / 45)
    const relevance = 1 / Math.log10(Math.abs(absoluteRelevance))
    const hasCheckedIn = hasSignedUp || evt.user_has_checked_in
    const evtBearing = bearing(currentLocation ? currentLocation : evt.geo, evt.geo)
    const evtWithoutDisplay = {
        ...evt,
        distance: distanceFromHere,
        relevance,
        bearing: evtBearing,
        walktime,
        checkIn: {
            isNearby,
            isInPast,
            hasNotStarted,
            canCheckIn,
            hasCheckedIn
        }
    }
    return {
        ...evtWithoutDisplay,
        locationDisplay: locationDisplay(evtWithoutDisplay, currentLocation),
    }
}

const getNow = () => Date.now()

// FIXME: This won't update event check in status as time marches forward
export const getEventsWithLocation = createSelector(
    getNow,
    getCurrentLocation,
    getAccuracy,
    getEvents,
    getSignupsForCurrentUser,
    (now, currentLocation, accuracy, allEvents, signups) => (
        allEvents
            .filter(evt => evt.geo != undefined)
            .map(evt => cookEventWithLocation(currentLocation, accuracy, evt, now, signups))
            .sort(evt => -evt.relevance)
    )
)
