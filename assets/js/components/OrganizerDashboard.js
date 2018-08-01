import React from 'react'
import { connect } from 'react-redux'
import { Model } from '../store'
import _ from 'lodash'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'

import { getCurrentUser } from '../selectors/auth'

const People = new Model('people')

class OrganizerDashboardBase extends React.Component {
    componentDidMount() {
        this.props.people.fetchIfNeeded(this.props.currentUser.email)
    }

    render() {
        const keys = _.keys(this.props.currentPerson)
        const metadata = _.map(keys, k => {
            return (<p key={k}>{k} = {JSON.stringify(_.get(this.props.currentPerson, k))}</p>)
        })
        console.log(this.props.currentPerson, metadata)
        const name = _.get(this.props.currentPerson, 'name', '')
        return (
            <div>
                <Typography variant="title">{name}</Typography>
                <Typography variant="subheading">{this.props.currentUser.email}</Typography>
                <Divider />
                <Typography variant="title">Raw data</Typography>
                {metadata}
            </div>
        )
    }
}

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    return {
        currentUser,
        currentPerson
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch)
    }
}


const OrganizerDashboard = connect(mapStateToProps, mapDispatchToProps)(OrganizerDashboardBase)

export default OrganizerDashboard
