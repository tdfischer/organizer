import React from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router/immutable'
import importedComponent from 'react-imported-component'
import { connect } from 'react-redux'
import { hot } from 'react-hot-loader'
import { history } from '../store'

import { getLoggedIn } from '../selectors/auth'
import OrganizerAppBar from './OrganizerAppBar'
import OrganizerBottomNav from './OrganizerBottomNav'
import { withStyles } from '@material-ui/core/styles'
import Raven from 'raven-js'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import Button from '@material-ui/core/Button'

faLibrary.add(faTimes)

const LoginSplash = importedComponent(() => import('./LoginSplash'))
const MapIndex = importedComponent(() => import('./MapIndex'))
const OrganizerDashboard = importedComponent(() => import('./OrganizerDashboard'))
const PeopleIndex = importedComponent(() => import('./PeopleIndex'))
const CaptainIndex = importedComponent(() => import('./CaptainIndex'))

class ErrorWrapperBase extends React.Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    componentDidCatch(error, errorInfo) {
        Raven.captureException(error, { extra: errorInfo })
        console.error(error)
        console.error(errorInfo)
        this.setState({error})
    }

    render() {
        if (this.state.error) {
            return (
                <div className={this.props.classes.root} onClick={() => Raven.lastEventId() && Raven.showReportDialog()}>
                    <div className={this.props.classes.messagebox}>
                        <i style={{color: 'red', width: 'auto', height: '8rem'}} className="fa fa-times" />
                        <h1>Organizer has crashed!</h1>
                        <p>This is quite unfortunate.</p>
                        <p>{Raven.lastEventId() ? (<Button variant="contained" color="primary" onClick={() => Raven.showReportDialog()}>Report this bug</Button>) : null}</p>
                        <em>{Raven.lastEventId() ? 'This error has been automatically reported' : 'This error could not be automatically reported'}</em>
                        <pre className={this.props.classes.errorMessage}>{this.state.error.stack}</pre>
                    </div>
                </div>
            )
        } else {
            return this.props.children
        }
    }
}

const errorStyles = {
    root: {
        width: '80%',
        margin: 'auto',
        textAlign: 'center',
        paddingTop: '5rem'
    },
    errorMessage: {
        overflow: 'auto',
        backgroundColor: '#ddd'
    }
}

const ErrorWrapper = withStyles(errorStyles)(ErrorWrapperBase)

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
        <ErrorWrapper><App {...props} /></ErrorWrapper>
    </ConnectedRouter>
)

RouterApp.propTypes = {
    history: PropTypes.object
}

RouterApp.defaultProps = {
    history: history
}

export default hot(module)(connect(mapStateToProps)(RouterApp))
