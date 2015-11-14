let rendering = false

export function render(renderer) {
  return (...args) => {
    rendering = true
    try {
      renderer(...args)
    } finally {
      rendering = false
    }
  }
}

export function isRendering() {
  return rendering
}

export function whenNotRendering(then, otherwise) {
  return function(...args) {
    if (!isRendering()) {
      return then.call(this, ...args)
    } else if (otherwise) {
      return otherwise.call(this, ...args)
    }
  }
}
