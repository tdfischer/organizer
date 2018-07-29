import React from 'react'

export default class DialogOpener extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }
        this.doOpen = this.doOpen.bind(this)
        this.doClose = this.doClose.bind(this)
    }

    doOpen() {
        this.setState({open: true})
    }

    doClose() {
        this.setState({open: false})
    }

    render() {
        return this.props.children(this.doOpen, this.doClose, this.state.open)
    }
}
