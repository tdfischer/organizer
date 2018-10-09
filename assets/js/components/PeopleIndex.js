import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Selectable , Filterable, Model } from '../store'
import _ from 'lodash'
import { Form } from 'informed'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Snackbar from '@material-ui/core/Snackbar'
import importedComponent from 'react-imported-component'
import copy from 'copy-to-clipboard'

import MaterialFormText from './MaterialFormText'
import DialogOpener from './DialogOpener'
import PeopleTable from './people-browser/PeopleTable'
import Search from './people-browser/Search'

const ImportDialog = importedComponent(() => import('./ImportDialog'))
const Editor = importedComponent(() => import('./people-browser/Editor'))

const States = new Model('states')
const People = new Model('people')
const PeopleSelector = new Selectable('people')
const PeopleFilter = new Filterable('people')

const mapStateToProps = state => {
    const selection = PeopleSelector.immutableSelected(state)
    return {
        selection,
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
            copied: false,
        }
        this.onCopy = this.onCopy.bind(this)
    }

    onCopy() {
        this.setState({copied: true})
        copy(this.props.selection.join(', '))
    }

    onPersonClicked(person, opener) {
        this.setState({clickedPerson: person.id})
        opener()
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
                    <Grid item xs={9}>
                        <Tagger />
                    </Grid>
                </Grid>
                <Grid container><Grid item xs><Search filter={props.filter} /></Grid></Grid>
                <DialogOpener>
                    {(open, close, isOpen) => (
                        <React.Fragment>
                            <Editor personID={this.state.clickedPerson} open={isOpen} onClose={close} />
                            <PeopleTable onPersonClick={(person) => this.onPersonClicked(person, open)} />
                        </React.Fragment>
                    )}
                </DialogOpener>
            </React.Fragment>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeopleIndex)
