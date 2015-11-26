import h from 'virtual-dom/h'

export default function(tag, props, ...children) {
  return h(tag, transformProps(props), children)
}

function transformProps(props) {
  if (props) {
    if (props.class) {
      props.className = props.class
      delete props.class
    }

    Object.getOwnPropertyNames(props).forEach(key => {
      if (key.startsWith("data-")) {
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