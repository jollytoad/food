import { get } from "fluxlet-immutable/get"

// # map
//
// Yet another map implementation. Although this one is specifically designed
// to compliment the update function.
//
//     (iteratee) -> (collection, state) -> collection
//
// where a collection is an array or object and iteratee is the fn called on
// every item in the collection
//
//     (item, state, index) -> item
//
// but the arguments are ordered to support the use of update as the iteratee.
//
// The major distinction between this and the usual map is that it returns
// the same collection if all the returned items are the same.
//
// Example:
//
//     const state = {
//         numbers: [1,2,3,4],
//         multiplier: 2
//     }
//
//     const multiply = (n, {multiplier}) => n * multiplier
//
//     update("numbers", map(multiply))(state)
//
// This returns a new state with a new numbers array that has all items
// multiplied by 2
//
export const map = (iteratee) => doMap(iteratee)

// # mapIf
//
//     (predicate, iteratee) -> (collection, state) -> collection
//
// Works very similar to map, only takes a predicate which is checked against
// each item, if it returns true then the iteratee is called, otherwise the
// item is passed through untouched.
//
// The predicate has the signature:
//
//     (item, state, index) -> boolean
//
// Example:
//
//     const state = {
//         numbers: [-1,2,-3,4],
//         multiplier: 2
//     }
//
//     const positive = n => n > 0
//     const multiply = (n, {multiplier}) => n * multiplier
//
//     update("numbers", mapIf(positive, multiply))(state)
//
// All positive numbers will be multiplied by 2, negative numbers are unchanged
//
export const mapIf = (predicate, iteratee) => doMap(iteratee, undefined, predicate)

// # mapFrom
//
//     (source, iteratee) -> (collection, state) -> collection
//
// Useful for transforming a collection from elsewhere in the state. The source
// arg can be a path to an array within the state, like the path for update:
//
//     "path.1.to.array" or ["path", 1, "to", "array"]
//
// or a function that supplies the collection, the fn is passed the state:
//
//     (state) -> collection
//
// The iteratee function is the same as for map.
//
// Like map, this will not replace the target collection if its items remain
// the same.
//
// Example:
//
//     const state = {
//         numbers: [1,2,3,4],
//         multiplier: 2,
//         results: []
//     }
//
//     const multiply = (n, {multiplier}) => n * multiplier
//
//     update("results", mapFrom("numbers", multiply))(state)
//
// A new state is returned with a new results array containing the
//
export const mapFrom = (source, iteratee) => doMap(iteratee, source)

function doMap(iteratee, pathOrSupplier, predicate) {
  return (target, state) => {
    const source = pathOrSupplier ? get(pathOrSupplier)(state) : target

    let result

    const applyIteratee = (init, add) => (item, index) => {
      const newItem = !predicate || predicate(item, state, index)
          ? iteratee(item, state, index)
          : item

      // On the first different new item contruct a new collection
      if (!result && newItem !== target[index]) {
        result = init(index)
      }

      // Add new item to the new collection if we have one
      if (result) {
        add(newItem, index)
      }
    }

    if (Array.isArray(source)) {
      source.forEach(applyIteratee(
        // Construct the new array from
        // a slice of the target array up to the current index
        index => target.slice(0, index),
        // Push new items into the array
        item => result.push(item)
      ))
    } else {
      const applyObjectIteratee = applyIteratee(
        // Shallow clone the new object from the target
        () => Object.assign(Object.create(Object.getPrototypeOf(target)), target),
        // Add new item to the object
        (item, key) => result[key] = item
      )

      Object.getOwnPropertyNames(source).forEach(key => applyObjectIteratee(source[key], key))
    }

    // If got no different items from the iteratee then result will be
    // undefined so we return the target
    return result || target
  }
}
