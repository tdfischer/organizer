import React from 'react'
import L from 'leaflet'
import _ from 'lodash'
import { connect } from 'react-redux'
import Model from '../store/model'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import MarkerClusterGroup from 'react-leaflet-markercluster/src/react-leaflet-markercluster'
import LocalMap from './mapping/LocalMap'
import gravatar from 'gravatar'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerRetinaIcon from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet/dist/leaflet.css'
import 'react-leaflet-markercluster/dist/styles.min.css'
import './MapIndex.scss'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerRetinaIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
})

const People = new Model('people')

class MapIndexBase extends React.Component {
    constructor(props) {
        super(props)
        this.props.people.refresh()
    }

    render() {
        const markers = _.map(this.props.allPeople.slice, person => {
            const position = [person.geo.lat, person.geo.lng]
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

        return (
            <div className="membership-map">
                <LocalMap>
                    <HeatmapLayer
                        latitudeExtractor={(p) => p.position[0]}
                        longitudeExtractor={(p) => p.position[1]}
                        intensityExtractor={(_p) => 50}
                        points={markers} />
                    <MarkerClusterGroup markers={markers} />
                </LocalMap>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        allPeople: People.select(state).withGeo()
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        people: People.bindActionCreators(dispatch)
    }
}

const MapIndex = connect(mapStateToProps, mapDispatchToProps)(MapIndexBase)

export default MapIndex
