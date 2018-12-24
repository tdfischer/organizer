import React from 'react'
import { getEventsWithLocation, isWithinWindow } from '../../selectors/events'
import { withModelData } from '../../store'
import { withStyles, withTheme } from '@material-ui/core/styles'
import { connect } from 'react-redux'
import moment from 'moment'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import NoEvents from './NoEvents'
import Logo from '../chrome/Logo'
import importedComponent from 'react-imported-component'
import { withCurrentLocation } from '../../actions/geocache'

const EventCard = importedComponent(() => import('./EventCard'))
const SigninBox = importedComponent(() => import('../chrome/SigninBox'))

const Description = props => (
    <Grid container justify="center" spacing={8} {...props}>
        <Grid xs={1} item>
            <Logo style={{width: '100%', height: 'auto', marginTop: '1rem'}}/>
        </Grid>
        <Grid xs={9} md={6} item>
            <Typography variant="headline">Organizer</Typography>
            <Typography variant="subheading">Hosted by {(window.ORG_METADATA || {}).name}.</Typography>
            <Typography>
                This page lets you check in to an event with Organizer - wondering what
                Oragnizer is? It is a CRM-like tool for community organizing. The code is&nbsp;
                <a href="https://github.com/tdfischer/github">Free/Libre Open Source (AGPLv2!)</a>,
                so we control the data and not some distant, unfeeling
                corporation. It also means anyone else can run it, hack it, share it, learn from it for
                their own organization.
            </Typography>
        </Grid>
    </Grid>
)

export const AnonEventCheckin = props => (
    <React.Fragment>
        <Grid container justify="center" style={{padding: '1rem'}} spacing={8}>
            <Grid xs={12} sm={7} md={8} item style={{marginBottom: '1rem'}}>{props.nearbyEvent ? <EventCard event_id={props.nearbyEvent.id} /> : <NoEvents /> }</Grid>
            <Grid xs={12} sm={5} md={4} item>
                <SigninBox isSaving={props.isSaving} event={props.nearbyEvent} />
            </Grid>
            <Grid xs={12} item>
                <p>{props.nearbyEvent ? props.nearbyEvent.description : undefined}</p>
            </Grid>
        </Grid>
        <Description className={props.classes.whatItIs} />
    </React.Fragment>
)

const mapPropsToModels = _props => {
    //FIXME: Fine tune query to only search by timestamp and geolocation
    const start = moment().add(-1, 'hour')
    const end = moment().add(1, 'month')
    return {
        events: {
            end_timestamp__gte: start.toISOString(),
            timestamp__lte: end.toISOString()
        }
    }
}

const mapStateToProps = state => {
    const nearbyEvent = getEventsWithLocation(state)
        .filter(isWithinWindow(moment().add(-1, 'week'), moment().add(1, 'week')))
        .sort((a, b) => Math.abs(a.relevance) - Math.abs(b.relevance))
        .first()
    return {
        nearbyEvent
    }
}

const style = {
    whatItIs: {
        backgroundColor: '#ddd',
        padding: '1rem'
    }
}

export default withCurrentLocation(withStyles(style)(withTheme()(withModelData(mapPropsToModels)(connect(mapStateToProps)(AnonEventCheckin)))))
