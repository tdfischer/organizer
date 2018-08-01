import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import gravatar from 'gravatar'

import BusyIndicator from './BusyIndicator'
import { logout } from '../actions'
import { getCurrentUser, getLoggedIn } from '../selectors/auth'

const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state),
        current_user: getCurrentUser(state)
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({logout}, dispatch)
}

const OrganizerAppBar = connect(mapStateToProps, mapDispatchToProps)((props) => (
    <AppBar position="static">
        <Toolbar>
            <IconButton><Avatar src={gravatar.url(props.current_user.email, {s: 32, d: 'retro'})}/></IconButton>
            <Typography color="inherit" variant="title">Organizer</Typography>
            <BusyIndicator />
            <Button onClick={() => props.logout()}>Logout</Button>
        </Toolbar>
    </AppBar>
))

export default OrganizerAppBar
