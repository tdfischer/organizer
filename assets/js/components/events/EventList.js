import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { withState } from 'recompose'
import Carousel from '../Carousel'

import EventCard from './EventCard'
import NoEvents from './NoEvents'
import { makeGetUpcomingEvents, DAY_BREAKPOINTS } from '../../selectors/events'
import { withModelData } from '../../store'

export const EventCarousel = withState('index', 'setIndex', 0)(Carousel)

export const EventList = props => {
    const upcomingEvents = props.upcomingEvents.entrySeq().flatMap(([weekDelta, events]) => {
        const header = (
            <div
                key={'week-'+weekDelta}
                className={props.classes.headerCard}>
                <h3 className={props.classes.timeHeader}>{DAY_BREAKPOINTS.getValue(weekDelta)}</h3>
            </div>
        )
        return [header, <EventCarousel key={weekDelta} >{events.sortBy(e => -e.relevance).map(evt => (
            <EventCard className={props.classes.eventCard} key={evt.id} event_id={evt.id} onCheckIn={props.onCheckIn} />
        )).toJS()}</EventCarousel>]
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
        marginTop: '1rem',
        marginBottom: '0.5rem',
        padding: '0.25rem',
        backgroundColor: '#fff',
        borderBottom: '1px solid black',
        flex: 1,
    },
    timeHeader: {
        paddingLeft: '1rem',
        margin: '0.3rem'
    },
    eventCard: {
        marginLeft: '1rem',
        marginRight: '1rem',
        marginBottom: '1rem'
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
