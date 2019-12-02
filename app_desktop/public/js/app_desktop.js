angular.module('app_desktop', [
  'ngResource',
  'ui.bootstrap',
]).factory('Application', [
  '$resource', function($resource) {
    return $resource('/desktop/applications');
  }]).factory('UserData', [
  '$resource', function($resource) {
    return $resource('/api/getUserData');
  }]).factory('AvailApplications', [
  '$resource', function($resource) {
    return $resource('/api/getAvailApplications');
  }]).component('applicationBadge', {
  templateUrl: '/desktop/application-badge',
  bindings: {
    application: '<',
    availApplications: '<',
  },
  controller: function() {
    this.$onChanges = function() {
      if (this.availApplications) {
        this.enabled = this.availApplications.indexOf(this.application.id) !=
            -1;
      }
    };
  },
}).component('mediaBadge', {
  templateUrl: '/desktop/media-badge',
  bindings: {
    url: '@',
    img: '@',
    title: '@',
  },
  controller: function() {
  },
}).controller('MainController', [
  'Application',
  'UserData',
  'AvailApplications',
  function(Application, UserData, AvailApplications, ) {
    this.applications = Application.get();
    this.application = {};    
    this.availApplications = AvailApplications.query();
  }]);
