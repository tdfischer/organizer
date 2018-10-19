import React from 'react'
import { Form, withFormState } from 'informed'
import { Filterable, Model, withModelData } from '../store'
import _ from 'lodash'
import gravatar from 'gravatar'
import { connect } from 'react-redux'
import { getCurrentPerson, getPeople } from '../selectors/people'
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

const PeopleFilter = new Filterable('broadcast-people')
const Broadcasts = new Model('broadcasts')
const States = new Model('states')

const mapStateToProps = state => {
    const currentPerson = getCurrentPerson(state)
    const captainTurfs = _.get(currentPerson, 'turf_memberships', [])
    return {
        currentPerson,
        captainTurfs,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setFilter: filter => dispatch(PeopleFilter.set(filter)),
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
        messages: Broadcasts.immutableSelect(state)
            .map(f => ({...f, sent_on: moment(f.sent_on)}))
            .sort((a, b) => a.sent_on > b.sent_on).toList().toJS()
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
    const currentPerson = getCurrentPerson(state)
    const turfs = _.get(currentPerson, 'turf_memberships', [])
    const people = PeopleFilter.filtered(state, getPeople(state)).toList().toJS()
    const states = States.immutableSelect(state).toList().toJS()
    return {
        turfs,
        people,
        states
    }
}

const mapDestinationPropsToModels = props => {
    return {
        people: {
            turf_memberships__turf: _.get(props.formState.values, props.field + '.turf'),
            state__name: _.get(props.formState.values, props.field + '.state')
        }
    }
}

const DestinationEditor = connect(destinationStateToProps)(withStyles(destinationStyles)(withFormState((withModelData(mapDestinationPropsToModels)(props => {
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
})))))

export class CaptainIndex extends React.Component {
    constructor(props) {
        super(props)
        this.onSubmit = this.onSubmit.bind(this)
        this.updateFilter = _.debounce(this.updateFilter.bind(this), 500)
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
        this.props.setFilter({
            state: values.filter.state, 
            current_turf: {id: values.filter.turf}
        })
    }

    render() {
        const initialValues = {
            filter: {
                state: _.get(_.head(this.props.allStates), 'name', ''),
                turf: _.get(_.head(this.props.captainTurfs), 'turf', -1),
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

const mapPropsToModels = props => {
    return {
        people: props.currentUser.email,
        states: {},
        broadcasts: {author: props.currentUser.id}
    }
}

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(CaptainIndex)))
