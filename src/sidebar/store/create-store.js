'use strict';

/* global process */

const redux = require('redux');
// `.default` is needed because 'redux-thunk' is built as an ES2015 module
const thunk = require('redux-thunk').default;
const { configureStore } = require('redux-starter-kit');

const { createReducer, bindSelectors } = require('./util');

/**
 * Create a Redux store from a set of _modules_.
 *
 * Each module defines the logic related to a particular piece of the application
 * state, including:
 *
 *  - The initial value of that state
 *  - The _actions_ that can change that state
 *  - The _selectors_ for reading that state or computing things
 *    from that state.
 *
 * On top of the standard Redux store methods, the returned store also exposes
 * each action and selector from the input modules as a method which operates on
 * the store.
 *
 * @param {Object[]} modules
 * @param {any[]} initArgs - Arguments to pass to each state module's `init` function
 * @param [any[]] middleware - List of additional Redux middlewares to use.
 */
function createStore(modules, initArgs = [], middleware = []) {
  // Create the initial state and state update function. The "base"
  // namespace is reserved for non-namespaced modules which will eventually
  // be converted over.

  // Namespaced objects for initial states.
  const initialState = {
    base: null,
  };
  // Namespaced reducers from each module.
  const totalReducers = {
    base: null,
  };
  // Namespaced selectors from each module.
  const totalSelectors = {
    base: {
      selectors: {},
      // Tells the bindSelector method to scope the store.
      scopeSelector: true,
    },
  };

  // Temporary list of non-namespaced modules used for createReducer.
  const baseModules = [];

  // Iterate over each module and prep each module's:
  //    1. state
  //    2. reducers
  //    3. selectors
  //
  // Modules that have no namespace get dumped into the "base" namespace.
  //
  modules.forEach(module => {
    if (module.namespace) {
      initialState[module.namespace] = module.init(...initArgs);
      totalReducers[module.namespace] = createReducer(module.update);
      totalSelectors[module.namespace] = {
        selectors: module.selectors,
      };
    } else {
      // No namespace
      totalSelectors.base.selectors = {
        // Aggregate the selectors into a single "base" map
        ...totalSelectors.base.selectors,
        ...module.selectors,
      };
      initialState.base = {
        ...initialState.base,
        ...module.init(...initArgs),
      };
      baseModules.push(module);
    }
  });

  // Create the base reducer for modules that are not opting in for namespacing
  totalReducers.base = createReducer(...baseModules.map(m => m.update));

  // Create the store.
  const store = configureStore({
    reducer: totalReducers,
    middleware: [thunk, ...middleware],
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState: initialState,
  });

  // Temporary wrapper while we use the "base" namespace. This allows getState
  // to work as it did before. Under the covers the state is actually
  // nested inside "base" namespace.
  const getState = store.getState;
  store.getState = () => getState().base;

  // Because getState is overridden, we still need a fallback for the root state
  // for the namespaced modules. They will temporarily use getRootState
  // until all modules are namespaced and then this will be deprecated.
  store.getRootState = () => getState();

  // Add actions and selectors as methods to the store.
  const actions = Object.assign({}, ...modules.map(m => m.actions));
  const boundActions = redux.bindActionCreators(actions, store.dispatch);
  const boundSelectors = bindSelectors(totalSelectors, store.getRootState);

  Object.assign(store, boundActions, boundSelectors);

  return store;
}

module.exports = createStore;
