import React from 'react'
import ReactDOM from 'react-dom'
import '../scss/app.scss'

import App from './components/App'
import { PersistentApp } from './store'

import Raven from 'raven-js'

Raven.config(window.SENTRY_PUBLIC_DSN).install()
window.onunhandledrejection = function(e) {Raven.captureException(e.reason)}

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
        <App />
    </PersistentApp>,
    document.getElementById('container')
)
