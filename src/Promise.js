function Promise(resolver) {
  const [PENDING, FULFILLED, REJECTED] = [0, 1, 2]
  if (!resolver instanceof Function) {
    throw new TypeError('Must be functional handler')
  }
  this.listeners = []
  this.status = PENDING
  this.value = undefined

  this.onFulfilled = (result) => {
    this.value = result
    this.status = FULFILLED
    this.notify(result, 0)
  }

  this.onRejected = (error) => {
    this.value = error
    this.status = REJECTED
    this.notify(error, 1)
  }

  this.notify = (value, index) => {
    this.listeners.map(pair => pair[index]).filter(e => Boolean(e)).forEach(callback => {
      callback(value)
    })
  }

  this.resolve = (result) => {
    if (result instanceof Promise) {
      result.then(this.onFulfilled, this.onRejected)
    } else {
      this.onFulfilled(result)
    }
  }

  this.then = (onFulfill, onReject) => {
    return new Promise((fulfill, reject) => {
      if (this.status === FULFILLED) {
        try {
          const value = onFulfill(this.value)
          return fulfill(value)
        } catch (error) {
          onReject(error)
          reject(error)
        }
      }
      if (this.status === REJECTED) {
        const value = onReject(this.value)
        return reject(value)
      }
      this.listeners.push([onFulfill, onReject])
    })
  }

  this.catch = function (onReject) {
    return new Promise((fulfill, reject) => {
      if (this.status === REJECTED) {
        const value = onReject(this.value)
        return reject(value)
      }
      this.listeners.push([null, reject])
    })
  }

  try {
    resolver(this.resolve, this.onRejected)
  } catch (error) {
    this.onRejected(error)
  }
}

Promise.resolve = function (value) {
  return new Promise(resolve => resolve(value))
}

Promise.reject = function (error) {
  return new Promise((resolve, reject) => reject(error))
}

Promise.all = function (promises) {
  return new Promise((resolve, reject) => {
    const results = []
    let filled = 0
    results.length = promises.length
    promises.forEach((promise, index) => {
      promise.then(
        (result) => {
          results[index] = result
          filled++
          if (filled === results.length) {
            resolve(results)
          }
        },
        (error) => {
          results[index] = error
          reject(error)
        }
      )
    })
  })
}

Promise.allSettled = function (promises) {
  return new Promise(resolve) => {
    const results = []
    let filled = 0
    results.length = promises.length
    promises.forEach((promise, index) => {
      promise.then(
        (result) => {
          console.log(result)
          results[index] = {
            status: 'fulfilled',
            value: result
          }
          filled++
          if (filled === results.length) {
            resolve(results)
          }
        },
        (error) => {
          console.log(error)
          results[index] = {
            status: 'rejected',
            reason: error
          }
          filled++
          if (filled === results.length) {
            resolve(results)
          }
        }
      )
    })
  })
}


module.exports = Promise
