import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import importedComponent from 'react-imported-component'
import { connect } from 'react-redux'
import { hot } from 'react-hot-loader'

import LoginSplash from './LoginSplash'
import { getLoggedIn } from '../selectors'
import OrganizerAppBar from './OrganizerAppBar'
import OrganizerBottomNav from './OrganizerBottomNav'

const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'))
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))

const AppBase = _props => (
    <div className="the-app">
        <OrganizerAppBar />
        <Switch>
            <Route exact path="/map" component={MapIndex} />
            <Route exact path="/people" component={PeopleIndex} />
            <Route component={OrganizerDashboard} />
        </Switch>
        <OrganizerBottomNav />
    </div>
)


const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state)
    }
}

const App = connect(mapStateToProps)((props) => (
    <ConnectedRouter history={props.history}>
        {props.logged_in ? <AppBase /> : <LoginSplash />}
    </ConnectedRouter>
))

export default hot(module)(App)
