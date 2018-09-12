import React from 'react'
import { connect } from 'react-redux'

export const UPDATE_CURRENT_LOCATION = 'UPDATE_CURRENT_LOCATION'

export const updateCurrentLocationFromBrowserPosition = pos => {
    return updateCurrentLocation([pos.coords.latitude, pos.coords.longitude])
}

export const updateCurrentLocation = coords => {
    return dispatch => {
        dispatch({
            type: UPDATE_CURRENT_LOCATION,
            geo: coords
        })
    }
}

export const withCurrentLocation = WrappedComponent => {
    return connect()(class Locator extends React.PureComponent {
        componentDidMount() {
            this.watchID = navigator.geolocation.watchPosition(this.updatePosition.bind(this), () => undefined, {enableHighAccuracy: true})
        }

        componentWillUnmount() {
            navigator.geolocation.clearWatch(this.watchID)
        }

        updatePosition(position) {
            this.props.dispatch(updateCurrentLocationFromBrowserPosition(position))
        }

        render() {
            return <WrappedComponent {...this.props} />
        }
    })
}

