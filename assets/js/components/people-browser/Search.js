import React from 'react'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { Form, withFormApi } from 'informed'
import faPlusSquare from '@fortawesome/fontawesome-free-solid/faPlusSquare'
import { library as faLibrary } from '@fortawesome/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import MaterialFormSwitch from '../MaterialFormSwitch'
import copy from 'copy-to-clipboard'

faLibrary.add(faPlusSquare)

import BooleanFilter from './BooleanFilter'

const AddButton = withFormApi(props => (
    <Button
        color="primary"
        onClick={() => {
            const curFilter = props.formApi.getState().values.filter || []
            props.formApi.setValues({...(props.formApi.getState().values), filter: [...curFilter, {}]})
        }}>
        <FontAwesomeIcon icon={['fa', 'plus-square']} />
        &nbsp;Add a filter
    </Button>
))

const CopyButton = withFormApi(props => (
    <Button
        color="primary"
        onClick={() => {
            const curFilter = {children: props.formApi.getState().values.filter || [], op: props.formApi.getState().values.op ? 'or' : 'and'}
            const encoded = btoa(JSON.stringify(curFilter))
            const filterUrl = new URL(window.location)
            filterUrl.searchParams.set('filter', encoded)
            copy(filterUrl)
        }}>
        Copy link to filter
    </Button>
))

export const Search = props => {
    const initialFilter = (props.initialFilter || {children: [{}]}).children
    const initialOp = (props.initialFilter || {op: 'and'}).op
    const boolOp = initialOp == 'or'
    return (
        <Form initialValues={{op: boolOp, filter: (initialFilter)}} onValueChange={(values) => {
            if (values.filter && values.filter[0]) {
                props.onFilterChange({
                    op: values.op ? 'or' : 'and', 
                    children: values.filter
                })
            }
        }}>
            {({formApi}) => (
                <Grid container direction="column" alignItems="stretch" spacing={8}>
                    <Grid item>Match All <MaterialFormSwitch field='op'/> Match Any</Grid>
                    {(formApi.getValue('filter') || []).map((_values, idx) => 
                        <Grid key={idx} item>
                            <BooleanFilter index={idx} field={'filter['+idx+']'} />
                        </Grid>
                    )}
                    <Grid item><AddButton /> <CopyButton /></Grid>
                </Grid>
            )}
        </Form>
    )
}

export default Search
