import { connect } from 'react-redux'
import LocateControl from 'leaflet.locatecontrol'
import { MapControl } from 'react-leaflet'
import { bindActionCreators } from 'redux'
import { Geocache } from '../../actions'

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

export class LocatorControl extends MapControl {
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
export default connect(() => ({}), mapLocatorDispatchToProps)(LocatorControl)
