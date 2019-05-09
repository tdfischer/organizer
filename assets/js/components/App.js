import React from 'react'
import importedComponent from 'react-imported-component'
import { hot } from 'react-hot-loader'

import { ThemeProvider, jssPreset, createGenerateClassName } from '@material-ui/styles'
import JssProvider from 'react-jss/lib/JssProvider'
import { create } from 'jss'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import AppBar from '@material-ui/core/AppBar'
import { createMuiTheme } from '@material-ui/core/styles'
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
    <ThemeProvider theme={theme}>
        <div className="the-app">
            <OrganizerAppBar />
            <div className="viewport" id="viewport">
                <div className="scroll">
                    <AppRoutes />
                </div>
            </div>
            <OrganizerBottomNav />
        </div>
    </ThemeProvider>
)

const jss = create(jssPreset())
const generateClassName = createGenerateClassName()

const RouterApp = (props) => (
    <JssProvider jss={jss} generateClassName={generateClassName} ><ErrorWrapper><App {...props} /></ErrorWrapper></JssProvider>
)

export default hot(module)(RouterApp)
