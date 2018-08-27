import React from 'react'
import BaseMap from './BaseMap'
import { Marker } from 'react-leaflet'

const MarkerMap = props => (
    <BaseMap zoomControl={false} zoom={15} center={props.position} style={{position: 'relative', width: 'inherit', height: 'inherit', flex: 'auto'}}>
        <Marker position={props.position} />
    </BaseMap>
)

export default MarkerMap
