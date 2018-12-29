import React from 'react'
import { shallow } from 'enzyme'
import { EventList, EventCarousel } from './EventList'
import EventCard from './EventCard'
import Immutable from 'immutable'

it('should render default state', () => {
    const props = {
        upcomingEvents: Immutable.Map()
    }
    shallow(<EventList {...props} />)
})

it('should render a bunch of event cards', () => {
    const props = {
        upcomingEvents: Immutable.Map({
            0: Immutable.List([
                {id: 1}
            ])
        })
    }
    const rendered = shallow(<EventList {...props} />)
    expect(rendered.find(EventCarousel).dive().find(EventCard)).toHaveLength(1)
})
