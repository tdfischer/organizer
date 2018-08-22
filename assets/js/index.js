import React from 'react'
import ReactDOM from 'react-dom'
import '../scss/app.scss'

import App from './components/App'
import { history, PersistentApp } from './store'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faMapMarker from '@fortawesome/fontawesome-free-solid/faMapMarker'
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'

import Raven from 'raven-js'

Raven.config(window.SENTRY_PUBLIC_DSN).install()
window.onunhandledrejection = function(e) {Raven.captureException(e.reason)}

faLibrary.add(faMapMarker, faSpinner, faLocationArrow)

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('SW registered: ' + registration)
        }).catch(registrationError => {
            console.log('SW registration failed: ' + registrationError)
        })
    })
}

ReactDOM.render(
    <PersistentApp>
        <App history={history} />
    </PersistentApp>,
    document.getElementById('container')
)
