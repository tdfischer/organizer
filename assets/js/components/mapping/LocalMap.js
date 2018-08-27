import React from 'react'
import BaseMap from './BaseMap'
import LocatorControl from './LocatorControl'

const LocalMap = props => {
    return (
        <BaseMap>
            <LocatorControl />
            {props.children}
        </BaseMap>
    )
}

export default LocalMap
