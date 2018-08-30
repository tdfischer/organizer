import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import faCalendar from '@fortawesome/fontawesome-free-solid/faCalendar'
import { library as faLibrary } from '@fortawesome/fontawesome'
import { withStyles } from '@material-ui/core/styles'

faLibrary.add(faCalendar)

export const NoEvents = props => (
    <div className={props.classes.root}>
        <FontAwesomeIcon icon={['fa', 'calendar']}  className={props.classes.icon} />
        <p>No events.</p>
        <p><em>Go make some trouble.</em></p>
    </div>
)

const styles = {
    root: {
        backgroundColor: '#ddd',
        color: '#aaa',
        textAlign: 'center',
        padding: '3rem'
    },
    icon: {
        height: '4rem',
        width: 'auto'
    }
}

export default withStyles(styles)(NoEvents)
