"use strict"
import h from 'virtual-dom/h'

// ## Templates

export const initRoot = () => h('div#root.row')

export const root = (t, path) => ({boxes,layout}) =>
  h('div#root.row',
    layout.map(lane(t, path, boxes))
  )

const lane = (t, path, boxes) => (lane, index) =>
  h('div.lane.col-lg-3' + (t.target.lane == index ? '.target' : ''), { dataset: { lane: index }},
    lane.map(id => box(t, [...path, 'boxes', id])(boxes[id]))
  )

const box = (t, path) => box =>
  h('div.panel.panel-default.box.draggable', { key: box.id, draggable: !t.edit.path, dataset: { id: box.id, path: makePath(path) }}, [
    h('div.panel-heading',
      editing(t, path, 'title') ? [
          h('input.form-control.edit', { type: 'text', value: t.edit.value })
        ] : [
          h('h3.panel-title.box-title.editable', data(path, 'title'), box.title)
        ]
    ),
    boxItems(t, path)(box)
  ])

const boxItems = (t, path) => box =>
  h('ul.list-group',
    box.items.map(boxItem(t, [...path, 'items']))
  )

const boxItem = (t, path) => (item, index) =>
  h('li.list-group-item.draggable', { key: item.id, draggable: (!t.edit.path && !item.title), dataset: { id: item.id, path: makePath(path, index) }},
    editing(t, path, index, 'title') ? [
        h('input.form-control.edit', { type: 'text', value: t.edit.value })
      ] : [
        h('span.box-item.editable', data(path, index, 'title'), item.title || h('i', 'add item...'))
      ]
  )

const editing = (t, path, ...tail) => arrEq(t.edit.path, [...path, ...tail])

const makePath = (path, ...tail) => [...path, ...tail].join('.')
const data = (path, ...tail) => ({ dataset: { path: makePath(path, ...tail) }})

// ## Utilities

const arrEq = (path1, path2) => path1 != null && path2 != null &&
  path1.length === path2.length && path1.every((e, i) => e == path2[i])
