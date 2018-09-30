import React from 'react'
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import { Form, withFormApi } from 'informed'
import faPlusSquare from '@fortawesome/fontawesome-free-solid/faPlusSquare'
import { library as faLibrary } from '@fortawesome/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import MaterialFormSwitch from '../MaterialFormSwitch'

faLibrary.add(faPlusSquare)

import BooleanFilter from './BooleanFilter'

const AddButton = withFormApi(props => (
    <IconButton
        color="primary"
        onClick={() => {
            const curFilter = props.formApi.getState().values.filter || []
            props.formApi.setValues({...(props.formApi.getState().values), filter: [...curFilter, {}]})
        }}>
        <FontAwesomeIcon icon={['fa', 'plus-square']} />
    </IconButton>
))

export const Search = props => {
    return (
        <Form initialValues={{filter: [{}]}} onChange={({values}) => props.filter.set({op: values.op ? 'or' : 'and', children: values.filter})}>
            {({formApi}) => (
                <Grid container direction="column" alignItems="stretch" spacing={8}>
                    <Grid item>Match All <MaterialFormSwitch field='op'/> Match Any</Grid>
                    {(formApi.getValue('filter') || []).map((_values, idx) => 
                        <Grid key={idx} item>
                            <BooleanFilter index={idx} field={'filter['+idx+']'} />
                        </Grid>
                    )}
                    <Grid item><AddButton /> Add a filter</Grid>
                </Grid>
            )}
        </Form>
    )
}

export default Search
