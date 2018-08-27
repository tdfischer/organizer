import React from 'react'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Avatar from '@material-ui/core/Avatar'
import { connect } from 'react-redux'
import { Model, withModelData } from '../store'
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
        turf: Turfs.immutableSelect(state).get(props.message.turf)
    }
}

const mapDispatchToProps = dispatch => {
    return {
        turfs: Turfs.bindActionCreators(dispatch)
    }
}

const mapPropsToModels = props => {
    return {
        turfs: props.message.turf
    }
}

const MessageCard = connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(withStyles(cardStyles)( props => (
    <Card className={props.classes.card}>
        <CardHeader
            title={props.message.subject}
            subheader={props.message.author + ' sent to ' + props.message.target_state + ' in ' + _.get(props.turf, 'name', 'somewhere') + ' ' + props.message.sent_on.fromNow()}
            avatar={<Avatar src={gravatar.url(props.message.author, {s: 32, d: 'retro'})} />} />
        <CardContent>{props.message.body}</CardContent>
    </Card>
))))

export default MessageCard
