import React from 'react'
import { Model } from '../store'

export class ModelFetcher extends Component {
    constructor(props) {
        super(props)
        this.model = new Model(props.model)
    }

    componentDidMount() {
        this.model.fetchIfNeeded(this.props.id)
    }

    render() {
        return this.children
    }
}
