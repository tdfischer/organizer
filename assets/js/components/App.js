import React from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import importedComponent from 'react-imported-component'
import { connect } from 'react-redux'
import { hot } from 'react-hot-loader'
import { history } from '../store'

import { getLoggedIn } from '../selectors/auth'
import OrganizerAppBar from './OrganizerAppBar'
import OrganizerBottomNav from './OrganizerBottomNav'

const LoginSplash = importedComponent(() => import('./LoginSplash'))
const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'))
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))
const CaptainIndex = importedComponent(() => import('./CaptainIndex'))

export const App = props => (
    props.logged_in ? (
        <div className="the-app">
            <OrganizerAppBar />
            <div className="viewport">
                <div className="scroll">
                    <Switch>
                        <Route exact path="/map" component={MapIndex} />
                        <Route exact path="/people" component={PeopleIndex} />
                        <Route exact path="/captain" component={CaptainIndex} />
                        <Route component={OrganizerDashboard} />
                    </Switch>
                </div>
            </div>
            <OrganizerBottomNav />
        </div>
    ) : <LoginSplash />
)


const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state)
    }
}

const RouterApp = (props) => (
    <ConnectedRouter history={props.history}>
        <App {...props} />
    </ConnectedRouter>
)

RouterApp.propTypes = {
    history: PropTypes.object
}

RouterApp.defaultProps = {
    history: history
}

export default hot(module)(connect(mapStateToProps)(RouterApp))
