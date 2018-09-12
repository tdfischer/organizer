import React from 'react'
import _ from 'lodash'
import { Form } from 'informed'
import MaterialFormText from './MaterialFormText'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import Stepper from '@material-ui/core/Stepper'
import Step from '@material-ui/core/Step'
import StepLabel from '@material-ui/core/StepLabel'
import Chip from '@material-ui/core/Chip'
import Button from '@material-ui/core/Button'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import FormHelperText from '@material-ui/core/FormHelperText'
import CircularProgress from '@material-ui/core/CircularProgress'
import SheetClip from 'sheetclip'

const sheetclip = new SheetClip()

const columnNames = {
    name: ['name', 'full name'],
    email: ['email', 'e-mail', 'email address'],
    phone: ['phone', 'phone number'],
    address: ['address', 'street address'],
    state: ['state'],
}

function guessHeaderMap(columns) {
    return _.fromPairs(_.map(columns, c => {
        const normalized = c.toLowerCase()
        const commonName = _.findKey(columnNames, alternatives => alternatives.indexOf(normalized) >= 0)
        if (commonName) {
            return [c, commonName]
        } else {
            return [c, null]
        }
    }))
}

function mapRows(rows, headerMap, tags) {
    const validHeaders = _.pickBy(headerMap, _.isString)
    const compactRows = _.map(rows, row => _.pick(row, _.keys(validHeaders)))

    return _.map(compactRows, row => {

        const mappedObject = _.mapKeys(row, (_v, k) => _.get(headerMap, k, k))

        return {
            ...mappedObject,
            tags: tags,
            id: mappedObject.email
        }
    })

}

function parsePaste({input}) {
    const sheet = sheetclip.parse(input)
    const headers = _.head(sheet)
    const rows = _.tail(sheet)

    const tagKeys = _.filter(headers, key => key.startsWith('tag:'))
    const tags = _.map(tagKeys, key => {
        return key.substr(4)
    })

    const headerMap = guessHeaderMap(_.difference(headers, tagKeys))

    const jsonRows = _.map(rows, row => _.zipObject(headers, row))

    return {
        headerMap,
        tags,
        rows: jsonRows,
    }
}

class ImportDialog extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            stage: 0,
            parsed: {headerMap: {}},
            mapped: []
        }
        this.next = this.next.bind(this)
        this.previous = this.previous.bind(this)
    }

    reset() {
        this.setState({stage: 0})
    }

    next() {
        switch(this.state.stage) {
        case 0:
            this.setState({parsed: parsePaste(this.pasteForm.formContext.formState.values), stage: 1})
            break
        case 1:
            this.setState({stage: 2, mapped: mapRows(this.state.parsed.rows, this.state.parsed.headerMap, this.state.parsed.tags)})
            break
        case 2:
            this.setState({finished: true})
            this.props.onImport(this.state.mapped).then(() => {this.props.onClose();this.setState({finished: false, stage: 0})})
            break
        }
    }

    previous() {
        switch(this.state.stage) {
        case 1:
            this.setState({stage: 0})
            break
        case 2:
            this.setState({stage: 1})
            break
        }
    }

    contentForStage(idx) {
        switch (idx) {
        case 0:
            return (
                <Form ref={r => this.pasteForm = r} onSubmit={values => this.setState({parsed: parsePaste(values), stage: 1})}>
                    <DialogContent>
                        <MaterialFormText field="input" label="Paste in a spreadsheet, including headers." placeholder="Ctrl+V" multiline fullWidth rowsMax={5} rows={5}/>
                        <DialogContentText>
                            <p />
                            <em>What headers can I use?</em>
                            <p>All headers are case insensitive. The following lists acceptable values:</p>
                        </DialogContentText>
                        <ul>
                            <li>Name: Can be any variant of &quot;Name&quot;, &quot;Full Name&quot;</li>
                            <li>Email: Can be any variant of &quot;Email&quot;, &quot;e-mail&quot; &quot;Email Address&quot;</li>
                            <li>Tags: To tag people, include a column that starts with &quot;tag_&quot;. eg &quot;tag_Came to meeting&quot; tags each person in the spreadsheet with &quot;Came to meeting&quot;</li>
                        </ul>
                    </DialogContent>
                </Form>
            )
        case 1: {
            const samples = _.fromPairs(_.map(this.state.parsed.headerMap, (_dst, src) => {
                const sampleRows = _.slice(this.state.parsed.rows, 0, 5)
                return [src, _.map(sampleRows, _.property(src))]
            }))
            const columns = _.map(this.state.parsed.headerMap, (dst, src) => (
                <p>
                    <FormControl fullWidth={true}>
                        <InputLabel htmlFor={name}>{src}</InputLabel>
                        <Select
                            fullWidth={true}  
                            inputProps={{id: name}}
                            value={dst}
                            onChange={evt => this.setState({parsed: {...this.state.parsed, headerMap: {...this.state.parsed.headerMap, [src]: evt.target.value}}})}>
                            <MenuItem value=''><em>None</em></MenuItem>
                            {_.map(_.keys(columnNames), name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                        </Select>
                        <FormHelperText>{_.join(samples[src], ', ')}</FormHelperText>
                    </FormControl>
                </p>
            ))
            return (
                <DialogContent>
                    <DialogContentText>Double check which headers will be used for importing what</DialogContentText>
                    {columns}
                    <p />
                    Tags found:&nbsp;
                    {_.map(this.state.parsed.tags, t => (<Chip key={t} label={t}/>))}
                </DialogContent>
            )
        }
        case 2: 
            if (this.state.finished) {
                return (
                    <DialogContent>
                        <h1>Saving...</h1>
                        <CircularProgress size={200} />
                    </DialogContent>
                )
            } else {
                return (
                    <DialogContent>
                        <p>The following data will be imported:</p>
                        <table>
                            <thead>
                                <tr><th>Name</th><th>E-mail</th><th>Phone number</th><th>Street address</th><th>State</th></tr>
                            </thead>
                            <tbody>
                                {_.map(this.state.mapped, (row, idx) => (
                                    <tr className={idx % 2 ? 'even' : 'odd'}>
                                        <td>{row.name} {_.map(row.tags, t => <Chip label={t} key={t} />)}</td><td>{row.email}</td>
                                        <td>{row.phone}</td><td>{row.address}</td><td>{row.state}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DialogContent>
                )
            }
        }
    }

    render() {
        return (
            <Dialog {..._.omit(this.props, 'onImport')} >
                <DialogTitle>Import Spreadsheet</DialogTitle>
                <Stepper activeStep={this.state.stage}>
                    <Step>
                        <StepLabel>Paste in a spreadsheet</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Review columns</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Save</StepLabel>
                    </Step>
                </Stepper>
                {this.contentForStage(this.state.stage)}
                <DialogActions>
                    <Button onClick={() => {this.reset();this.props.onClose()}} color="secondary">Cancel</Button>
                    <Button variant="contained" onClick={() => this.previous()} color="secondary">Previous</Button>
                    <Button variant="contained" onClick={() => this.next()} color="primary">Next</Button>
                </DialogActions>
            </Dialog>
        )
    }
}

export default ImportDialog
