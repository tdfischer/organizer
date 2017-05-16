import React from 'react'
import ReactDOM from 'react-dom'
import '../scss/app.scss'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/dist/styles.min.css'

import App from './components/App'
import { history, PersistentApp } from './store'

import injectTapEventPlugin from 'react-tap-event-plugin'

import { library as faLibrary } from '@fortawesome/fontawesome'
import faMapMarker from '@fortawesome/fontawesome-free-solid/faMapMarker'
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'
import faGithub from '@fortawesome/fontawesome-free-brands/faGithub'
import faUsers from '@fortawesome/fontawesome-free-solid/faUsers'
import faUserCircle from '@fortawesome/fontawesome-free-solid/faUserCircle'
import faGlobe from '@fortawesome/fontawesome-free-solid/faGlobe'

faLibrary.add(faMapMarker, faSpinner, faGithub, faLocationArrow, faUsers, faGlobe, faUserCircle)

injectTapEventPlugin()

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
