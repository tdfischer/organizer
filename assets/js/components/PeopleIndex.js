import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Selectable , Filterable, Model, withModelData } from '../store'
import _ from 'lodash'
import { Form } from 'informed'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Snackbar from '@material-ui/core/Snackbar'
import Badge from '@material-ui/core/Badge'
import importedComponent from 'react-imported-component'
import copy from 'copy-to-clipboard'

import MaterialFormText from './MaterialFormText'
import DialogOpener from './DialogOpener'
import PeopleTable from './PeopleTable'

const ImportDialog = importedComponent(() => import('./ImportDialog'))

const matchAny = (obj, pattern) => {
    try {
        const regex = new RegExp(pattern)
        return !!_.find(_.values(obj), (value) => {
            if (_.isString(value)) {
                return value.match(regex)
            }
            return matchAny(value, pattern)
        })
    } catch (SyntaxError) {
        // nothing 
    }
}

const States = new Model('states')
const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people', matchAny)

const mapStateToProps = state => {
    const allStates = States.immutableSelect(state).toList()
    const allPeople = People.immutableSelect(state)
    const selection = PeopleSelector.immutableSelected(state)
    const stateCounts = selection.groupBy(email => allPeople.get(email).state).map(v => v.size)
    return {
        allStates,
        stateCounts,
        selection,
        filtered: PeopleFilter.filtered(state, People.immutableSelect(state).toList()),
    }
}

const mapDispatchToProps = dispatch => {
    return {
        people: People.bindActionCreators(dispatch),
        states: States.bindActionCreators(dispatch),
        filter: PeopleFilter.bindActionCreators(dispatch),
        importPeople: people => {
            return Promise.all(_.map(people, person => dispatch(People.updateAndSave(person.email, person))))
        }
    }
}

const mapTaggerDispatchToProps = dispatch => {
    return {
        removeTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.immutableSelected(getState())
                return Promise.all(selectedPeople.map(email => People.immutableSelect(getState()).get(email)).map(person => {
                    dispatch(People.updateAndSave(person.id, person => ({
                        ...person,
                        tags: _.without(person.tags, formApi.getValue('tag'))
                    })))
                }).toArray())
            })
        },
        addTag: (formApi) => {
            dispatch((dispatch, getState) => {
                const selectedPeople = PeopleSelector.immutableSelected(getState())
                return Promise.all(selectedPeople.map(email => People.immutableSelect(getState()).get(email)).map(person => (
                    dispatch(People.updateAndSave(person.id, person => ({
                        ...person,
                        tags: [...person.tags, formApi.getValue('tag')]
                    })))
                )).toArray())
            })
        }
    }
}

const Tagger = connect(() => ({}), mapTaggerDispatchToProps)(props => (
    <Form>
        {({formApi}) => (
            <Grid container>
                <Grid item xs={6}><MaterialFormText label="Tag" field="tag" /></Grid>
                <Grid item xs={3}><Button color="secondary" variant="contained" onClick={() => props.removeTag(formApi)} type="submit">Remove tag</Button></Grid>
                <Grid item xs={3}><Button color="secondary" variant="contained" onClick={() => props.addTag(formApi)} value="add" type="submit">Add tag</Button></Grid>
            </Grid>
        )}
    </Form>
))

export class PeopleIndex extends Component {
    constructor(props) {
        super(props)
        this.state = {
            currentState: 0,
            copied: false
        }
        this.onCopy = this.onCopy.bind(this)
    }

    onCopy() {
        this.setState({copied: true})
        copy(this.props.selection.join(', '))
    }

    render() {
        const props = this.props
        return (
            <React.Fragment>
                <Snackbar open={this.state.copied} onClose={() => this.setState({copied: false})} message={'Copied '+this.props.selection.size+' e-mails'}/>
                <Grid container spacing={24}>
                    <Grid item xs={3}>
                        <DialogOpener>
                            {(open, close, isOpen) => (
                                <React.Fragment>
                                    <Button color="primary" onClick={open}>Import Spreadsheet</Button>
                                    <ImportDialog onImport={props.importPeople} open={isOpen} onClose={close} />
                                </React.Fragment>
                            )}
                        </DialogOpener>
                        <Button color="primary" onClick={this.onCopy}>Copy E-mails</Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Tagger />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField label="Search" onChange={e => props.filter.set(e.target.value)} />
                    </Grid>
                </Grid>
                {(!props.allStates.isEmpty()) ? (
                    <React.Fragment>
                        <Tabs fullWidth onChange={(_e, v) => this.setState({currentState: v})} value={this.state.currentState}>
                            {props.allStates.map(state => (
                                <Tab key={state.id} label={
                                    props.stateCounts.get(state.name)
                                        ? (<Badge color="primary" badgeContent={props.stateCounts.get(state.name)} >{state.name}</Badge>)
                                        : state.name
                                } />
                            )).toArray()}
                        </Tabs>
                        <PeopleTable state={props.allStates.get(this.state.currentState).name} />
                    </React.Fragment>
                ) : null}
            </React.Fragment>
        )
    }
}

const mapPropsToModels = _props => {
    return {
        people: {},
        states: {}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withModelData(mapPropsToModels)(PeopleIndex))
