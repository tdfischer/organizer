import React from 'react'
import { shallow } from 'enzyme'
import { EventCard } from './EventCard'
import { point } from '@turf/helpers'

it('should safely render defaults', () => {
    shallow(<EventCard event={{attendees: [], location: {}, geo: point([0, 0])}} />)
})
