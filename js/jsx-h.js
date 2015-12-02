import h from 'virtual-dom/h'

export default function(tag, props, ...children) {
  return h(tag, transformProps(props), children)
}

// Add attribute -> property mapping in here if you want any
const attrMap = {
  "class": "className"
}

function transformProps(props) {
  if (props) {
    Object.getOwnPropertyNames(props).forEach(key => {
      const sub = attrMap[key]

      if (sub) {
        // Apply any attribute to property mappings
        props[sub] = props[key]
        delete props[key]

      } else if (key.startsWith("data-")) {
        // Move any data- attributes into the dataset property
        props.dataset = props.dataset || {}
        props.dataset[key.substr(5)] = props[key]
        delete props[key]

      } else if (key.indexOf("-") !== -1) {
        // Move any other attrs contains a '-' into attributes property
        props.attributes = props.attributes || {}
        props.attributes[key] = props[key]
        delete props[key]
      }
    })
  }
  return props
}
