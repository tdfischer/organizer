import React from 'react'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Avatar from '@material-ui/core/Avatar'
import { connect } from 'react-redux'
import { Model } from '../store'
import { withStyles } from '@material-ui/core/styles'
import _ from 'lodash'
import gravatar from 'gravatar'

const Turfs = new Model('turfs')

const cardStyles = {
    card: {
        margin: '1rem'
    },
}

const mapStateToProps = (state, props) => {
    return {
        turf: Turfs.select(state).filterBy('id', props.message.turf).first()
    }
}

const mapDispatchToProps = dispatch => {
    return {
        turfs: Turfs.bindActionCreators(dispatch)
    }
}

const MessageCard = connect(mapStateToProps, mapDispatchToProps)(withStyles(cardStyles)(class MessageCard extends React.Component {
    componentDidMount() {
        this.props.turfs.fetchIfNeeded(this.props.message.turf)
    }

    render() {
        return (
            <Card className={this.props.classes.card}>
                <CardHeader
                    title={this.props.message.subject}
                    subheader={this.props.message.author + ' sent to ' + this.props.message.target_state + ' in ' + _.get(this.props.turf, 'name', 'somewhere') + ' ' + this.props.message.sent_on.fromNow()}
                    avatar={<Avatar src={gravatar.url(this.props.message.author, {s: 32, d: 'retro'})} />} />
                <CardContent>{this.props.message.body}</CardContent>
            </Card>
        )
    }
}))

export default MessageCard
