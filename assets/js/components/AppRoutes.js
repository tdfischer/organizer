import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router/immutable'
import importedComponent from 'react-imported-component'
import { history, withProvider } from '../store'
import { getLoggedIn } from '../selectors/auth'
import { connect } from 'react-redux'
import LoadingSpinner from './chrome/LoadingSpinner'


const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'), {
    LoadingComponent: LoadingSpinner
})
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))
const CaptainIndex = importedComponent(() => import('./CaptainIndex'))
const AnonEventCheckin = importedComponent(() => import('./events/AnonEventCheckin'), {
    LoadingComponent: LoadingSpinner
})

export const AppRoutes = props => (
    props.logged_in ? (
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path="/map" component={MapIndex} />
                <Route exact path="/people" component={PeopleIndex} />
                <Route exact path="/captain" component={CaptainIndex} />
                <Route component={OrganizerDashboard} />
            </Switch>
        </ConnectedRouter>
    ) : <AnonEventCheckin />
)


const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state)
    }
}

export default withProvider(connect(mapStateToProps)(AppRoutes))
