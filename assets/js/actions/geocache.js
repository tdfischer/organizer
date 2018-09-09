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
