import { createSelector } from 'reselect'
import { Model } from '../store'
import distance from '@turf/distance'
import moment from 'moment'
import Breakpoint from '../Breakpoint'
import { getCurrentLocation, getAccuracy } from './geocache'

const Events = new Model('events')

export const DAY_BREAKPOINTS = new Breakpoint([
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

const cookEventWithLocation = (currentLocation, accuracy, evt, now) => {
    const distanceFromHere = Math.max(0, distance(currentLocation ? currentLocation : evt.geo, evt.geo, 'meters') - accuracy) / 1000
    const isNearby = distanceFromHere <= 0.25
    const timeFromNow = evt.timestamp.diff(now, 'minutes')
    const endTimeFromNow = evt.end_timestamp.diff(now, 'minutes')
    const hasNotStarted = timeFromNow >= 30
    const isInPast = endTimeFromNow <= -120
    const canCheckIn = isNearby && !isInPast && !hasNotStarted
    const walktime = (distanceFromHere * 1000) / 84
    // Five minutes is about how long it takes someone to decide and get out the door
    const absoluteRelevance = (timeFromNow/15) - (walktime / 45)
    const relevance = 1 / Math.log10(Math.abs(absoluteRelevance))
    return {
        ...evt,
        distance: distanceFromHere,
        relevance,
        walktime,
        checkIn: {
            isNearby,
            isInPast,
            hasNotStarted,
            canCheckIn
        }
    }
}

const getNow = () => moment()

// FIXME: This won't update event check in status as time marches forward
export const getEventsWithLocation = createSelector(
    getNow,
    getCurrentLocation,
    getAccuracy,
    getEvents,
    (now, currentLocation, accuracy, allEvents) => (
        allEvents
            .filter(evt => evt.geo != undefined)
            .map(evt => cookEventWithLocation(currentLocation, accuracy, evt, now))
    )
)

const groupByTime = now => (evt) => DAY_BREAKPOINTS.getPoint(evt.timestamp.diff(now, 'days'))

export const makeGetUpcomingEvents = () => createSelector(
    getNow,
    getEventsWithLocation,
    (now, relevantEvents) => {
        return relevantEvents.toIndexedSeq()
            .groupBy(groupByTime(now)).toKeyedSeq()
            .sortBy((_v, k) => k)
            .sort((a, b) => a-b)
            .map(eventsInRange => 
                eventsInRange.sort((a, b) => a.distance - b.distance))
            .cacheResult()
    }
)
