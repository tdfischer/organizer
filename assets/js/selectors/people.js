import { getCurrentUser } from './auth'
import { createSelector } from 'reselect'
import { Model } from '../store'

const People = new Model('people')

export const getPeople = state => (
    People.immutableSelect(state)
)

export const getCurrentPerson = createSelector(
    getCurrentUser,
    getPeople,
    (currentUser, allPeople) => (
        currentUser ? allPeople.get(currentUser.email) : undefined
    )
)
