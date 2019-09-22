'use strict'

;(function () {
  // Закомменитровано для проверки в браузерах, поддерживающих промисы
  // if (window.Promise) return;

  var STATES = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
  };

  function Promiser(executor) {
    var state = STATES.PENDING;
    var value = undefined;
    var resolveHandlers = [];
    var rejectHandlers = [];
    var self = this;

    var resolveWrapper = function(result) {
      resolve(result, self);
    };
    var rejectWrapper = function(error) {
      reject(error, self);
    };

    this._getState = function() {
      return state;
    };

    this._setState = function (val) {
      state = val;
    };

    this._getValue = function() {
      return value;
    };

    this._setValue = function (val) {
      value = val;
    };

    this._getResolveHandlers = function() {
      return resolveHandlers;
    };

    this._getRejectHandlers = function() {
      return rejectHandlers;
    };

    executor(resolveWrapper, rejectWrapper);
  }

  Promiser.prototype.then = function(resolveHandler, rejectHandler) {
    var value = this._getValue();
    var state = this._getState();
    var handlerResult;
    var error;

    if (state === STATES.FULFILLED || state === STATES.REJECTED) {
      if (resolveHandler instanceof Function) {

        if (value instanceof Promiser) {
          handlerResult = value.then(resolveHandler, rejectHandler);
        } else {
          try {
            if (state === STATES.FULFILLED) {
              handlerResult = resolveHandler(value);
            }

            if (state === STATES.REJECTED) {
              handlerResult = rejectHandler(value);
            }

          } catch (e) {
            error = e;
          }
        }
      }

    } else {

      function defaultResolveHandler(arg) {
        return arg;
      }

      function defaultRejectHandler(arg) {
        throw arg;
      }

      this._getResolveHandlers().push(resolveHandler ? resolveHandler : defaultResolveHandler);
      this._getRejectHandlers().push(rejectHandler ? rejectHandler : defaultRejectHandler);
    }

    return new Promiser(function(resolve, reject) {
      if (error) {
        reject(error);
      } else {
        resolve(handlerResult)
      }
    });
  };

  function resolve(result, self) {
    self._setState(STATES.FULFILLED);
    self._setValue(result);

    var resolvers = self._getResolveHandlers();
    var rejecters = self._getRejectHandlers();
    var error;
    var handlerResult;

    for (var i = 0; i < resolvers.length; i++) {

      if (handlerResult instanceof Promiser) {
        handlerResult.then(resolvers[i], rejecters[i]);
        continue;
      }

      try {
        if (error) {
          handlerResult = rejecters[i](error);

        } else {
          handlerResult = resolvers[i](result);
        }
      } catch (e) {
        error = e;
      }
    }
  }

  function reject(error, self) {
    self._setState(STATES.REJECTED);
    self._setValue(error);

    var resolvers = self._getResolveHandlers();
    var rejecters = self._getRejectHandlers();
    var error;
    var handlerResult;

    for (var i = 0; i < rejecters.length; i++) {

      if (handlerResult instanceof Promiser) {
        handlerResult.then(resolvers[i], rejecters[i]);
        continue;
      }

      try {
        if (error) {
          handlerResult = rejecters[i](error);

        } else {
          handlerResult = resolvers[i](result);
        }
      } catch (e) {
        error = e;
      }
    }
  }

  window.Promiser = Promiser;
})();
