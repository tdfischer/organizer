import React from 'react'
import L from 'leaflet'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Model } from '../store'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import LocalMap from './mapping/LocalMap'
import gravatar from 'gravatar'
import importedComponent from 'react-imported-component'
import { getCoord } from '@turf/invariant'
import moment from 'moment'
import { getCurrentUser } from '../selectors/auth'
import { getCurrentLocation } from '../selectors/geocache'
import { Marker } from 'react-leaflet'

import 'react-leaflet-markercluster/dist/styles.min.css'
import './MapIndex.scss'

const MarkerClusterGroup = importedComponent(() => import('react-leaflet-markercluster/src/react-leaflet-markercluster'))

const People = new Model('people')
const Events = new Model('events')

export class MapIndex extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.props.people.fetchAll()
        this.props.events.fetchAll({timestamp__gte: moment().toISOString(), timestamp__lt: moment().add(30, 'days').toISOString()})
        this.props.events.fetchAll({timestamp__lt: moment().toISOString(), attendees__email: this.props.currentUser.email})
    }

    render() {
        const markers = _.map(this.props.allPeople, person => {
            const position = getCoord(person.geo)
            return {
                position: position,
                popup: person.name,
                tooltip: person.name,
                options: {
                    icon: L.icon({
                        iconUrl: gravatar.url(person.email, {s: 32, d: 'retro'}),
                        iconAnchor: [16, 16]
                    })
                }
            }
        })

        const eventMarkers = _.map(this.props.upcomingEvents, evt => (
            <Marker key={evt.id} position={getCoord(evt.geo)} />
        ))

        return (
            <div className="membership-map">
                <LocalMap>
                    <HeatmapLayer
                        latitudeExtractor={(p) => p.position[0]}
                        longitudeExtractor={(p) => p.position[1]}
                        intensityExtractor={(_p) => 50}
                        points={markers} />
                    <MarkerClusterGroup markers={markers} />
                    {eventMarkers}
                </LocalMap>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    const currentUser = getCurrentUser(state)
    const eventWindow = {
        start: moment().add(-1, 'month'),
        end: moment().add(1, 'month')
    }
    const currentLocation = getCurrentLocation(state)
    const relevantEvents = Events.select(state).filter(evt => moment(evt.timestamp).isBetween(eventWindow.start, eventWindow.end))
    const upcomingEvents = relevantEvents.filter(evt => moment(evt.timestamp).isSameOrAfter()).nearby(currentLocation).slice
    return {
        allPeople: People.select(state).hasGeo().slice,
        currentUser,
        upcomingEvents
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        people: People.bindActionCreators(dispatch),
        events: Events.bindActionCreators(dispatch)
    }
}

MapIndex.defaultProps = {
    allPeople: [],
    upcomingEvents: [],
    currentUser: {}
}

export default connect(mapStateToProps, mapDispatchToProps)(MapIndex)
