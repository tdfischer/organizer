import React from 'react'
import { CaptainIndex } from './CaptainIndex'
import { shallow } from 'enzyme'

it('should render defaults safely', () => {
    const peopleModel = {
        fetchIfNeeded: jest.fn(),
    }
    const broadcastModel = {
        fetchAll: jest.fn()
    }
    const statesModel = {
        fetchAll: jest.fn()
    }
    const component = shallow(<CaptainIndex people={peopleModel} broadcasts={broadcastModel} states={statesModel} currentUser={{}} classes={{}}/>)
    expect(peopleModel.fetchIfNeeded).toHaveBeenCalledTimes(1)
    expect(broadcastModel.fetchAll).toHaveBeenCalledTimes(1)
    expect(statesModel.fetchAll).toHaveBeenCalledTimes(1)
})
