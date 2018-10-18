import React from 'react'
import importedComponent from 'react-imported-component'
import { hot } from 'react-hot-loader'

import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core/styles'
import Raven from 'raven-js'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import CircularProgress from '@material-ui/core/CircularProgress'

faLibrary.add(faTimes)

const theme = createMuiTheme({
    palette: (window.ORG_METADATA || {}).palette
})

const EmptyAppBar = _props => (
    <AppBar style={{position: 'initial'}}>
        <Toolbar><CircularProgress /> Organizer</Toolbar>
    </AppBar>
)
const EmptyBottomBar = _props => (
    <BottomNavigation
        className="bottom-nav">
        <BottomNavigationAction value="/" icon={<i className="fa fa-user-circle" />}  label="Organizer" />
    </BottomNavigation>
)
const Button = importedComponent(() => import('@material-ui/core/Button'))
const AppRoutes = importedComponent(() => import('./AppRoutes'))
const OrganizerAppBar = importedComponent(() => import('./chrome/OrganizerAppBar'), {
    LoadingComponent: EmptyAppBar
})
const OrganizerBottomNav = importedComponent(() => import('./chrome/OrganizerBottomNav'), {
    LoadingComponent: EmptyBottomBar
})

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

export const App = _props => (
    <MuiThemeProvider theme={theme}>
        <div className="the-app">
            <OrganizerAppBar />
            <div className="viewport" id="viewport">
                <div className="scroll">
                    <AppRoutes />
                </div>
            </div>
            <OrganizerBottomNav />
        </div>
    </MuiThemeProvider>
)


const RouterApp = (props) => (
    <ErrorWrapper><App {...props} /></ErrorWrapper>
)

export default hot(module)(RouterApp)
