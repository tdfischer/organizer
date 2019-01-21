import React from 'react'
import { connect } from 'react-redux'
import { withState } from 'recompose'
import { withStyles } from '@material-ui/styles'
import Dialog from '@material-ui/core/Dialog'
import importedComponent from 'react-imported-component'
import moment from 'moment'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

const LoadingDisplay = _props => (
    <React.Fragment>
        <DialogTitle>
            Checking you in...
        </DialogTitle>
        <DialogContent>
            <LoadingSpinner />
        </DialogContent>
    </React.Fragment>
)

import LoadingSpinner from '../../chrome/LoadingSpinner'

import { getEventsWithLocation } from '../../../selectors/events'
import { getCurrentUser, getLoggedIn } from '../../../selectors/auth'
import { withCurrentLocation } from '../../../actions/geocache'
import NoEvents from '../../events/NoEvents'
import { withModelData, Model } from '../../../store'
import Grid from '@material-ui/core/Grid'

const Signups = new Model('signups')

const carouselStyles = {
    card: {
        backgroundColor: '#eee',
        animationName: '$fade',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-out',
        height: '14rem',
        margin: '2rem'
    },
    sliderBar: {
        backgroundColor: '#fafafa',
        height: '4rem'
    },
    button: {
        backgroundColor: '#ddd',
        marginLeft: '1rem',
        marginRight: '1rem',
    },
    indicator: {
        backgroundColor: '#333',
        borderRadius: '13px',
        height: '0.5rem'
    },
    '@keyframes fade': {
        from: {
            backgroundColor: '#fafafa'
        },
        to: {
            backgroundColor: '#ddd'
        }
    }
}

const LoadingCarousel = withStyles(carouselStyles)(props => (
    <Grid container spacing={8} direction="column" >
        <Grid item xs={12} className={props.classes.card} />
        <Grid item container alignItems="center" justify="space-between" xs={12} className={props.classes.sliderBar}>
            <Grid item xs={2} className={props.classes.button} />
            <Grid item xs={4} className={props.classes.indicator} />
            <Grid item xs={2} className={props.classes.button} />
        </Grid>
    </Grid>
))

const SignupForm = importedComponent(() => import('./SignupForm.js'), {
    LoadingComponent: LoadingDisplay
})
const EventCarousel = importedComponent(() => import('../../events/EventCarousel'), {
    LoadingComponent: LoadingCarousel
})

export const EventPanel = props => {
    const eventID = props.nearbyEvents.get(props.index, {}).id
    const doCheckIn = () => {
        if (props.loggedIn) {
            props.createSignup({email: props.currentUser.email}, eventID)
        } else {
            props.setOpen(true)
        }
    }
    return (
        props.hasFetched ? (
            <React.Fragment>
                <NoEvents show={props.nearbyEvents.count() > 0}>
                    <EventCarousel
                        events={props.nearbyEvents}
                        index={props.index}
                        onCheckIn={doCheckIn}
                        onIndexChanged={props.setIndex} />
                </NoEvents>
                <Dialog open={props.isOpen} onClose={() => props.setOpen(false)}>
                    <SignupForm createSignup={props.createSignup} event_id={eventID} />
                </Dialog>
            </React.Fragment>
        ) : (
            <LoadingCarousel />
        )
    )
}

const mapDispatchToProps = (dispatch) => {
    return {
        createSignup: (values, eventID) => {
            return dispatch(Signups.create({
                ...values,
                event: eventID
            }))
        }
    }
}

const mapStateToProps = state => {
    const nearbyEvents = getEventsWithLocation(state)
        .slice(0, 10)
        .toIndexedSeq()
    const currentUser = getCurrentUser(state)
    const loggedIn = getLoggedIn(state)
    return {
        nearbyEvents,
        currentUser,
        loggedIn
    }
}

const mapPropsToModels = _props => {
    //FIXME: Fine tune query to only search by timestamp and geolocation
    const start = moment().add(-3, 'days')
    const end = moment().add(1, 'month')
    return {
        events: {
            end_timestamp__gte: start.toISOString(),
            timestamp__lte: end.toISOString()
        }
    }
}

export default withCurrentLocation(withModelData(mapPropsToModels)(withState('isOpen', 'setOpen', false)(withState('index', 'setIndex', 0)(connect(mapStateToProps, mapDispatchToProps)(EventPanel)))))
