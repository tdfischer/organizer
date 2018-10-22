import React from 'react'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import { connect } from 'react-redux'
import { withTheme } from '@material-ui/core/styles'
import { Form } from 'informed'
import { withState } from 'recompose'

import MaterialFormText from '../MaterialFormText'
import { Model } from '../../store'
import LoginButtons from '../chrome/LoginButtons'
import { getActivityCount } from '../../selectors'

const Signups = new Model('signups')

const Thanks = _props => (
    <React.Fragment>
        <Grid item><Typography variant="headline">Thanks!</Typography></Grid>
        <Grid item>An organizer will get in touch.</Grid>
    </React.Fragment>
)

export const IntroText = props => {
    const orgName = (window.ORG_METADATA || {}).name
    if (props.event) {
        if (props.event.checkIn.canCheckIn) {
            return (
                <React.Fragment>
                    <Typography variant="headline">Is this what you&apos;re for?</Typography>
                    <p>Sign up now to join {orgName} and collect an event point for this!</p>
                </React.Fragment>
            )
        } else if (props.event.checkIn.isInPast) {
            return (
                <React.Fragment>
                    <Typography variant="headline">You just missed this event.</Typography>
                    <p>Sign up to join {orgName} and learn about future events like this!</p>
                </React.Fragment>
            )
        } else if (props.event.checkIn.hasNotStarted) {
            return (
                <React.Fragment>
                    <Typography variant="headline">This event hasn&apos;t started yet.</Typography>
                    <p>Sign up to join {orgName} and learn about future events like this, or come back later!</p>
                </React.Fragment>
            )
        } else if (props.event.checkIn.isNearby) {
            return (
                <React.Fragment>
                    <Typography variant="headline">This event is happening nearby!</Typography>
                    <p>Sign up to join {orgName} and learn about future events like this.</p>
                </React.Fragment>
            )
        } else {
            return null
        }
    } else {
        return null
    }
}

export const SigninBox = props => (
    <Form onSubmit={values => props.createSignup(values).then(() => props.setHasSaved(true))}>
        <Paper style={{padding: '1rem', backgroundColor: props.theme.palette.secondary.light}} >
            <Grid container direction="column" justify="center" alignItems="stretch" spacing={8}>
                {props.isSaving ? (
                    <Grid style={{textAlign: 'center'}} item>
                        <CircularProgress size={100} color="primary" />
                    </Grid>
                ) : (
                    !props.hasSaved ? (
                        <React.Fragment>
                            <Grid item><IntroText event={props.event} /></Grid>
                            <Grid item><MaterialFormText fullWidth label="E-Mail" field="email" validate={v => (v && v.indexOf('@') != -1) ? null : 'Please enter your e-mail address.'}/></Grid>
                            <Grid item><Button fullWidth variant="contained" color="primary" type="submit">Request to join</Button></Grid>
                            <Grid item style={{marginTop: '1rem'}} container alignItems="center">
                                <Grid item xs><Divider /></Grid>
                                <Grid item xs={4} style={{textAlign: 'center'}}><em>Or login</em></Grid>
                                <Grid item xs><Divider /></Grid>
                            </Grid>
                            <Grid item container spacing={8} justify="center">
                                <LoginButtons label={false} />
                            </Grid>
                        </React.Fragment>
                    ) : (
                        <Thanks />
                    )
                )}
            </Grid>
        </Paper>
    </Form>
)

SigninBox.defaultProps = {
    theme: {palette: {secondary: {}}}
}

const mapStateToProps = state => {
    return {
        isSaving: getActivityCount(state) > 0
    }
}

function eventID(evt) {
    if (evt && evt.checkIn.canCheckIn) {
        return evt.id
    }
    return undefined
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        createSignup: (values) => {
            return dispatch(Signups.create({
                ...values,
                event: eventID(ownProps.event)
            }))
        }
    }
}

export default withState('hasSaved', 'setHasSaved', false)(withTheme()(connect(mapStateToProps, mapDispatchToProps)(SigninBox)))
