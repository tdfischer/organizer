import React from 'react'
import { shallow, render } from 'enzyme'
import { EventCard, CheckInButton, locationDisplay } from './EventCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '@material-ui/core/Button'
import Avatar from '@material-ui/core/Avatar'
import { point } from '@turf/helpers'
import moment from 'moment'

it('should safely render defaults', () => {
    shallow(<EventCard event={{attendees: [], timestamp: moment(), end_timestamp: moment(), location: {}, geo: point([0, 0])}} />)
})

describe('locationDisplay', () => {
    describe('with current location', () => {
        const here = point([1, 0])

        it('should render a location description', () => {
            const eventProps = {
                geo: point([0, 0]),
                location: {
                    raw: 'LOCATION'
                }
            }
            expect(locationDisplay(eventProps, here)).toMatchSnapshot()
        })

        it('should render a location description without event location', () => {
            const eventProps = {
                geo: point([0, 0]),
                location: undefined
            }
            expect(locationDisplay(eventProps, point([1, 0]))).toMatchSnapshot()
        })
    })
    describe('without current location', () => {
        const here = undefined

        it('should render a location description', () => {
            const eventProps = {
                geo: point([0, 0]),
                location: {
                    raw: 'LOCATION'
                }
            }
            expect(locationDisplay(eventProps, here)).toMatchSnapshot()
        })

        it('should render a location description without event location', () => {
            const eventProps = {
                geo: point([0, 0]),
                location: undefined
            }
            expect(locationDisplay(eventProps, point([1, 0]))).toMatchSnapshot()
        })
    })
})

describe('CheckInButton', () => {
    it('should render an arrow when we are far away from an active event', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment(),
                end_timestamp: moment().add(1, 'hour'),
                checkIn: {
                    isNearby: false,
                    isInPast: false,
                    hasNotStarted: false,
                    canCheckIn: false
                },
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: false,
            currentLocation: point([-10, 0]),
        }
        const rendered = shallow(<CheckInButton {...props} />)
        const icon = rendered.find(FontAwesomeIcon)
        expect(icon).toHaveLength(1)
        expect(icon.first().prop('style')).toEqual({transform: 'rotate(45deg)'})
    })

    it('should render a message when it was a long time ago', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment().add(-1, 'month'),
                end_timestamp: moment().add(-1, 'month').add(1, 'hour'),
                checkIn: {
                    isNearby: false,
                    isInPast: true,
                    hasNotStarted: false,
                    canCheckIn: false
                },
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: false,
            currentLocation: point([-10, 0]),
        }
        const rendered = render(<CheckInButton {...props} />)
        expect(rendered.text()).toMatchSnapshot()
    })

    it('should render a message when it is far in the future', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment().add(45, 'minutes'),
                end_timestamp: moment().add(1, 'hour'),
                checkIn: {
                    isNearby: false,
                    isInPast: false,
                    hasNotStarted: true,
                    canCheckIn: false
                },
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: false,
            currentLocation: point([-10, 0]),
        }
        const rendered = render(<CheckInButton {...props} />)
        expect(rendered.text()).toMatchSnapshot()
    })

    it('should allow you to check in when you can check in', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment(),
                end_timestamp: moment().add(1, 'hour'),
                checkIn: {
                    isNearby: true,
                    isInPast: false,
                    hasNotStarted: false,
                    canCheckIn: true
                },
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: false,
            currentLocation: point([0, 0]),
            onCheckIn: jest.fn()
        }
        const rendered = shallow(<CheckInButton {...props} />)
        const button = rendered.find(Button).first()
        button.simulate('click')
        expect(props.onCheckIn).toHaveBeenCalledTimes(1)
    })

    it('should allow you to check in when you have no location but can otherwise check in', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment(),
                end_timestamp: moment().add(1, 'hour'),
                checkIn: {
                    isNearby: true,
                    isInPast: false,
                    hasNotStarted: false,
                    canCheckIn: true
                },
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: false,
            currentLocation: undefined,
            onCheckIn: jest.fn()
        }
        const rendered = shallow(<CheckInButton {...props} />)
        const button = rendered.find(Button).first()
        button.simulate('click')
        expect(props.onCheckIn).toHaveBeenCalledTimes(1)
    })

    it('should say something after youve checked in', () => {
        const props = {
            event: {
                geo: point([0, 0]),
                timestamp: moment(),
                end_timestamp: moment().add(1, 'hour'),
                attendees: []
            },
            currentUser: {
                email: ''
            },
            classes: {},
            checkedIn: true,
            currentLocation: point([0, 0]),
        }
        const rendered = shallow(<CheckInButton {...props} />)
        expect(rendered.find(Avatar)).toHaveLength(1)
    })
})
