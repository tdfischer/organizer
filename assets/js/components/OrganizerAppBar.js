import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import { withStyles } from '@material-ui/core/styles'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import gravatar from 'gravatar'
import _ from 'lodash'

import BusyIndicator from './BusyIndicator'
import { logout } from '../actions'
import { getCurrentUser, getLoggedIn } from '../selectors/auth'
import { Model } from '../store'

const People = new Model('people')

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    return {
        logged_in: getLoggedIn(state),
        current_user: currentUser,
        currentPerson
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({logout}, dispatch)
}

const OrganizerAppBar = connect(mapStateToProps, mapDispatchToProps)((props) => (
    <AppBar position="static">
        <Toolbar>
            <IconButton><Avatar src={gravatar.url(props.current_user.email, {s: 32, d: 'retro'})}/></IconButton>
            <div className={props.classes.flex}>
                <Typography color="inherit" variant="title">{_.get(props.currentPerson, 'name')}</Typography>
                <Typography color="inherit" variant="subheading">{props.current_user.email}</Typography>
            </div>
            <BusyIndicator />
            <Button onClick={() => props.logout()}>Logout</Button>
        </Toolbar>
    </AppBar>
))

const styles = {
    flex: {
        flexGrow: 1
    }
}

export default withStyles(styles)(OrganizerAppBar)
