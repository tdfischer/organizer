import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Geocache } from '../../actions'
import LocateControl from 'leaflet.locatecontrol'

import { TileLayer, Map, MapControl } from 'react-leaflet'

class AutoStartLocateControl extends LocateControl {
    constructor(props) {
        super(props)
        this.onLocationFound = props.onLocationFound
    }

    addTo(map) {
        super.addTo(map)
        map.on('locationfound', this.onLocationFound)
        this.start()
    }
}

class LocatorControlBase extends MapControl {
    createLeafletElement(props) {
        var lc = new AutoStartLocateControl({
            keepCurrentZoomLevel: true,
            locateOptions: {
                enableHighAccuracy: true,
            },
            icon: 'fa fa-map-marker',
            onLocationFound: loc => props.updateCurrentLocation(loc.latlng)
        })
        return lc
    }
}

const mapLocatorDispatchToProps = dispatch => {
    return bindActionCreators({
        updateCurrentLocation: Geocache.updateCurrentLocation
    }, dispatch)
}

const LocatorControl = connect(() => ({}), mapLocatorDispatchToProps)(LocatorControlBase)

const LocalMapBase = props => {
    return (
        <Map
            style={{minHeight: '30rem'}}
            zoom={17}
            center={[0, 0]} >
            <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution='&copy; OpenStreetMap contributors' />
            <LocatorControl />
            {props.children}
        </Map>
    )
}

const LocalMap = LocalMapBase

export default LocalMap
