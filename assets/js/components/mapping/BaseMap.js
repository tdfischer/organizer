import React from 'react'
import L from 'leaflet'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerRetinaIcon from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { TileLayer, Map } from 'react-leaflet'

delete L.Icon.Default.prototype._getIconUrl

import 'leaflet/dist/leaflet.css'

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerRetinaIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
})

const BaseMap = props => (
    <Map {...props}>
        <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; OpenStreetMap contributors' />
        {props.children}
    </Map>
)

BaseMap.defaultProps = {
    center: [0, 0],
    zoom: 17
}

export default BaseMap
