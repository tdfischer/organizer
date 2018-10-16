import React from 'react'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library as faLibrary } from '@fortawesome/fontawesome'
import faDiscourse from '@fortawesome/fontawesome-free-brands/faDiscourse'
import faSlack from '@fortawesome/fontawesome-free-brands/faSlack'
import faExclamationTriangle from '@fortawesome/fontawesome-free-solid/faExclamationTriangle'

faLibrary.add(faDiscourse, faSlack, faExclamationTriangle)

function iconForName(name) {
    switch (name) {
    case 'local-dev':
        return ['fa', 'exclamation-triangle']
    default:
        return ['fab', name]
    }
}

function styleForName(name) {
    switch (name) {
    case 'local-dev':
        return {style: {backgroundColor: '#f00'}}
    default:
        return {color: 'primary'}
    }
}

const LoginButtons = props => (
    <React.Fragment>
        {Object.entries(window.LOGIN_URLS || []).map(([name, url]) => (
            <Grid key={name} item><Button
                variant="contained"
                {...styleForName(name)}
                fullWidth
                href={url}>
                {props.label ? 'Sign in with '+name+' ' : null}
                <FontAwesomeIcon icon={iconForName(name)} style={{height: '2rem', width: 'auto'}}/>
            </Button></Grid>
        ))}
    </React.Fragment>
)

LoginButtons.defaultProps = {
    label: true
}

export default LoginButtons
