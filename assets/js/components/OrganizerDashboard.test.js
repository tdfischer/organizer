import React from 'react'
import { shallow } from 'enzyme'
import { OrganizerDashboard } from './OrganizerDashboard'
import Immutable from 'immutable'

it('should render default state', () => {
    shallow(<OrganizerDashboard myBroadcasts={Immutable.List()} classes={{}} upcomingEvents={Immutable.Map()} previousEvents={Immutable.Map()} currentUser={{}} />)
})
