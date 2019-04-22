import React from 'react'
import importedComponent from 'react-imported-component'
import { withStyles } from '@material-ui/styles'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import Hidden from '@material-ui/core/Hidden'
import { connect } from 'react-redux'

import LoginButtons from '../../chrome/LoginButtons'
import Logo from '../../chrome/Logo'
import { getCurrentUser, getLoggedIn } from '../../../selectors/auth'
import { getCurrentPerson } from '../../../selectors/people'
import { withModelData } from '../../../store'
import Skeleton from './Skeleton'

const EventPanel = importedComponent(() => import('./EventPanel'), {
    LoadingComponent: () => <Skeleton />
})

const Description = props => (
    <Grid xs={12} item container justify="center" spacing={8} {...props}>
        <Grid xs={1} item>
            <Logo style={{width: '100%', height: 'auto', marginTop: '1rem'}}/>
        </Grid>
        <Grid xs={9} md={6} item>
            <Typography variant="h5">Organizer</Typography>
            <Typography variant="subtitle1">Hosted by {(window.ORG_METADATA || {}).name}.</Typography>
            <Typography>
                This page lets you check in to an event with Organizer - wondering what
                Oragnizer is? It is a CRM-like tool for community organizing. The code is&nbsp;
                <a href="https://github.com/tdfischer/github">Free/Libre Open Source (AGPLv2!)</a>,
                so we control the data and not some distant, unfeeling
                corporation. It also means anyone else can run it, hack it, share it, learn from it for
                their own organization.
            </Typography>
        </Grid>
        <LoginPanel />
    </Grid>
)

const LoginPanel = _props => (
    <Grid xs={12} sm={5} md={4} item container style={{paddingLeft: '1rem', paddingRight: '1rem'}}>
        <Grid item style={{marginTop: '1rem', marginBottom: '1rem'}} container alignItems="center">
            <Hidden only="xs"><Grid item xs><Divider /></Grid></Hidden>
            <Grid item xs={4} style={{textAlign: 'center'}}><em>Already a member?</em></Grid>
            <Hidden only="xs"><Grid item xs><Divider /></Grid></Hidden>
        </Grid>
        <Grid item container spacing={8} justify="center">
            <LoginButtons label={true} />
        </Grid>
    </Grid>
)

const orgName = (window.ORG_METADATA || {}).name

const mapIntroStateToProps = state => {
    return {
        loggedIn: getLoggedIn(state),
        currentPerson: getCurrentPerson(state),
        currentUser: getCurrentUser(state)
    }
}

const propsToModels = props => {
    if (props.currentUser && props.currentUser.email) {
        return {
            people: props.currentUser.email
        }
    } else {
        return {}
    }
}

const IntroPanel = connect(mapIntroStateToProps)(withModelData(propsToModels)(props => (
    <React.Fragment>
        <Typography variant="h5">What&apos;s happening?</Typography>
        {props.loggedIn ? (
            <Typography variant="subtitle1">{props.currentPerson ? 'Hello, '+props.currentPerson.name+'!' : null}</Typography>
        ) : (
            <Typography variant="subtitle1">Sign up to join an event with {orgName} and <em>get organized</em>.</Typography>
        )}
    </React.Fragment>
)))

export const EventCheckin = props => {
    return (
        <React.Fragment>
            <Grid container justify="space-evenly" alignItems="stretch" style={{marginTop: '1rem'}}>
                <Grid xs={12} sm={5} md={4} item style={{paddingLeft: '1rem', paddingRight: '1rem'}}>
                    <IntroPanel />
                </Grid>
                <Grid xs={12} sm={7} md={8} item container direction="column">
                    <EventPanel />
                </Grid>
                {props.loggedIn ? null : <Description className={props.classes.whatItIs} />}
            </Grid>
        </React.Fragment>
    )
}

const style = {
    whatItIs: {
        backgroundColor: '#ddd',
        padding: '1rem',
        marginTop: '1rem'
    },
    loginPanel: {
        paddingLeft: '1rem',
        paddingRight: '1rem'
    },
}

const mapStateToProps = state => {
    return {
        loggedIn: getLoggedIn(state),
    }
}

export default withStyles(style)(connect(mapStateToProps)(EventCheckin))
