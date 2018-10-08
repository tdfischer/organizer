import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import faCompass from '@fortawesome/fontawesome-free-solid/faCompass'
import { library as faLibrary } from '@fortawesome/fontawesome'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'

faLibrary.add(faCompass)

export const NoLocation = props => (
    <div className={props.classes.root}>
        <FontAwesomeIcon icon={['fa', 'compass']} spin size="4x" />
        <p>{props.message}</p>
        {props.onStartGeolocation ? (<Button color="primary" variant="outlined" onClick={props.onStartGeolocation}>Turn on location</Button>) : null }
    </div>
)

const styles = {
    root: {
        backgroundColor: '#ddd',
        color: '#aaa',
        textAlign: 'center',
        padding: '3rem'
    }
}

export default withStyles(styles)(NoLocation)

