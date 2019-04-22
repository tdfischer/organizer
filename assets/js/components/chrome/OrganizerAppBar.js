import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import Avatar from '@material-ui/core/Avatar'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Divider from '@material-ui/core/Divider'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Chip from '@material-ui/core/Chip'
import { withStyles } from '@material-ui/styles'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Raven from 'raven-js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state'
import Logo from './Logo'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import faBug from '@fortawesome/fontawesome-free-solid/faBug'
import faExternalLinkAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkAlt'

faLibrary.add(faSignOutAlt, faBug, faExternalLinkAlt, faCalendar)

import BusyIndicator from './BusyIndicator'
import { logout } from '../../actions'
import { getCurrentUser, getLoggedIn } from '../../selectors/auth'
import { withProvider, Model } from '../../store'
import UserAvatar from '../UserAvatar'

const People = new Model('people')

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.immutableSelect(state).get(currentUser.email)
    return {
        logged_in: getLoggedIn(state),
        current_user: currentUser,
        currentPerson
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({logout}, dispatch)
}

const doReport = () => {
    Raven.captureMessage('Manual report')
    Raven.showReportDialog()
}

export const AppMenu = props => (
    <Menu {...props.menuProps}>
        <MenuItem onClick={props.onLogout}>
            <ListItemIcon><FontAwesomeIcon icon={['fas', 'sign-out-alt']} /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
        </MenuItem>
        {props.current_user.is_staff ? <MenuItem onClick={() => {window.location = '/admin/'}}>
            <ListItemIcon><FontAwesomeIcon icon={['fas', 'external-link-alt']} /></ListItemIcon>
            <ListItemText>Administration</ListItemText>
        </MenuItem> : null }
        <Divider />
        <MenuItem onClick={() => {doReport();props.onClose()}}>
            <ListItemIcon><FontAwesomeIcon icon={['fas', 'bug']} /></ListItemIcon>
            <ListItemText>Report a bug</ListItemText>
        </MenuItem>
    </Menu>
)

export const OrganizerAppBar = (props) => (
    <AppBar style={{position: 'initial'}}>
        <Toolbar>
            <PopupState variant="popover">
                {popupState => (
                    <React.Fragment>
                        <IconButton {...bindTrigger(popupState)}>
                            {(props.logged_in) ? (
                                <UserAvatar />
                            ) : (
                                <Logo style={{width: 'auto', height: '2rem', marginRight: '1rem'}}/>
                            )}
                        </IconButton>
                        <AppMenu current_user={props.current_user} menuProps={bindMenu(popupState)} onLogout={props.logout} />
                    </React.Fragment>
                )}
            </PopupState>
            <div className={props.classes.flex}>
                {(props.logged_in) ? (
                    <React.Fragment>
                        <Typography color="inherit" variant="h6">{props.currentPerson.name || ''}</Typography>
                        <Typography color="inherit" variant="subtitle1">{props.current_user.email}</Typography>
                    </React.Fragment>
                ) : (<Typography color="inherit" variant="h6">{(window.ORG_METADATA || {}).name}</Typography>)}
            </div>
            {(props.logged_in) ? (
                <div className={props.classes.flex}>
                    <Chip color="secondary" label={props.currentPerson.twelve_month_event_count} avatar={<Avatar><FontAwesomeIcon icon={['fas', 'calendar']} /></Avatar>}/>
                </div>
            ) : null}
            <BusyIndicator />
        </Toolbar>
    </AppBar>
)

OrganizerAppBar.defaultProps = {
    currentPerson: {},
    current_user: {},
    classes: {},
    logged_in: false
}

const styles = {
    flex: {
        flexGrow: 1
    }
}

export default withProvider(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(OrganizerAppBar)))
