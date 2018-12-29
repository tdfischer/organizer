import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { withState } from 'recompose'
import Carousel from '../Carousel'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'

import EventCard from './EventCard'
import NoEvents from './NoEvents'
import { makeGetUpcomingEvents, DAY_BREAKPOINTS } from '../../selectors/events'
import { withModelData } from '../../store'

export const EventCarousel = withState('index', 'setIndex', 0)(Carousel)

export const EventList = props => {
    const upcomingEvents = props.upcomingEvents.entrySeq().flatMap(([weekDelta, events]) => {
        const header = (
            <Grid
                item
                key={'week-'+weekDelta}
                className={props.classes.headerCard}>
                <Typography variant="headline" className={props.classes.timeHeader}>{DAY_BREAKPOINTS.getValue(weekDelta)}</Typography>
            </Grid>
        )
        return [header, <Grid item container style={{paddingLeft: 0, paddingRight: 0}} direction="column" key={weekDelta}><EventCarousel className={props.classes.eventCarousel} >{events.sortBy(e => -e.relevance).map(evt => (
            <EventCard className={props.classes.eventCard} key={evt.id} event_id={evt.id} onCheckIn={props.onCheckIn} />
        )).toJS()}</EventCarousel></Grid>]
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
        backgroundColor: '#fff',
        borderBottom: '1px solid black',
    },
    eventCarousel: {
        paddingLeft: '1rem',
        paddingRight: '1rem',
    },
    timeHeader: {
        paddingLeft: '1rem',
        margin: '0.3rem'
    },
    eventCard: {
        marginLeft: '0.5rem',
        marginRight: '0.5rem',
        marginBottom: '3rem'
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
