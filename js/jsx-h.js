import h from 'virtual-dom/h'

export default function(tag, props, ...children) {
  return h(tag, transformProps(props), children)
}

const attrMap = {
  "class": "className"
}

function transformProps(props) {
  if (props) {
    Object.getOwnPropertyNames(props).forEach(key => {
      const sub = attrMap[key]
      if (sub) {
        props[sub] = props[key]
        delete props[key]

      } else if (key.startsWith("data-")) {
        props.dataset = props.dataset || {}
        props.dataset[key.substr(5)] = props[key]
        delete props[key]

      } else if (key.indexOf("-") !== -1) {
        props.attributes = props.attributes || {}
        props.attributes[key] = props[key]
        delete props[key]
      }
    })
  }
  return props
}
