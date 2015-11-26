"use strict"
import $ from "jquery"
import { v1 as uuid } from 'uuid'
import { isRendering } from "./render-utils"

// ## Bindings

const ENTER_KEY = 13
const ESC_KEY = 27

export function bindEditing({ addBox, startEdit, updateEdit, cancelEdit, saveEdit }) {
  $(document)
    .on("click", "#add", dispatch(addBox, () => uuid()))
    .on("click", ".editable[data-path]", dispatch(startEdit, data('path')))
    .on("keydown", ".edit", dispatchIf(keyIs(ESC_KEY), cancelEdit))
    .on("keydown", ".edit", dispatchIf(keyIs(ENTER_KEY), saveEdit))
    .on("keyup", ".edit", dispatch(updateEdit, val))
    .on("blur", ".edit", dispatchIf(notRendering, saveEdit))
}

export function bindDragging({ dragStart, targetLane, drop }) {
  $(document)
    .on("dragstart", ".draggable[data-path]", dispatch(dragStart, data('path'), dataTransfer))
    .on("dragenter", "[data-lane]", dispatch(targetLane, data('lane'), preventDefault, dropEffect("move")))
    .on("dragover", "[data-lane]", preventDefault)
    .on("drop", "[data-lane]", dispatch(drop, data('lane'), dataTransfer, preventDefault))
    .on("dragend", ".draggable", dispatch(targetLane, null))
}

export function bindToggles({ expand, collapse }) {
  $(document)
    .on("click", ".expander", dispatch(expand, data('id'), preventDefault))
    .on("click", ".collapser", dispatch(collapse, data('id'), preventDefault))
}

export function bindReady() {
  $(() => {
    // Do nothing atm
  })
}

// ### Event helpers

const dispatchIf = (condition, dispatcher, ...args) => (event) => {
  if (typeof condition === 'function' ? condition(event) : condition) {
    dispatcher(...args.map(a => typeof a === 'function' ? a(event) : a).filter(a => a !== undefined))
  }
}

const dispatch = dispatchIf.bind(null, true)

const logEvent = (event) => { console.log(e) }

// ### Argument helpers

const data = (key) => (event) => $(event.target).closest(`[data-${key}]`).data(key)

const val = (event) => $(event.target).val()

const dataTransfer = (event) => event.dataTransfer || event.originalEvent.dataTransfer

// ### Conditions

const keyIs = (code) => (event) => event.which === code

const notRendering = (event) => !isRendering()

// ### Event modifiers

const preventDefault = (event) => {
  event.preventDefault()
}

const dropEffect = (effect) => (event) => {
  dataTransfer(event).dropEffect = effect
}
