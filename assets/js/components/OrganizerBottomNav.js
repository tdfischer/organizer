import React from 'react'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Icon from '@material-ui/core/Icon'
import { push } from 'connected-react-router'
import { connect } from 'react-redux'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faUsers from '@fortawesome/fontawesome-free-solid/faUsers'
import faUserCircle from '@fortawesome/fontawesome-free-solid/faUserCircle'
import faGlobe from '@fortawesome/fontawesome-free-solid/faGlobe'

faLibrary.add(faUsers, faGlobe, faUserCircle)

const mapStateToProps = state => {
    return {
        path: state.router.location.pathname
    }
}

const mapDispatchToProps = dispatch => {
    return {
        push: path => dispatch(push(path))
    }
}

export const OrganizerBottomNav = props => (
    <BottomNavigation
        className="bottom-nav"
        showLabels  
        value={props.path}
        onChange={(_evt, value) => props.push(value)} >
        <BottomNavigationAction value="/people" icon={<Icon className="fa fa-users" />} label="People" />
        <BottomNavigationAction value="/" icon={<Icon className="fa fa-user-circle" />}  label="Me" />
        <BottomNavigationAction value="/map" icon={<Icon className="fa fa-globe" />} label="Map" />
    </BottomNavigation>
)

export default connect(mapStateToProps, mapDispatchToProps)(OrganizerBottomNav)
