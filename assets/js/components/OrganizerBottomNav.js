import React from 'react'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Icon from '@material-ui/core/Icon'
import { push } from 'connected-react-router'
import { connect } from 'react-redux'

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

const OrganizerBottomNav = connect(mapStateToProps, mapDispatchToProps)(props => (
    <BottomNavigation
        className="bottom-nav"
        showLabels  
        value={props.path}
        onChange={(_evt, value) => props.push(value)} >
        <BottomNavigationAction value="/people" icon={<Icon className="fa fa-users" />} label="People" />
        <BottomNavigationAction value="/" icon={<Icon className="fa fa-user-circle" />}  label="Me" />
        <BottomNavigationAction value="/map" icon={<Icon className="fa fa-globe" />} label="Map" />
    </BottomNavigation>
))

export default OrganizerBottomNav
