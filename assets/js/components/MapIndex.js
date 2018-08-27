import React from 'react'
import L from 'leaflet'
import { connect } from 'react-redux'
import { Model } from '../store'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import LocalMap from './mapping/LocalMap'
import gravatar from 'gravatar'
import importedComponent from 'react-imported-component'
import { getCoord } from '@turf/invariant'
import { getCurrentUser } from '../selectors/auth'

import 'react-leaflet-markercluster/dist/styles.min.css'
import './MapIndex.scss'

const MarkerClusterGroup = importedComponent(() => import('react-leaflet-markercluster/src/react-leaflet-markercluster'))

const People = new Model('people')

export class MapIndex extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.props.people.fetchAll()
    }

    render() {
        const markers = this.props.allPeople.map(person => {
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
        }).toArray()

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
    const currentUser = getCurrentUser(state)
    const allPeople = People.immutableSelect(state)
        .filter(person=> !!person.geo)
        .toList()
    return {
        allPeople,
        currentUser
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        people: People.bindActionCreators(dispatch)
    }
}

MapIndex.defaultProps = {
    allPeople: [],
    currentUser: {}
}

export default connect(mapStateToProps, mapDispatchToProps)(MapIndex)
