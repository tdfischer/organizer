import React from 'react'
import importedComponent from 'react-imported-component'
import { hot } from 'react-hot-loader'

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Logo from './chrome/Logo'
import ErrorWrapper from './ErrorWrapper'

faLibrary.add(faTimes)

const theme = createMuiTheme({
    palette: (window.ORG_METADATA || {}).palette
})

const EmptyAppBar = _props => (
    <AppBar style={{position: 'initial'}}>
        <Toolbar>
            <Logo style={{width: 'auto', height: '2rem', marginRight: '1rem'}} />
            <Typography variant="title">{(window.ORG_METADATA || {}).name}</Typography>
        </Toolbar>
    </AppBar>
)

const AppRoutes = importedComponent(() => import('./AppRoutes'))
const OrganizerAppBar = importedComponent(() => import('./chrome/OrganizerAppBar'), {
    LoadingComponent: EmptyAppBar
})
const OrganizerBottomNav = importedComponent(() => import('./chrome/OrganizerBottomNav'))


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
