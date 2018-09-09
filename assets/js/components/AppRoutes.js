import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router/immutable'
import importedComponent from 'react-imported-component'
import { history, withProvider } from '../store'
import { getLoggedIn } from '../selectors/auth'
import { connect } from 'react-redux'
import CircularProgress from '@material-ui/core/CircularProgress'

const LoadingDisplay = _props => (
    <CircularProgress style={{width: '3rem', height: '3rem'}} />
)

const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'), {
    LoadingComponent: LoadingDisplay
})
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))
const CaptainIndex = importedComponent(() => import('./CaptainIndex'))
export const LoginSplash = importedComponent(() => import('./chrome/LoginSplash'), {
    LoadingComponent: LoadingDisplay
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
    ) : <LoginSplash />
)


const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state)
    }
}

export default withProvider(connect(mapStateToProps)(AppRoutes))
