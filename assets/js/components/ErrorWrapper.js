import React from 'react'
import Raven from 'raven-js'
import { withStyles } from '@material-ui/styles'
import importedComponent from 'react-imported-component'

const Button = importedComponent(() => import('@material-ui/core/Button'))

export class ErrorWrapper extends React.Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    componentDidCatch(error, errorInfo) {
        Raven.captureException(error, { extra: errorInfo })
        console.error(error)
        console.error(errorInfo)
        this.setState({error})
    }

    render() {
        if (this.state.error) {
            return (
                <div className={this.props.classes.root} onClick={() => Raven.lastEventId() && Raven.showReportDialog()}>
                    <div className={this.props.classes.messagebox}>
                        <i style={{color: 'red', width: 'auto', height: '8rem'}} className="fa fa-times" />
                        <h1>Organizer has crashed!</h1>
                        <p>This is quite unfortunate.</p>
                        <p>{Raven.lastEventId() ? (<Button variant="contained" color="primary" onClick={() => Raven.showReportDialog()}>Report this bug</Button>) : null}</p>
                        <em>{Raven.lastEventId() ? 'This error has been automatically reported' : 'This error could not be automatically reported'}</em>
                        <pre className={this.props.classes.errorMessage}>{this.state.error.stack}</pre>
                    </div>
                </div>
            )
        } else {
            return this.props.children
        }
    }
}

const errorStyles = {
    root: {
        width: '80%',
        margin: 'auto',
        textAlign: 'center',
        paddingTop: '5rem'
    },
    errorMessage: {
        overflow: 'auto',
        backgroundColor: '#ddd'
    }
}

export default withStyles(errorStyles)(ErrorWrapper)
