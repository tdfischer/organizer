import { store } from './store'
export store
export { default as Model, withModelData } from './model'
export { default as Selectable } from './select'
export { default as Filterable } from './filter'
export { default as history } from './history'
export { default as withProvider } from './provider'

if (module.hot) {
    module.hot.accept('../reducers', () => {
        store.replaceReducer(require('../reducers').default)
    })
}
