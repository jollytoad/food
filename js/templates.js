/** @jsx hx */
"use strict"
import hx from './jsx-h'

// ## Templates

export const initRoot = () =>
  <div id="root" class="row"/>

export const root = (t, path) => ({boxes,layout}) =>
  <div id="root" class="row">
    {layout.map(lane(t, path, boxes))}
  </div>

const lane = (t, path, boxes) => (lane, index) =>
  <div class={`lane col-lg-3 ${t.target.lane == index ? 'target' : ''}`} data-lane={index}>
    {lane.map(id => box(t, [...path, 'boxes', id], boxes[id]))}
  </div>

const box = (t, path, box) =>
  <div class="panel panel-default box draggable" key={box.id} draggable={!t.edit.path} data-id={box.id} data-path={makePath(path)}>
    <div class="div panel-heading">
      {editing(t, path, 'title') ?
        <input class="form-control edit" type="text" value={t.edit.value}/> :
        <h3 class="panel-title box-title editable" data-path={makePath(path, 'title')}>{box.title}</h3>}
    </div>
    {boxItems(t, path, box)}
  </div>

const boxItems = (t, path, box) =>
  <ul class="list-group">
    {box.items.map(boxItem(t, [...path, 'items']))}
    {boxTotals(t, path, box)}
  </ul>

const boxTotals = (t, path, box) =>
  <li class="list-group-item form-horizontal">
    {mapObj(t.totals[box.id], boxTotal(t, path, box))}
  </li>

const boxTotal = (t, path, box) => (value, name) =>
  <div class="form-group">
    <label class="col-sm-6 control-label">{name}</label>
    <div class="col-sm-6"><p class="form-control-static">{value}</p></div>
  </div>

const boxItem = (t, path) => (item, index) => {
  const expand = expanded(t, item.id)
  const edit = editing(t, path, index, 'title')

  return <li class="list-group-item clearfix draggable" key={item.id} draggable={!t.edit.path && !item.title}
             data-id={item.id} data-path={makePath(path, index)}>

    {item.title && !edit ?
        toggleBtn(expand) :
        null}

    {edit ?
        <input class="form-control edit" type="text" value={t.edit.value}/> :
        <div class="box-item editable" data-path={makePath(path, index, 'title')}>
          {item.title || <i>add item...</i>}
        </div>}

    {expand ?
        boxItemContent(t, [...path, index, 'content'], item.content) :
        null}
   </li>
}

const boxItemContent = (t, path, content) =>
  <div class="box-item-content">
    {(content === null || typeof content === 'string' ? boxItemTextArea : boxItemForm)(t, path, content, editing(t, path))}
  </div>

const boxItemTextArea = (t, path, content, edit) =>
  <textarea class={`form-control ${edit ? 'edit' : 'editable'}`} readOnly={!edit} data-path={makePath(path)}
    placeholder="Enter yaml data here...">
    {edit ? t.edit.value : content}
  </textarea>

const boxItemForm = (t, path, content) =>
  <div class="form-horizontal">
    {mapObj(content, boxItemFormEntry(t, path))}
  </div>

const boxItemFormEntry = (t, path) => (value, name) =>
  <div class="form-group">
    <label class="col-sm-6 control-label">{name}</label>
    <div class="col-sm-6">
      {editing(t, path, name) ?
        <input class="form-control edit" type="text" value={t.edit.value}/> :
        <p class="form-control-static editable" data-path={makePath(path, name)}>{value}</p>}
    </div>
  </div>

const toggleBtn = expand =>
  <button class={`btn btn-default pull-right box-item-toggle ${expand ? 'collapser' : 'expander'}`}>
    <span class={`glyphicon glyphicon-menu-${expand ? 'up' : 'down'}`}/>
  </button>


// ## Utilities

const editing = (t, path, ...tail) => arrEq(t.edit.path, path.concat(tail))

const expanded = (t, id, defaultState = false) => typeof t.expand[id] === 'boolean' ? t.expand[id] : defaultState

const makePath = (path, ...tail) => path.concat(tail).join('.')

const arrEq = (path1, path2) => path1 != null && path2 != null &&
  path1.length === path2.length && path1.every((e, i) => e == path2[i])

const mapObj = (obj, iter) => Object.getOwnPropertyNames(obj).map(key => iter(obj[key], key, obj))
