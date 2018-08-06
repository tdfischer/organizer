import React from 'react'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Icon from '@material-ui/core/Icon'
import { push } from 'connected-react-router'
import _ from 'lodash'
import { Model } from '../store'
import { connect } from 'react-redux'
import { getCurrentUser } from '../selectors/auth'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faUsers from '@fortawesome/fontawesome-free-solid/faUsers'
import faUserCircle from '@fortawesome/fontawesome-free-solid/faUserCircle'
import faGlobe from '@fortawesome/fontawesome-free-solid/faGlobe'
import faBullhorn from '@fortawesome/fontawesome-free-solid/faBullhorn'

faLibrary.add(faUsers, faGlobe, faUserCircle, faBullhorn)

const People = new Model('people')

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    const captainTurfs = _.filter(_.get(currentPerson, 'turf_memberships', []), {is_captain: true})
    const isCaptain = captainTurfs.length > 0
    return {
        path: state.router.location.pathname,
        isCaptain
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
        {props.isCaptain ?
            <BottomNavigationAction value="/captain" icon={<Icon className="fa fa-bullhorn" />} label="Captain" /> : null
        }
    </BottomNavigation>
)

export default connect(mapStateToProps, mapDispatchToProps)(OrganizerBottomNav)
