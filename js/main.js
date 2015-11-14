"use strict"
import fluxlet from "fluxlet/development"
import { update, chain, get, path as bakePath } from "fluxlet-immutable"
import $ from "jquery"
import diff from 'virtual-dom/diff'
import patch from 'virtual-dom/patch'
import { v1 as uuid } from 'uuid'
import { root, initRoot } from './templates'
import { render, whenNotRendering } from './render-utils'
import { mapIf } from './map2'
import { bindEditing, bindDragging, bindReady } from './bindings'

// # Setup

export function setup() {

  fluxlet("ooo")
    .state(initialState)
    .actions({
      addBox,
      startEdit,
      updateEdit,
      saveEdit,
      cancelEdit,
      targetLane,
      dragStart,
      drop
    })
    .calculations({
      addEmptyItems
    },{
      renderBoxes,
    },{
      generateViewDiff
    })
    .sideEffects({
      patchDOM
    })
    .init(
      bindEditing,
      bindDragging,
      bindReady
    )
}

// # Initial State

const initialState = {
  model: {
    boxes: {},
    layout: [
      [],[],[],[]
    ]
  },
  trans: { // transient state
    edit: {
      path: null,
      value: null
    },
    target: {
      lane: null
    }
  },
  view: {
    vdom: initRoot(),
    diff: null
  }
}


const createBox = (id) => ({
  id,
  title: "New",
  items: []
})

const createItem = (id) => ({
  id,
  title: null
})

// ## Bindings

// const ENTER_KEY = 13
// const ESC_KEY = 27
//
// function bindEditing(dispatch) {
//   $(document)
//     .on("click", "#add", () => { dispatch.addBox(uuid()) })
//     .on("click", ".editable[data-path]", passData("path", dispatch.startEdit))
//     .on("keydown", ".edit", forKey(ESC_KEY, dispatch.cancelEdit))
//     .on("keydown", ".edit", forKey(ENTER_KEY, dispatch.saveEdit))
//     .on("keyup", ".edit", passVal(dispatch.updateEdit))
//     .on("blur", ".edit", whenNotRendering(() => dispatch.saveEdit()))
// }
//
// function bindDragging(dispatch) {
//   $(document)
//     .on("dragstart", ".box", pass(dispatch.dragStart, data('path'), dataTransfer))
//     .on("dragenter", ".lane", preventDefault(passData("lane", dispatch.targetLane)))
//     .on("drop", ".lane", preventDefault(passData("lane", dispatch.targetLane)))
//     .on("dragend", ".box", () => { dispatch.targetLane(null) })
// }
//
// function bindReady(dispatch) {
//   $(() => {
//     // Do nothing atm
//   })
// }
//
// const forKey = (code, dispatcher) => (event) => {
//   if (event.which === code) {
//     dispatcher()
//   }
// }
//
// const passVal = (dispatcher) => (event) => {
//   dispatcher($(event.target).val())
// }
//
// const passData = (dataKey, dispatcher, ...args) => (event) => {
//   dispatcher($(event.target).closest(`[data-${dataKey}]`).data(dataKey), ...args.map())
// }
//
// const passData = (dataKey, dispatcher, ...args) => (event) => {
//   dispatcher($(event.target).closest(`[data-${dataKey}]`).data(dataKey), ...args.map())
// }
//
// const preventDefault = (handler) => (event) => {
//   event.preventDefault()
//   handler(event)
// }
//
// const startDrag = (event) => {
//   const id = $(event.target).closest('[data-id]').data('id')
//   event.dataTransfer.setData('application/json', { box: id })
// }

// ## Actions

const addBox = (id, index = 0) => chain(
  update(['model','boxes',id], createBox(id)),
  update(['model','layout',index], lane => lane.concat(id))
)

const startEdit = (path) => {
  path = bakePath(path)
  return (state) => {
    if (arrEq(state.trans.edit.path, path)) {
      return state
    }

    if (state.trans.edit.path !== null) {
      return saveAndSetEdit(path, get(path)(state))(state)
    }

    return update('trans.edit', { path, value: get(path)(state) })(state)
  }
}

const updateEdit = (value) => update("trans.edit.value", value)

const saveEdit = {
  when: ({trans:{edit}}) => edit.path !== null,

  then: () => (state) => saveAndSetEdit(null,null)(state)
}

const cancelEdit = () => update('trans.edit', { path: null, value: null })

const saveAndSetEdit = (path, value) => (state) =>
  chain(
    update(state.trans.edit.path, state.trans.edit.value),
    update('trans.edit', { path, value })
  )(state)

const targetLane = (index) => update('trans.target.lane', index)

const dragStart = (path, dataTransfer) => (state) => {
  const data = get(path)(state)
  dataTransfer.effectAllowed = "move"
  dataTransfer.setData("application/json", JSON.stringify(data))
  dataTransfer.setData("text/plain", data.title)
  return state
}

const drop = {
  when: (state, laneIndex, dataTransfer) => state.model.layout[laneIndex] && dataTransfer.getData("application/json"),
  then: (laneIndex, dataTransfer) => {
    const data = JSON.parse(dataTransfer.getData("application/json"))
    return chain(
      removeFromLayout(data && data.id),
      update(['model','layout',laneIndex], lane => data && data.id ? lane.concat(data.id) : lane),
      targetLane(null)
    )
  }
}

const removeFromLayout = (id) => (state) => {
  const [a,b] = findBoxPosition(id, state.model.layout)
  return a >= 0 && b >= 0
    ? update(['model','layout',a], lane => lane.filter((e,i) => i !== b))(state)
    : state
}

const findBoxPosition = (id, layout) => {
  let b = -1
  return [layout.findIndex(lane => (b = lane.findIndex(i => i === id)) >= 0), b]
}

// ## Predicates
// For use in _when_ clauses of calculations and side-effects
// (state, prev) -> boolean

const modelChanged = (state, prev) => state.model !== prev.model
const boxesChanged = (state, prev) => state.model.boxes !== prev.model.boxes
const transChanged = (state, prev) => state.trans !== prev.trans
const vdomChanged = (state, prev) => state.view.vdom !== prev.view.vdom
const diffReady = (state, prev) => state.view.diff !== null && state.view.diff !== prev.view.diff

// ### Predicate combinators
// (?) -> (state, prev) -> boolean

const anyOf = (...predicates) => (...args) => predicates.some(when => when(...args))
const allOf = (...predicates) => (...args) => predicates.every(when => when(...args))
const not = (predicate) => (...args) => !predicate(...args)

// ## Calculations

const addEmptyItems = {
  when: boxesChanged,
  then: update("model.boxes", mapIf(
    ({items}) => items.length === 0 || items[items.length-1].title,
    update('items', items => items.concat(createItem(uuid())))
  ))
}

const renderBoxes = {
  when: anyOf(modelChanged, transChanged),
  then: update("view.vdom", (x, {model, trans}) => root(trans, ['model'])(model))
}

const generateViewDiff = {
  when: vdomChanged,
  then: (state, prev) => update("view.diff", () => diff(prev.view.vdom, state.view.vdom))(state)
}

// ## Request Side Effects


// ## Rendering Side Effects

const patchDOM = {
  when: diffReady,
  then: render(({view:{diff}}) => {
    patch(document.getElementById("root"), diff)

    $('.edit:not(:focus)').focus();
  })
}

// ## Utilities

const arrEq = (path1, path2) => path1 != null && path2 != null &&
  path1.length === path2.length && path1.every((e, i) => e === path2[i])
