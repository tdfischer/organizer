import React from 'react'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Icon from '@material-ui/core/Icon'
import { push } from 'connected-react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getCurrentUser } from '../../selectors/auth'
import PropTypes from 'prop-types'
import { withProvider } from '../../store'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faUsers from '@fortawesome/fontawesome-free-solid/faUsers'
import faUserCircle from '@fortawesome/fontawesome-free-solid/faUserCircle'
import faGlobe from '@fortawesome/fontawesome-free-solid/faGlobe'
import faBullhorn from '@fortawesome/fontawesome-free-solid/faBullhorn'

faLibrary.add(faUsers, faGlobe, faUserCircle, faBullhorn)

const mapStateToProps = state => {
    return {
        path: state.getIn(['router', 'location', 'pathname']),
        currentUser: getCurrentUser(state)
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({push}, dispatch)
}

const CaptainButtons = () => [
    <BottomNavigationAction key="people" value="/people" icon={<Icon className="fa fa-users" />} label="People" />,
    <BottomNavigationAction key="captain" value="/captain" icon={<Icon className="fa fa-bullhorn" />} label="Broadcasts" />
]

export const OrganizerBottomNav = props => (
    <BottomNavigation
        className="bottom-nav"
        showLabels  
        value={props.path}
        onChange={(_evt, value) => props.push(value)} >
        <BottomNavigationAction value="/" icon={<Icon className="fa fa-user-circle" />}  label="Me" />
        <BottomNavigationAction value="/map" icon={<Icon className="fa fa-globe" />} label="Map" />
        {props.currentUser.is_staff ? CaptainButtons()  : null }
    </BottomNavigation>
)

OrganizerBottomNav.propTypes = {
    currentUser: PropTypes.object
}

OrganizerBottomNav.defaultProps = {
    currentUser: {}
}

export default withProvider(connect(mapStateToProps, mapDispatchToProps)(OrganizerBottomNav))
