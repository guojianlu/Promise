/**
 * 自定义Promise函数模块： IIFE
 */

(function (window) {
  /**
   * Promise构造函数
   * executor 执行器函数会立即执行
   */
  function Promise(executor) {
    this.status = 'pending';
    this.data = undefined;
    this.callbacks = []; // 每个元素的结构：{ onResolved() {}, onRejected() {} }

    const resolve = value => {
      // 如果当前状态不是pending，直接return
      if (this.status !== 'pending') return
      
      // 将状态改为resolved
      this.status = 'resolved';
      //保存value数据
      this.data = value;
      // 如果有待执行的callback，立即异步执行回调函数onResolved
      if (this.callbacks.length) {
        setTimeout(() => {
          this.callbacks.forEach(({ onResolved }) => {
            onResolved(value);
          });
        });
      }
    }

    const reject = reason => {
      // 如果当前状态不是pending，直接return
      if (this.status !== 'pending') return

      // 将状态改为resolved
      this.status = 'rejected';
      //保存reason数据
      this.data = reason;
      // 如果有待执行的callback，立即异步执行回调函数onRejected
      if (this.callbacks.length) {
        setTimeout(() => {
          this.callbacks.forEach(({ onRejected }) => {
            onRejected(reason);
          });
        });
      }
    }

    try {
      executor(resolve, reject);
    } catch (error) { // 如果执行器抛出异常，promise对象变为rejected状态
      reject(error);
    }
  }

  /**
   * @description 指定成功和失败的回调函数
   * @returns 返回一个新的promise对象
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    // 指定默认成功回调(向后继续传值)
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;
    // 指定默认失败回调(实现异常穿透的关键)
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
    
    const self = this;

    return new Promise((resolve, reject) => {
      // 调用指定回调函数，并根据执行结果，改变return的promise的状态
      const handler = callback => {
        try {
          const result = callback(self.data);
          if (result instanceof Promise) {
            // 返回的是promise
            // result.then(
            //   value => resolve(value), // 当result成功时，让return的promise也成功
            //   reason => reject(reason) // 当result失败时，让return的promise也失败
            // );
            result.then(resolve, reject);
          } else {
            // 返回的是非promise值
            resolve(result)
          }
        } catch (error) {
          // 抛出异常
          reject(error);
        }
      };

      if (self.status === 'pending') {
        self.callbacks.push({
          onResolved () {
            handler(onResolved);
          },
          onRejected () {
            handler(onRejected);
          }
        });
      }
  
      if (self.status === 'resolved') {
        setTimeout(() => {
          handler(onResolved);
        });
      }
  
      if (self.status === 'rejected') {
        setTimeout(() => {
          handler(onRejected);
        });
      }
    });
  }

  /**
   * @description 指定失败的回调函数
   * @returns 返回一个新的promise对象
   */
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
  }


  /**
   * Promise函数对象resolve()
   * @returns 返回一个指定结果的成功的promise
   */
  Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
      // value是promise
      if (value instanceof Promise) {
        value.then(resolve, reject);
      } else { // value不是promise
        resolve(value);
      }
    });
  }

  /**
   * Promise函数对象reject()
   * @returns 返回一个指定reason的失败的promise
   */
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }


  /**
   * @description 只有当所有promise都成功的时候才成功，否则只要有一个失败的就失败
   * @returns 返回一个新的promise对象
   */
  Promise.all = function (promises) {
    let resolvedCount = 0;
    const values = new Array(promises.length);
    return new Promise((resolve, reject) => {
      promises.forEach((p, index) => {
        Promise.resolve(p).then(
          value => {
            resolvedCount++; // 成功数量加1
            values[index] = value; // p成功，将成功的value保存到values里

            if (resolvedCount === promises.length) {
              resolve(values);
            }
          },
          reason => { // 只要一个失败了，return的promise就失败了
            reject(reason);
          }
        );
      });
    });
  }


  /**
   * @description 返回一个新的promise对象，状态由第一个完成的promise决定
   * @returns 返回一个新的promise对象
   */
  Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
      promises.forEach((p, index) => {
        Promise.resolve(p).then(
          value => {
            resolve(value);
          },
          reason => {
            reject(reason);
          }
        );
      });
    });
  }


  // 向外暴露Promise函数
  window.Promise = Promise;

})(window)

