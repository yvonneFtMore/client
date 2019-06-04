'use strict';

const angular = require('angular');

const util = require('../../directive/test/util');

const loginControl = require('../login-control');

describe.only('loginControl', function() {
  before(function() {
    angular.module('app', []).component('loginControl', loginControl);
  });

  beforeEach(function() {
    angular.mock.module('app', {});
  });

  context('old controls when a H user is logged in', function() {
    it('shows the complete list of menu options', function() {
      const el = util.createDirective(document, 'loginControl', {
        auth: {
          username: 'someUsername',
          status: 'logged-in',
        },
        newStyle: false,
      });
      console.log(el);
    });
  });
});
