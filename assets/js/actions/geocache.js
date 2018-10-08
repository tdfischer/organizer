import React from 'react'
import { connect } from 'react-redux'
import { getLocationStatus } from '../selectors/geocache'

export const UPDATE_CURRENT_LOCATION = 'UPDATE_CURRENT_LOCATION'
export const SET_LOCATION_STATUS = 'SET_LOCATION_STATUS'

export const STATUS_NULL = undefined
export const STATUS_PERMITTED = 0
export const STATUS_DENIED = 1
export const STATUS_UNAVAILABLE = 2
export const STATUS_TIMEOUT = 3

export const updateCurrentLocationFromBrowserPosition = pos => {
    return updateCurrentLocation([pos.coords.latitude, pos.coords.longitude])
}

export const setLocationStatus = status => {
    return {
        type: SET_LOCATION_STATUS,
        status: status
    }
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
    const mapStateToProps = state => {
        return {
            locationStatus: getLocationStatus(state)
        }
    }
    return connect(mapStateToProps)(class Locator extends React.PureComponent {
        constructor(props) {
            super(props)
            this.watchID = -1
        }

        componentDidMount() {
            if (this.props.locationStatus == STATUS_PERMITTED || this.props.locationStatus == undefined) {
                this.start()
            }
        }

        componentDidUpdate(oldProps) {
            if (this.props.locationStatus == STATUS_PERMITTED && this.props.locationStatus != oldProps.locationStatus) {
                this.start()
            }
        }

        start() {
            if (this.watchID == -1) {
                this.watchID = navigator.geolocation.watchPosition(this.updatePosition.bind(this), this.positionError.bind(this), {enableHighAccuracy: true})
            }
        }

        componentWillUnmount() {
            this.stop()
        }

        stop() {
            navigator.geolocation.clearWatch(this.watchID)
            this.watchID = -1
        }

        updatePosition(position) {
            this.props.dispatch(updateCurrentLocationFromBrowserPosition(position))
            this.props.dispatch(setLocationStatus(STATUS_PERMITTED))
        }

        positionError(err) {
            this.props.dispatch(setLocationStatus(err.code))
        }

        render() {
            return <WrappedComponent {...this.props} startGeolocation={this.start.bind(this)} />
        }
    })
}
