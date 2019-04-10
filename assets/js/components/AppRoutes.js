import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router/immutable'
import importedComponent from 'react-imported-component'
import { history, withProvider } from '../store'
import { getLoggedIn } from '../selectors/auth'
import { connect } from 'react-redux'
import Skeleton from './activities/checkin/Skeleton'

const MapIndex = importedComponent(() => import(/* webpackChunkName:'map' */ './MapIndex'))
const PeopleIndex = importedComponent(() => import(/* webpackChunkName:'people' */ './PeopleIndex'))
const CaptainIndex = importedComponent(() => import(/* webpackChunkName:'captain' */'./CaptainIndex'))
const EventCheckin = importedComponent(() =>import(/* webpackChunkName:'checkin' */ './activities/checkin'), {
    LoadingComponent: Skeleton
})

export const AppRoutes = props => (
    props.logged_in ? (
        <ConnectedRouter history={history}>
            <Switch>
                <Route exact path="/map" component={MapIndex} />
                <Route exact path="/people" component={PeopleIndex} />
                <Route exact path="/captain" component={CaptainIndex} />
                <Route component={EventCheckin} />
            </Switch>
        </ConnectedRouter>
    ) : <EventCheckin />
)


const mapStateToProps = state => {
    return {
        logged_in: getLoggedIn(state)
    }
}

export default withProvider(connect(mapStateToProps)(AppRoutes))
