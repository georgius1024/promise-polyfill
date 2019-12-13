const Promise = require('../src/Promise')

describe('Promise', () => {
  jest.useFakeTimers()

  const delay = (ms, result = 42) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(result)
      }, ms)
    })
  }

  describe('Attributes and methods', () => {
    it('test delay', done => {
      delay(10)
        .then(() => done())
      jest.runTimersToTime(100)
    }, 100)

    it('Throws exception when called without resolver', () => {
      try {
        new Promise()
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError)
      }
    })

    it('Throws exception when called with non-function resolver', () => {
      try {
        new Promise(100)
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError)
      }
    })

    it('Returns object with some methods', () => {
      const p = new Promise(() => {
      })
      expect(p.then).toBeInstanceOf(Function)
      expect(p.then).toHaveLength(2)
      expect(p.catch).toBeInstanceOf(Function)
      expect(p.catch).toHaveLength(1)
    })

    it('Hosts some methods', () => {
      expect(Promise.reject).toBeInstanceOf(Function)
      expect(Promise.resolve).toBeInstanceOf(Function)
      expect(Promise.all).toBeInstanceOf(Function)
      expect(Promise.allSettled).toBeInstanceOf(Function)
    })
  })

  describe('Thenable', () => {
    it('is thenable', done => {
      const p1 = new Promise(resolve => resolve(1))
      const p2 = p1.then(response => {
        console.log('p1 resolved!')
        expect(response).toBe(1)
        return response
      })
      expect(p2).toBeInstanceOf(Promise)
      p2.then(response => {
        console.log('p2 resolved!')
        expect(response).toBe(1)
        done()
      })
      jest.runTimersToTime(10)
    }, 100)

    it('then catches errors too', done => {
      const p1 = new Promise((resolve, reject) => reject(new Error('42')))
      p1.then(response => {
        expect(1).toBe(2)
      }, (error) => {
        console.log('p1 rejected!')
        expect(error).toBeInstanceOf(Error)
        done()
      })
      jest.runTimersToTime(10)
    }, 100)

    it('then catches async errors too', done => {
      const p1 = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('42'))
        }, 1)
      })
      p1.then(response => {
        expect(1).toBe(2)
      }, (error) => {
        console.log('p1 rejected!')
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('42')
        done()
      })
      jest.runTimersToTime(10)
    }, 100)

    it('is chainable with scalars', done => {
      let calls = []
      let counter = 0
      const resolver = (response) => {
        counter += 1
        calls.push(response)
        return counter
      }
      const p = new Promise(resolve => resolve(counter))
      p
        .then(resolver)
        .then(resolver)
        .then(resolver)
        .then(resolver)
        .then(response => {
          expect(response).toBe(4)
          expect(calls).toEqual([0, 1, 2, 3])
          done()
        })
      jest.runTimersToTime(10)
    }, 100)
    it('can resolve after timeout', done => {
      const p = delay(1)
      p
        .then(response => {
          expect(response).toBe(42)
          console.log('after timeout')
          done()
        })

      jest.runTimersToTime(100)
    }, 200)
    it('is chainable with promises', done => {
      let calls = []
      let counter = 0
      const resolver = (response) => {
        calls.push(response)
        counter += 1
        return new Promise(resolve => resolve(counter))
      }
      const p = new Promise(resolve => resolve(counter))
      p
        .then(resolver)
        .then(resolver)
        .then(resolver)
        .then(resolver)
        .then(response => {
          expect(response).toBe(4)
          expect(calls).toEqual([0, 1, 2, 3])
          done()
        })
      // console.log(p)
      jest.runTimersToTime(100)
    }, 200)
  })

  describe('Catchable', () => {
    it('is catchable', done => {
      const p1 = new Promise((resolve, reject) => reject(new Error('Error')))
      const p2 = p1.catch(error => {
        expect(error).toBeInstanceOf(Error)
        done()
      })
      expect(p2).toBeInstanceOf(Promise)
      jest.runTimersToTime(10)
    }, 100)

    it('catch is chainable', done => {
      const p1 = new Promise((resolve, reject) => reject(new Error('Error')))
      const p2 = p1.catch(error => {
        console.log('p2 catch')
        expect(error).toBeInstanceOf(Error)
        return new TypeError('Error')
      })
      const p3 = p2.catch(error => {
        console.log('p3 catch')
        expect(error).toBeInstanceOf(TypeError)
        done()
      })
      delay(100)
        .then(() => done())
      jest.runTimersToTime(100)
    }, 110)

    it('catches exceptions', done => {
      function error() {
        throw new Error('Error')
      }

      const p = Promise.resolve(1)
      p
        .then(response => {
          error()
        })
        .catch(error => {
          console.log('catches exception')
          expect(error).toBeInstanceOf(Error)
          done()
        })

      jest.runTimersToTime(100)
    })

    it('catches async exceptions', done => {
      function error() {
        return new Promise(resolve => {
          setTimeout(() => {
            throw new Error('Error')
          }, 1)
        })
      }

      const p = Promise.resolve(1)
      p
        .then(response => {
          throw new Error('Error')
        })
        .catch(error => {
          console.log('catches exception')
          expect(error).toBeInstanceOf(Error)
          done()
        })
    })
  })

  describe('Promise.all', () => {
    it('Runs simple promises', done => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]
      Promise
        .all(promises)
        .then(response => {
          expect(response).toEqual([1, 2, 3])
          done()
        })
      jest.runTimersToTime(10)
    }, 100)

    it('Runs async promises', done => {
      const promises = [
        delay(1, 3),
        delay(2, 2),
        delay(3, 1)
      ]
      Promise
        .all(promises)
        .then(response => {
          expect(response).toEqual([3, 2, 1])
          done()
        })
      jest.runTimersToTime(10)
    }, 100)

    it('Catches exceptions', done => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.reject(new Error('42'))
      ]
      Promise.all(promises)
        .then(() => {
          expect(1).toEqual(2)
        },
          (error) => {
            expect(error.message).toEqual('42')
            done()
          })
      jest.runTimersToTime(100)
    }, 100)
  })

  describe('Promise.allSettled', () => {
    it('Runs simple promises', done => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]
      Promise
        .allSettled(promises)
        .then(response => {
          expect(response).toEqual([
            {
              status: 'fulfilled',
              value: 1
            },
            {
              status: 'fulfilled',
              value: 2
            },
            {
              status: 'fulfilled',
              value: 3
            }
          ])
          done()
        })
      jest.runTimersToTime(10)
    }, 100)

    it('Catches exceptions', done => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.reject(new Error('42'))
      ]
      Promise
        .allSettled(promises)
        .then(response => {
          console.log(response)
          expect(response.map(e => e.status)).toEqual([
            'fulfilled',
            'fulfilled',
            'rejected'
          ])
          done()
        })
      jest.runTimersToTime(10)
    }, 100)

  })
})