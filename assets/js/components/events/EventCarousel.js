import React from 'react'
import { withStyles } from '@material-ui/styles'

import EventCard from './EventCard'
import Carousel from '../Carousel'

export const EventCarousel = props => (
    <Carousel className={props.classes.carousel} index={props.index} onIndexChanged={props.onIndexChanged} >
        {props.events.map(evt => (
            <EventCard className={props.classes.card} key={evt.id} event_id={evt.id} onCheckIn={props.onCheckIn} />
        ))}
    </Carousel>
)

const style = {
    carousel: {
        paddingLeft: '1rem',
        paddingRight: '1rem'
    },
    card: {
        marginLeft: '0.5rem',
        marginRight: '0.5rem',
        marginBottom: '1rem'
    }
}

export default withStyles(style)(EventCarousel)
