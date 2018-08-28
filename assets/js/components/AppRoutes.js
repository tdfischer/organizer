import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router/immutable'
import importedComponent from 'react-imported-component'
import { history } from '../store'

const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'))
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))
const CaptainIndex = importedComponent(() => import('./CaptainIndex'))

export const AppRoutes = _props => (
    <ConnectedRouter history={history}>
        <Switch>
            <Route exact path="/map" component={MapIndex} />
            <Route exact path="/people" component={PeopleIndex} />
            <Route exact path="/captain" component={CaptainIndex} />
            <Route component={OrganizerDashboard} />
        </Switch>
    </ConnectedRouter>
)

export default AppRoutes
