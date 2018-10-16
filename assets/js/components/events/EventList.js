import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import moment from 'moment'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import EventCard from './EventCard'
import NoEvents from './NoEvents'
import { makeGetUpcomingEvents, DAY_BREAKPOINTS, WALKTIME_BREAKPOINTS } from '../../selectors/events'
import { withModelData } from '../../store'

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
                <EventCard className={props.classes.eventCard} key={evt.id} event_id={evt.id} onCheckIn={props.onCheckIn} />
            ))]
        })]
    })

    return (!upcomingEvents.isEmpty()) ? <React.Fragment>{upcomingEvents.toArray()}</React.Fragment> : <NoEvents />
}

const mapStateToProps = () => {
    const getUpcomingEvents = makeGetUpcomingEvents()
    return (state, props) => {
        return {
            upcomingEvents: getUpcomingEvents(state, {start: props.start, end: props.end}),
        }
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
            end_timestamp__gte: props.start.toISOString(),
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
