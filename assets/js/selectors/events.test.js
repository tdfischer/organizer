import { cookEventWithLocation } from './events'
import moment from 'moment'
import { point } from '@turf/helpers'

const now = moment()

it('should add required properties to the event', () => {
    const eventSkeleton = {
      geo: point([0, 0]),
      timestamp: now,
      end_timestamp: now,
    }
    const evt = cookEventWithLocation(point([0, 0]), 0, eventSkeleton, moment(), [])
    expect(evt).toMatchObject({
        distance: expect.any(Number),
        relevance: expect.any(Number),
        walktime: expect.any(Number),
        checkIn: {
            isNearby: expect.any(Boolean),
            isInPast: expect.any(Boolean),
            hasNotStarted: expect.any(Boolean),
            canCheckIn: expect.any(Boolean),
        }
    })
})
