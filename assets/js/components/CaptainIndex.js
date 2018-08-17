import React from 'react'
import { Form, withFormState } from 'informed'
import { Filterable, Model } from '../store'
import _ from 'lodash'
import gravatar from 'gravatar'
import { connect } from 'react-redux'
import { getCurrentUser } from '../selectors/auth'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Slide from '@material-ui/core/Slide'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Avatar from '@material-ui/core/Avatar'
import Chip from '@material-ui/core/Chip'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Placeholder from 'react-placeholder'
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment'

import MaterialFormText from './MaterialFormText'
import MaterialFormSelect from './MaterialFormSelect'
import MessageCard from './MessageCard'

const People = new Model('people')
const PeopleFilter = new Filterable('broadcast-people')
const Broadcasts = new Model('broadcasts')
const States = new Model('states')

const mapStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    const captainTurfs = _.filter(_.get(currentPerson, 'turf_memberships', []), {is_captain: true})
    return {
        currentUser,
        currentPerson,
        captainTurfs,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        peopleFilter: PeopleFilter.bindActionCreators(dispatch),
        broadcasts: Broadcasts.bindActionCreators(dispatch),
        states: States.bindActionCreators(dispatch),
    }
}

const destinationStyles = {
    neighbors: {
        flexWrap: 'wrap'
    }
}

const messageListStateToProps = (state, _props) => {
    return {
        messages: Broadcasts.select(state)
            .all()
            .map(f => ({...f, sent_on: moment(f.sent_on)}))
            .sortBy('-sent_on').slice
    }
}

const MessageList = connect(messageListStateToProps)(props => (
    <Grid container direction="column" alignItems="stretch">
        {_.map(props.messages, m => (
            <Slide key={m.id} in={true} direction="down">
                <MessageCard message={m} />
            </Slide>
        ))}
    </Grid>
))

const destinationStateToProps = state => {
    const currentUser = getCurrentUser(state)
    const currentPerson = People.select(state).filterBy('email', currentUser.email).first()
    console.log(currentPerson)
    const turfs = _.filter(_.get(currentPerson, 'turf_memberships', []), {is_captain: true})
    const people = PeopleFilter.filtered(state, People.select(state).slice)
    const states = States.select(state).all().slice
    return {
        turfs,
        people,
        states
    }
}

const DestinationEditor = connect(destinationStateToProps)(withStyles(destinationStyles)(withFormState((props => {
    const selectedTurf = _.get(props.formState.values, props.field + '.turf')
    const turf = _.find(props.turfs, _.matchesProperty('turf', selectedTurf))
    const turfName = _.get(turf, 'name')

    const neighbors = _.map(props.people, neighbor => (
        <Chip
            key={neighbor.id}
            label={neighbor.name}
            avatar={<Avatar src={gravatar.url(neighbor.email, {s: 32, d: 'retro'})} />} />
    ))

    const stateFilter = (
        <FormControl fullWidth>
            <InputLabel>State</InputLabel>
            <MaterialFormSelect autoWidth={true} field={props.field + '.state'}>
                {_.map(props.states, state => (<MenuItem key={state.id} value={state.name}>{state.name}</MenuItem>))}
            </MaterialFormSelect>
        </FormControl>
    )
    const turfFilter = (
        <FormControl fullWidth>
            <InputLabel>Turf</InputLabel>
            <MaterialFormSelect autoWidth={true} field={props.field + '.turf'}>
                {_.map(props.turfs, turf=> (<MenuItem key={turf.turf} value={turf.turf}>{turf.name}</MenuItem>))}
            </MaterialFormSelect>
        </FormControl>
    )

    return (
        <ExpansionPanel>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} >
                <Placeholder type='text' rows={1} ready={props.turfs.length > 0}>
                    Broadcast to {props.people.length} neighbors in {turfName}.
                </Placeholder>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={props.classes.neighbors}>
                <Grid container direction="column" spacing={8} alignItems="stretch">
                    <Grid item>
                        <Grid container>
                            <Grid xs item>{stateFilter}</Grid>
                            <Grid xs item>{turfFilter}</Grid>
                        </Grid>
                    </Grid>
                    <Grid item>To: {neighbors}</Grid>
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    )
}))))

export class CaptainIndex extends React.Component {
    constructor(props) {
        super(props)
        this.onSubmit = this.onSubmit.bind(this)
        this.updateFilter = _.debounce(this.updateFilter.bind(this), 500)
    }

    componentDidMount() {
        this.props.people.fetchIfNeeded(this.props.currentUser.email)
        this.props.states.fetchAll()
        this.props.broadcasts.fetchAll({author: this.props.currentUser.id})
    }

    componentDidUpdate(oldProps) {
        if (!_.isMatch(oldProps.currentUser, this.props.currentUser)) {
            this.props.broadcasts.fetchAll({author: this.props.currentUser.id})
        }
    }

    onSubmit(values) {
        this.props.broadcasts.create({
            subject: values.subject,
            body: values.body,
            turf: values.filter.turf,
            target_state: values.filter.state
        }).catch(response => {
            response.json()
                .then(json => {
                    const fieldMap = {
                        body: 'body',
                        subject: 'subject',
                    }
                    const mappedErrors = _.mapKeys(json, (_v, k) => _.get(fieldMap, k))
                    _.each(_.omit(mappedErrors, [undefined]), (v, k) => this.formAPI.setError(k, v.join(', ')))
                })
        })
    }

    updateFilter(values) {
        console.log(values)
        this.props.peopleFilter.set({
            state: values.filter.state, 
            current_turf: {id: values.filter.turf}
        })
        this.props.people.fetchAll({
            turf_memberships__turf: values.filter.turf,
            state__name: values.filter.state
        })
    }

    render() {
        const initialValues = {
            filter: {
                state: _.get(_.head(this.props.allStates), 'name'),
                turf: _.get(_.head(this.props.captainTurfs), 'turf'),
            }
        }
        return (
            <Form initialValues={initialValues} getApi={api => this.formAPI = api } onValueChange={this.updateFilter} className={this.props.classes.form} onSubmit={this.onSubmit}>
                <Grid container spacing={16} direction="column" alignItems="stretch">
                    <Grid item>
                        <DestinationEditor field="filter" />
                    </Grid>
                    <Grid item>
                        <MaterialFormText fullWidth label="Subject" field="subject" />
                    </Grid>
                    <Grid item>
                        <MaterialFormText fullWidth multiline rows={10} label="Body" field="body" />
                    </Grid>
                    <Grid item className={this.props.classes.submit}>
                        <Button variant="raised" color="primary" type="submit">Send</Button>
                    </Grid>
                    <MessageList />
                </Grid>
            </Form>
        )
    }
}

const styles = {
    form: {
        padding: '1rem'
    },
    submit: {
        textAlign: 'right'
    },
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(CaptainIndex))
