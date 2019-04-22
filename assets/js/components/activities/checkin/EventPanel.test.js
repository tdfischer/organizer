import React from 'react'
import { shallow } from 'enzyme'
import moment from 'moment'
import { getEventsWithLocation } from '../../../selectors/events'
import { withProvider } from '../../../store/provider'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'

import Immutable from 'immutable'

import { EventList, EventListBase, EventPanel } from './EventPanel'
import SignupForm from './SignupForm'
import EventCard from '../../events/EventCard'
import NoEvents from '../../events/NoEvents'

const modelState = (name, models) => Immutable.fromJS({
  model: {
    models: {
      [name]: models
    }
  }
})

const testState = modelState('events', Immutable.Map({
    1: {id: 1, name: 'Event', timestamp: moment(), end_timestamp: moment(), geo: {lat: 0, lng: 0}}
}))

describe('using eventpanel to sign up for an event', () => {

  const nearbyEvents = getEventsWithLocation(testState)
      .slice(0, 10)
      .toIndexedSeq()

  const createSignup = jest.fn()
  const setIndex = jest.fn()
  const setOpen = jest.fn()
  const setEventID = jest.fn()

  const params = {
    nearbyEvents,
    setOpen,
    setIndex,
    setEventID,
    classes: {},
    createSignup,
    currentUser: {
      email: 'email@localhost'
    },
    hasFetched: true
  }

  test('if they are logged in', () => {
    const root = shallow(<EventPanel {...params} loggedIn={true} />)
    const list = root .find(EventList)
    list.prop('onCheckIn')({id: 1})
    expect(createSignup).toHaveBeenCalledWith({email: 'email@localhost'}, 1)
  })

  test('if they are not logged in', () => {
    const root = shallow(<EventPanel {...params} loggedIn={false} />)
    const list = root.find(EventList)

    // Simulate clicking a check-in button on a card
    list.prop('onCheckIn')({id: 1})
    expect(setOpen).toHaveBeenCalledWith(true)

    // Open the dialog
    root.setProps({...params, loggedIn: false, isOpen: true, eventID: 1})
    // Submit the e-mail dialog
    const dialog = root.find(Dialog)
    const form = dialog.childAt(0)
    form.prop('onSubmit')({email: 'email@localhost'})
    expect(createSignup).toHaveBeenCalledWith({email: 'email@localhost'}, 1)
  })
})


describe('event list', () => {
  const events = getEventsWithLocation(testState)
      .slice(0, 10)
      .toIndexedSeq()
  const onCheckIn = jest.fn()

  const props = {
    onCheckIn,
    events,
    classes: {}
  }
  test('should call onCheckIn when a card\'s check-in button is clicked', () => {
      const root = shallow(<EventListBase {...props} />)
      const card = root.find(EventCard)
      card.prop('onCheckIn')({id: 1})
      expect(onCheckIn).toHaveBeenCalledWith({id: 1})
  })
})
