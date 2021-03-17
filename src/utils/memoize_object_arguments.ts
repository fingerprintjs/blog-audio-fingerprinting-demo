import memoizeOne from 'memoize-one'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const shallowEqual = require('shallowequal')

function subShallowEqualArrays(arr1: ArrayLike<unknown>, arr2: ArrayLike<unknown>) {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; ++i) {
    if (!shallowEqual(arr1[i], arr2[i])) {
      return false
    }
  }

  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function memoizeObjectArguments<T extends (...args: any[]) => ReturnType<T>>(fn: T): T {
  return memoizeOne(fn, subShallowEqualArrays)
}
