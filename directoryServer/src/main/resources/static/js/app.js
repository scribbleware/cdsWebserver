(function () {

    var app = angular.module('directoryServer', ['ui.bootstrap', 'ngRoute', 'toaster', 'ngAnimate', 'ngSanitize'])
        .filter('friendlyRoleName', friendlyRoleName)
        .filter('getByProperty', getByProperty)
        .filter('trueFalse', trueFalse)
        .directive('toNumber', toNumber)
        .directive('fileModel', fileModel)
        .service('toasterService', toasterService)
        .service('organizationService', organizationService)
        .service('userService', userService)
        .service('settingsService', settingsService)
        .service('schoolCodesService', schoolCodesService)
        .service('endpointService', endpointService)
        .service('messageService', messageService)
        .service('fileUpload', fileUpload)
        .controller('DirectoryController', DirectoryController)
        .controller("NavController", NavController)
        .controller("SettingsController", SettingsController)
        .controller("UploadController", UploadController)
        .controller("MessageController", MessageController)
        .controller("OrgController", OrgController)
        .controller("UserController", UserController)
        .controller("UsersController", UsersController)
        .controller("EndpointController", EndpointController)
        .controller("EndpointSelectorController", EndpointSelectorController)
        .controller("RegistrationController", RegistrationController)
        .config(config)
        .run(['organizationService', function (organizationService) {
            organizationService.initialize();
        }]);


    function config($routeProvider) {
        $routeProvider
            .when("/directory", {
                templateUrl: "organizations",
                controller: "DirectoryController",
                controllerAs: 'orgCtrl'
            })
            .when("/settings", {
                templateUrl: "settings",
                controller: "SettingsController",
                controllerAs: "settingsCtrl"
            })
            .when("/organization/:org_id", {
                templateUrl: "organization-details",
                controller: "OrgController",
                controllerAs: "orgCtrl",
                resolve: {
                    org: ['$route', 'organizationService', function ($route, organizationService) {
                        return organizationService.find($route.current.params.org_id);
                    }]
                }
            })
            .when("/myorg", {
                templateUrl: "organization-details",
                controller: "OrgController",
                controllerAs: "orgCtrl",
                resolve: {
                    org: ['$window', 'organizationService', function ($window, organizationService) {
                        return organizationService.find($window.activeUser.organizationId);
                    }]
                }
            })
            .when("/user/:user_id", {
                templateUrl: "user-details",
                controller: "UserController",
                controllerAs: "userCtrl",
                resolve: {
                    users: ['$route', 'userService', function ($route, userService) {
                        return userService.find($route.current.params.user_id);
                    }]
                }
            })
            .when("/users", {
                templateUrl: "users",
                controller: "UsersController",
                controllerAs: "usersCtrl",
                resolve: {
                    users: ['$window', 'userService', 'organizationService', function ($window, userService, organizationService) {
                        return userService.getUsers(organizationService.getActiveOrg().id);
                    }]
                }
            }).
            when("/messages", {
                templateUrl: "messages",
                controller: "MessageController",
                controllerAs: "messageCtrl"
            })
            .when("/endpoint-selector/:institution_id", {
                templateUrl: "endpoint-selector",
                controller: "EndpointSelectorController",
                controllerAs: "endpointCtrl",
                resolve: {
                    institutions: ['$route', 'organizationService', function ($route, organizationService) {
                        return organizationService.find($route.current.params.institution_id);
                    }],
                    endpoints: ['$route', 'endpointService', function ($route, endpointService) {
                        return endpointService.getEndpointsById($route.current.params.institution_id);

                    }]
                }
            })
            .when("/registration-form", {
                templateUrl: "registration-form",
                controller: "RegistrationController",
                controllerAs: "regCtrl"
            })
            .when("/home", {
                templateUrl: "about"
            })
            .otherwise({
                redirectTo: "home"
            });
    }


    UploadController.$inject = ['fileUpload'];
    function UploadController(fileUpload) {
        var self = this;

        self.uploadFile = uploadFile;
        self.fileToUpload = '';

        function uploadFile(org) {
            console.log("Uploading csv file.");
            fileUpload.uploadFileToUrl(self.fileToUpload, org, '/services/rest/v1/institutions/csv');
        }

    }

    fileUpload.$inject = [ '$http', 'toasterService'] ;

    function fileUpload($http, toasterService) {
        var service = {
            uploadFileToUrl: uploadFileToUrl
        } ;

        return service;

        function uploadFileToUrl(file, org, url){
            var fd = new FormData();
            fd.append('file', file);
            fd.append('org_id', org.id);

            $http.post(url, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .success(function(data){
                toasterService.success("Successfully uploaded file.");
            })
            .error(function(data){
                toasterService.error("Failed to upload file.");
            });
        }

    }

    SettingsController.$inject = ['settingsService'];
    function SettingsController(settingsService) {
        var self = this;

        self.deliveryMethods = [];
        self.documentFormats = [];
        self.getDeliveryMethods = getDeliveryMethods;
        self.getDocumentFormats = getDocumentFormats;

        getDeliveryMethods();


        function getDeliveryMethods() {
            settingsService.getDeliveryMethods().then(function (data) {
                self.deliveryMethods = data;
            });
        }

        function getDocumentFormats() {
            settingsService.getDocumentFormats().then(function (data) {
                self.documentFormats = data;
            });
        }

    }

    MessageController.$inject = ['messageService', 'organizationService'];
    function MessageController(messageService, organizationService) {
        var self = this;
        self.org = organizationService.getActiveOrg();
        self.dismiss = dismissMessage;
        self.messageList = [ ];

        initialize();

        function initialize() {
           messageService.getMessages(self.org.id).then(function(data){
               self.messageList = data;
           });
        }
        function dismissMessage(msg) {
            messageService.dismissMessage(msg).then(function(data){
                //var index = self.messageList.indexOf(msg);
                //if (index > -1) {
                //    self.messageList.splice(index, 1);
                //}
            },function(error){
               //TODO: handle
            }) ;
        }


    }

    RegistrationController.$inject = ['organizationService', 'toasterService', '$window'];
    function RegistrationController(organizationService, toasterService, $window) {
        var self = this;
        self.register = register;
        self.hasOrgType=hasOrgType;
        self.updateOrgType=updateOrgType;
        self.organizationTypes = $window.organizationTypes;

        self.org = {
            name: '',
            organizationTypes: [],
            street: '',
            city: '',
            state: '',
            zip: '',
            telephone: '',
            website: 'http://'
        };

        self.user = {
            name: '',
            title: '',
            phone: '',
            email: '',
            username: '',
            password: ''
        };


        function register() {

            var bag = {
                'user': self.user,
                'organization': self.org
            };

            organizationService.register(bag).then(function (data) {
                    toasterService.success("Thank you for registering.  An email will be sent to " + self.user.email + " when your organization becomes activated.");

                },
                function (response) {
                    toasterService.error(response.message);
                });

            return true;
        }


        function hasOrgType(orgType) {
            return organizationService.hasOrgType(self.org, orgType);
        }


        function updateOrgType($event, orgType) {

            var checkbox = $event.target;

            if (checkbox.checked === true) {
                self.org.organizationTypes.push(orgType);
            } else {
                // remove item
                for (var i = 0; i < self.org.organizationTypes.length; i++) {
                    if (self.org.organizationTypes[i].id == orgType.id) {
                        self.org.organizationTypes.splice(i, 1);
                    }
                }
            }
        };

    }


    UsersController.$inject = ['organizationService', '$window', 'userService', 'users'];
    function UsersController(organizationService, $window, userService, users) {
        var self = this;
        self.users = users;
        self.roles = $window.roles;
        self.isNewAccount = isNewAccount;
        self.getUsers = userService.getUsers;
        self.create = create;
        self.find = find;
        self.delete = deleteUser;
        self.hasRole = userService.hasRole;
        self.save = save;
        self.edit = edit;
        self.showForm = showForm;
        self.updateRole = updateRole;
        self.removeFromModel = removeFromModel;
        self.org = organizationService.getActiveOrg();

        function create() {

            var user = {
                name: '',
                address: '',
                title: '',
                phone: '',
                email: '',
                roles: [],
                username: '',
                password: '',
                organizationId: organizationService.getActiveOrg().id,
                editing: true
            };
            self.users.push(user);

        };


        self.searchInput = '';

        function find() {
            userService.getByName(self.searchInput, organizationService.getActiveOrg().id).then(function (data) {
                self.users = data;
            });
        };

        function removeFromModel(user) {
            var index = self.users.indexOf(user);
            if (index > -1) {
                self.users.splice(index, 1);
            }
        };


        function deleteUser(user) {

            //If it's an existing user we need to delete it on the server
            if (user.hasOwnProperty('id')) {

                userService.deleteUser(user).then(function (data) {
                    self.removeFromModel(user);
                });

            }
            else {
                //it's a new user that hasn't been persisted.
                self.removeFromModel(user);

            }
        };

        function isNewAccount(user) {
            return !user.hasOwnProperty('id');
        }

        function save(user) {

            delete user.editing;

            if (user.hasOwnProperty('id')) {
                //update

                userService.updateUser(user).then(function (data) {
                    console.log("Successfully update user.");
                });

            }
            else {
                //create
                userService.createUser(user).then(function (data) {
                    console.log("Successfully created user with id " + data.id);
                }).catch(function (e) {
                    self.edit(user);
                });
                ;

            }
        };

        function edit(user) {
            user['editing'] = true;
        };


        function showForm(user) {
            return user.hasOwnProperty('editing') && user.editing === true;
        };


        function updateRole($event, role, user) {

            var checkbox = $event.target;

            if (checkbox.checked === true) {
                user.roles.push(role);
            } else {
                // remove item
                for (var i = 0; i < user.roles.length; i++) {
                    if (user.roles[i].id == role.id) {
                        user.roles.splice(i, 1);
                    }
                }
            }
        };


    }

    UserController.$inject = ['$window', 'toasterService', 'userService', 'users'];
    function UserController($window, toasterService, userService, users) {

        if (users.length != 1) {
            toasterService.error("An error occurred while processing a user record: only one record should be provided.");
        }
        var self = this;
        self.user = users[0];
        self.edit = edit;
        self.showForm = showForm;
        self.save = save;
        self.isNewAccount = isNewAccount;
        self.roles = $window.roles;
        self.updateRole = updateRole;
        self.hasRole = hasRole;

        function edit() {
            self.user['editing'] = true;
        }

        function showForm() {
            return self.user.hasOwnProperty('editing') && self.user.editing === true;
        }

        function save() {
            delete self.user.editing;

            userService.updateUser(self.user).then(function (data) {
                console.log("Successfully updated user.");
            });
        }

        function isNewAccount() {
            return !self.user.hasOwnProperty('id');
        }

        function hasRole(role) {
            var found = false;

            for (var i = 0; i < self.user.roles.length; i++) {
                if (self.user.roles[i].id == role.id) {
                    found = true;
                    break;
                }
            }
            return found;
        }


        function updateRole($event, role) {

            var checkbox = $event.target;

            if (checkbox.checked === true) {
                self.user.roles.push(role);
            } else {
                // remove item
                for (var i = 0; i < self.user.roles.length; i++) {
                    if (self.user.roles[i].id == role.id) {
                        self.user.roles.splice(i, 1);
                    }
                }
            }
        };

    }

    EndpointController.$inject = ['endpointService', 'toasterService', 'settingsService'];

    function EndpointController(endpointService, toasterService, settingsService) {
        var self = this;
        self.showForm = showForm;
        self.save = save;
        self.edit = edit;
        self.documentFormats = [];
        self.deliveryMethods = [];

        initialize();

        function initialize() {
            settingsService.getDocumentFormats().then(function (data) {
                self.documentFormats = data;
            });
            settingsService.getDeliveryMethods().then(function (data) {
                self.deliveryMethods = data;
            });
        }


        function showForm(endpoint) {
            return endpoint.hasOwnProperty('editing') && endpoint.editing === true;
        };

        function edit(endpoint) {
            endpoint['editing'] = true;
        }

        function save(endpoint) {

            delete endpoint.editing;

            if (endpoint.hasOwnProperty('id')) {
                endpointService.update(endpoint).then(function (data) {

                    toasterService.success("Successfully updated endpoint.");

                }, function error(data){
                    toasterService.error("Failed to update endpoint.");
                    endpoint.editing = true;
                });

            }
            else {
                //create
                endpointService.create(endpoint).then(function (data) {

                    toasterService.success("Successfully created endpoint.");

                },function error(data){
                    toasterService.error("Failed to create endpoint.");
                    endpoint.editing = true;
                });

            }
        };
    }

    EndpointSelectorController.$inject = ['institutions', 'endpoints', 'organizationService', 'endpointService', 'toasterService', 'userService'];

    function EndpointSelectorController(institutions, endpoints, organizationService, endpointService, toasterService, userService) {
        var self = this;

        self.isAssignedToInstitution = isAssignedToInstitution;
        self.institution = institutions[0];
        self.serviceProviders = [];
        self.selectableEndpoints = [];
        self.addEndpointToInstitution = addEndpointToInstitution;
        self.removeEndpointToInstitution = removeEndpointToInstitution;
        self.endpoints = endpoints;

        initialize();

        function indexOfEndpoint(endpoint, endpoints) {
            for (var i = 0; i < endpoints.length; i++) {
                if (endpoints[i].id === endpoint.id) {
                    return i;
                }
            }
            return -1;
        }

        function isAssignedToInstitution(endpoint) {
            return indexOfEndpoint(endpoint, self.endpoints) != -1;
        };

        function addEndpointToInstitution(endpoint) {

            organizationService.updateEndpoints(self.institution, endpoint, 'ADD').then(function (data) {
                self.endpoints.push(endpoint);
                toasterService.success("Endpoint " + endpoint.address + " has been added to " + self.institution.name);
            });
        };
        function removeEndpointToInstitution(endpoint) {

            organizationService.updateEndpoints(self.institution, endpoint, 'REMOVE').then(function (data) {
                var index = indexOfEndpoint(endpoint, self.endpoints);

                if (index != -1) {
                    self.endpoints.splice(index, 1);
                }
                toasterService.success("Endpoint " + endpoint.address + " has been removed from " + self.institution.name);
            });


        };

        function initialize() {
            organizationService.getServiceProvidersForInstitution(self.institution).then(function (data) {
                self.serviceProviders = data;

                if (userService.hasRoleByName(userService.activeUser, 'ROLE_SYSTEM_ADMIN')) {
                    endpointService.getEndpointsForServiceProviders(self.serviceProviders).then(function (data) {
                        self.selectableEndpoints = data;
                    });
                }
                else {
                    endpointService.getEndpoints(organizationService.getActiveOrg()).then(function (data) {
                        self.selectableEndpoints = data;
                    });
                }

            });

        }
    }

    OrgController.$inject = ['$routeParams', 'organizationService', 'org', 'userService', 'endpointService', 'schoolCodesService', 'toasterService', '$window'];

    function OrgController($routeParams, organizationService, org, userService, endpointService, schoolCodesService, toasterService, $window) {
        var self = this;

        self.org = org[0];  //should be an array with a single element
        self.editOrg = editOrg;
        self.showOrgForm = showOrgForm;
        self.saveOrg = saveOrg;
        self.isEditableByUser = isEditableByUser;
        self.hostedBy = hostedBy;
        self.createEndpoint = createEndpoint;
        self.getEndpoints = getEndpoints;
        self.deleteEndpoint = deleteEndpoint;
        self.endpoints = [];
        self.addSchoolCode = addSchoolCode;
        self.editingSchoolCode = editingSchoolCode;
        self.removeSchoolCode = removeSchoolCode;
        self.saveSchoolCode = saveSchoolCode;
        self.editSchoolCode = editSchoolCode;
        self.setShowServiceProviderForm = setShowServiceProviderForm;
        self.serviceProviders = [];
        self.institutions = [];
        self.hasServiceProvider = hasServiceProvider;
        self.updateSelectedServiceProviders = updateSelectedServiceProviders;
        self.selectedServiceProviders = [];
        self.isMyOrgServiceProviderForInstitution = isMyOrgServiceProviderForInstitution;
        self.selectEndpoint = selectEndpoint;
        self.selectableEndpoints = [];
        self.organizationTypes = $window.organizationTypes;
        self.hasOrgType=hasOrgType;
        self.updateOrgType=updateOrgType;
        self.isServiceProvider=isServiceProvider;
        self.isInstitution=isInstitution;

        self.showServiceProviderForm = false;

        function hasOrgType(orgType) {
            return organizationService.hasOrgType(self.org, orgType);
        }
        function isServiceProvider() {
            return organizationService.isServiceProvider(self.org);
        }
        function isInstitution() {
            return organizationService.isInstitution(self.org);
        }



        function updateOrgType($event, orgType) {

            var checkbox = $event.target;

            if (checkbox.checked === true) {
                self.org.organizationTypes.push(orgType);
            } else {
                // remove item
                for (var i = 0; i < self.org.organizationTypes.length; i++) {
                    if (self.org.organizationTypes[i].id == orgType.id) {
                        self.org.organizationTypes.splice(i, 1);
                    }
                }
            }
        };



        function isMyOrgServiceProviderForInstitution() {

            if (self.org.organizationTypes.indexOf(1) == -1 || userService.activeUser == null) { //if the current org isn't an institution, false
                return false;
            }

            //If current user is system admin, they assign endpoints if the institution
            //has any service providers.
            if (userService.hasRoleByName(userService.activeUser, 'ROLE_SYSTEM_ADMIN')) {
                return true;
            }

            //Otherwise, check if this institution is used by the current user's org as a service provider.

            var myorg = organizationService.getActiveOrg();
            return hasServiceProvider(myorg) && userService.hasRoleByName(userService.activeUser, 'ROLE_ORG_ADMIN');

        }

        function getServiceProviders() {
            organizationService.getServiceProviders().then(function (data) {
                self.serviceProviders = data;
            });
        };

        function setShowServiceProviderForm(show) {

            if (show === true && self.serviceProviders.length == 0) {
                getServiceProviders();
            }
            else if (show == false) {

                organizationService.updateServiceProvidersForInstitition(self.org, self.selectedServiceProviders)
                    .then(function (data) {

                    });
            }
            self.showServiceProviderForm = show;
        }


        function indexOfProvider(provider) {
            for (var i = 0; i < self.selectedServiceProviders.length; i++) {
                if (self.selectedServiceProviders[i].id === provider.id) {
                    return i;
                }
            }

            return -1;
        }


        function hasServiceProvider(provider) {
            return indexOfProvider(provider) != -1;
        }

        function updateSelectedServiceProviders($event, provider) {
            var index = indexOfProvider(provider);

            if (index > -1) {
                self.selectedServiceProviders.splice(index, 1);
            }
            else {
                self.selectedServiceProviders.push(provider);
            }
        }

        getEndpoints();
        getServiceProvidersForInstitution();
        getInstitutionsForServiceProvider();

        function getEndpoints() {
            endpointService.getEndpoints(self.org).then(function (data) {
                self.endpoints = data;
            });
        }

        function getServiceProvidersForInstitution() {

            if (organizationService.isInstitution(self.org)) {
                organizationService.getServiceProvidersForInstitution(self.org).then(function (data) {
                    self.selectedServiceProviders = data;
                });
            }

        }

        function getInstitutionsForServiceProvider() {

            if (organizationService.isServiceProvider(self.org)) {
                organizationService.getInstitutionsForServiceProvider(self.org).then(function (data) {
                    self.institutions = data;
                });
            }

        }

        function editSchoolCode(schoolCode) {
            schoolCode.editing = true;
        }

        function editingSchoolCode(schoolCode) {
            return schoolCode.hasOwnProperty('editing');
        }

        function removeSchoolCodeFromModel(schoolCode) {
            var index = self.org.schoolCodes.indexOf(schoolCode);
            if (index > -1) {
                self.org.schoolCodes.splice(index, 1);
            }
        }

        function removeSchoolCode(schoolCode) {
            if (schoolCode.hasOwnProperty("id")) {
                removeSchoolCodeFromModel(schoolCode);
                schoolCodesService.removeSchoolCode(schoolCode).then(function (data) {
                    delete schoolCode.editing;
                    console.log("Successfully remove school code.");
                });

            }
            else {
                removeSchoolCodeFromModel(schoolCode);
            }
        }

        function saveSchoolCode(schoolCode) {

            //Validate code parameters
            if (schoolCode.code == '' || schoolCode.codeType == '') {
                toasterService.info("Invalid school code.  Please select a code and type and provide the code.");
                return;
            }

            //Also make sure a duplicate code isn't being used.
            for (var i = 0; i < self.org.schoolCodes.length; i++) {
                if (self.org.schoolCodes[i] === schoolCode) {
                    continue;
                }
                if (self.org.schoolCodes[i].codeType === schoolCode.codeType) {
                    toasterService.info("An " + schoolCode.codeType + " is already defined for this school. " +
                        " Please edit the existing " + schoolCode.codeType + " code or choose an unused code type.");
                    return;
                }
            }

            delete schoolCode.editing;

            schoolCodesService.saveSchoolCode(schoolCode).then(function (data) {
                console.log("Successfully created new school code.");
            }, function (error) {
                schoolCode.editing = true;
            });
        }

        function addSchoolCode() {
            var schoolCode = {
                code: '',
                codeType: '',
                organizationId: self.org.id,
                editing: true
            }

            self.org.schoolCodes.unshift(schoolCode);
        }

        function createEndpoint() {
            var endpoint = {
                organization: self.org,
                organizations: [self.org],
                confirmDelivery: false,
                address: '',
                error: false,
                documentFormat: {},
                deliveryMethod: {},
                instructions: '',
                editing: true
            }

            self.endpoints.unshift(endpoint);

        }

        function selectEndpoint() {
            //get provider's endpoints and allow user to select/assign one to the current org.

            if (self.selectedServiceProviders == null || self.selectedServiceProviders == undefined || self.selectedServiceProviders.length == 0) {
                toasterService.info("There are no service providers for this institution.  At least one service provider " +
                    "must be assigned to the institution to use third party endpoints.");
                return;
            }

            if (userService.hasRoleByName(userService.activeUser, 'ROLE_SYSTEM_ADMIN')) {
                endpointService.getEndpointsForServiceProviders(self.selectedServiceProviders).then(function (data) {
                    self.selectableEndpoints = data;
                });
            }
            else {
                endpointService.getEndpoints(organizationService.getActiveOrg()).then(function (data) {
                    self.selectableEndpoints = data;
                });
            }

        }

        function removeEndpointFromModel(endpoint) {
            var index = self.endpoints.indexOf(endpoint);
            if (index > -1) {
                self.endpoints.splice(index, 1);
            }
        }

        function deleteEndpoint(endpoint) {

            //If it's an existing org we need to delete it on the server
            if (endpoint.hasOwnProperty('id')) {

                endpointService.deleteEndpoint(endpoint).then(function (data) {
                    removeEndpointFromModel(endpoint);
                });

            }
            else {
                //it's a new organization that hasn't been persisted.
                removeEndpointFromModel(endpoint);

            }
        }

        function hostedBy(endpoint) {
            return self.org.id == endpoint.organization.id;
        }

        function isEditableByUser() {

            if (userService.activeUser === null) {
                return false;
            }

            if (userService.hasRoleByName(userService.activeUser, 'ROLE_SYSTEM_ADMIN')) {
                return true;
            }

            if (self.org.id === userService.activeUser.organizationId) {
                return userService.hasRoleByName(userService.activeUser, 'ROLE_ORG_ADMIN');
            }

            return false;
        }


        function activate() {

            organizationService.find($routeParams.org_id).then(function (data) {
                self.org = data;
            });
        }


        function editOrg() {
            self.org['editing'] = true;
        };

        function showOrgForm() {
            return self.org.hasOwnProperty('editing') && self.org.editing === true;
        };

        function saveOrg() {

            delete self.org.editing;

            organizationService.updateOrg(self.org).then(function (data) {
                console.log("Successfully update org.");
            });


        };

    }


    NavController.$inject = ['$location'];

    function NavController($location) {
        var self = this;

        self.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }

    DirectoryController.$inject = ['$log', 'organizationService', '$location', 'toasterService', '$window'];

    function DirectoryController($log, organizationService, $location, toasterService, $window) {

        var self = this;

        self.organizations = [];
        self.saveOrg = save;
        self.editOrg = edit;
        self.showOrgForm = showForm;
        self.createOrg = create;
        self.deleteOrg = deleteOrg;
        self.findOrganizations = findOrganizations;
        self.removeOrgFromModel = removeOrgFromModel;
        self.createUser = createUser;
        self.setEnabled = setEnabled;
        self.schoolCodeType = '';
        self.schoolCode = '';
        self.orgName = '';
        self.resetSearch = resetSearch;
        self.isEnabled = true;
        self.updateOrgType=updateOrgType;
        self.hasOrgType=hasOrgType;
        self.organizationTypes = $window.organizationTypes;

        activate();

        function activate() {

            return getOrganizations().then(function () {

                console.log('Activated Organizations View');
            });
        }

        function hasOrgType(orgType, org) {
            return organizationService.hasOrgType(org, orgType);
        }


        function updateOrgType($event, orgType, org) {

            var checkbox = $event.target;

            if (checkbox.checked === true) {
                org.organizationTypes.push(orgType);
            } else {
                // remove item
                for (var i = 0; i < org.organizationTypes.length; i++) {
                    if (org.organizationTypes[i].id == orgType.id) {
                        org.organizationTypes.splice(i, 1);
                    }
                }
            }
        };


        function resetSearch() {
            self.orgName = '';
            self.schoolCode = '';
            self.schoolCodeType = '';
        }


        function getOrganizations() {
            return organizationService.getOrganizations().then(function (data) {
                self.organizations = data;
            });
        }

        function createUser(org) {
            organizationService.setActiveOrg(org);

            $location.path("users");
        };

        function setEnabled(org,enable) {

            organizationService.updateEnabled(org,enable).then(function(data){
                org.enabled = enable;
            },function(data){
                toasterService.error(data);
            })

        };


        function create() {

            var organization = {
                name: '',
                organizationTypes: [],
                street: '',
                city: '',
                state: '',
                zip: '',
                telephone: '',
                website: 'http://',
                editing: true
            };
            self.organizations.push(organization);

        };

        function findOrganizations() {
            organizationService.search(self.orgName, self.schoolCode, self.schoolCodeType, self.isEnabled).then(function (data) {
                self.organizations = data;
            });
        };

        function removeOrgFromModel(org) {
            var index = self.organizations.indexOf(org);
            if (index > -1) {
                self.organizations.splice(index, 1);
            }
        };

        function deleteOrg(org) {

            //If it's an existing org we need to delete it on the server
            if (org.hasOwnProperty('id')) {

                organizationService.deleteOrg(org).then(function (data) {
                    self.removeOrgFromModel(org);
                });

            }
            else {
                //it's a new organization that hasn't been persisted.
                self.removeOrgFromModel(org);

            }
            console.log(org);
        };

        function save(org) {

            delete org.editing;

            if (org.hasOwnProperty('id')) {
                //update

                organizationService.updateOrg(org).then(function (data) {
                    $log.info("Successfully update org.");
                });

            }
            else {
                //create
                organizationService.createOrg(org).then(function (data) {
                    $log.info("Successfully created org with id " + data.id);
                });

            }
        };

        function edit(org) {
            org['editing'] = true;
            console.log(org);
        };


        function showForm(org) {
            return org.hasOwnProperty('editing') && org.editing === true;
        };

    };


    toasterService.$inject = ['toaster'];

    function toasterService(toaster) {
        var service = {
            success: success,
            error: error,
            ajaxInfo: ajaxInfo,
            info: info
        };

        return service;

        function info(text) {
            toaster.pop('warning', "Info", text);
        }

        function success(text) {
            toaster.pop('success', "Success", text);
        }

        function ajaxInfo(responseObject) {
            if (responseObject.hasOwnProperty('error') && responseObject.hasOwnProperty('message')){
                toaster.pop('info', responseObject.error, responseObject.message);
            }

        }

        function error(text) {
            toaster.pop('error', "Error", text);
        }
    }


    endpointService.$inject = ['$http', '$q', '$cacheFactory', 'toasterService'];

    function endpointService($http, $q, $cacheFactory, toasterService) {
        var service = {
            getEndpoints: getEndpoints,
            getEndpointsById: getEndpointsById,
            update: update,
            create: create,
            deleteEndpoint: deleteEndpoint,
            getEndpointsForServiceProviders: getEndpointsForServiceProviders
        }

        return service;

        function getAttributes(input, attr) {
            var output = [];
            for (var i = 0; i < input.length; ++i)
                output.push(input[i][attr]);
            return output;
        }


        function getEndpointsForServiceProviders(serviceProviders) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/endpoints', {
                'params': {'organizationId': getAttributes(serviceProviders, "id")},
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching endpoints for list of service providers.");
            });

            return deferred.promise;
        }


        function deleteEndpoint(endpoint) {
            var deferred = $q.defer();

            $http.delete('/services/rest/v1/endpoints/' + endpoint.id).success(function (data) {
                deferred.resolve(endpoint);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while deleting an organization.");
            });

            return deferred.promise;
        }

        function update(endpoint) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/endpoints/' + endpoint.id, endpoint).success(function (data) {
                deferred.resolve(endpoint);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating an endpoint.");
            });

            return deferred.promise;
        }


        function create(endpoint) {

            var deferred = $q.defer();

            $http.post('/services/rest/v1/endpoints/', endpoint).success(function (data) {
                angular.extend(endpoint, data);
                deferred.resolve(endpoint);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while creating an endpoint.");
            });

            return deferred.promise;
        }


        function getEndpointsById(org_id) {
            var deferred = $q.defer();

            $http.get('/services/rest/v1/endpoints', {
                'params': {'organizationId': [org_id]},
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching endpoints for " + org.name);
            });

            return deferred.promise;
        }

        function getEndpoints(org) {

            return getEndpointsById(org.id);
        }
    }

    messageService.$inject = ['$http', '$q', '$cacheFactory', '$filter', 'toasterService'];

    function messageService($http, $q, $cacheFactory, $filter, toasterService) {

        var service = {
            getMessages: getMessages,
            dismissMessage: dismiss
        };

        return service;

        function dismiss(msg) {
            var deferred = $q.defer();

            $http.put('/services/rest/v1/messages/' + msg.id,{},{
                'params' : {
                    'dismiss': true
                }
            }).success(function (data) {
                deferred.resolve(msg);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while dismissing a message.");
            });

            return deferred.promise;
        }

        function getMessages(orgID) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/messages', {
                'params': {
                    'organization_id': orgID
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching messages.");
            });

            return deferred.promise;
        }
    }

    organizationService.$inject = ['$window', '$http', '$q', '$cacheFactory', '$filter', 'toasterService'];

    function organizationService($window, $http, $q, $cacheFactory, $filter, toasterService) {


        var service = {
            getOrganizations: getOrganizations,
            getById: getById,
            getByName: getByName,
            deleteOrg: deleteOrg,
            updateOrg: updateOrg,
            createOrg: createOrg,
            find: find,
            getActiveOrg: getActiveOrg,
            setActiveOrg: setActiveOrg,
            search: search,
            getServiceProviders: getServiceProviders,
            getServiceProvidersForInstitution: getServiceProvidersForInstitution,
            updateServiceProvidersForInstitition: setServiceProvidersForInstitution,
            getInstitutionsForServiceProvider: getInstitutionsForServiceProvider,
            updateEndpoints: updateEndpoints,
            register: register,
            updateEnabled: updateEnabled,
            initialize: initialize,
            hasOrgType: hasOrgType,
            isServiceProvider: isServiceProvider,
            isInstitution: isInstitution
        };

        return service;

        var activeOrg;

        function initialize() {
            if ($window.activeUser !== null) {
                find($window.activeUser.organizationId).then(function (orgArray) {
                    activeOrg = orgArray[0];

                    getInstitutionsForServiceProvider(activeOrg).then(function (data) {
                        activeOrg.institutions = data;
                    });
                });

            }
        }


        function indexOfType(org, typeName) {
            for (var i = 0; i < org.organizationTypes.length; i++) {
                if (org.organizationTypes[i].name == typeName){
                    return i;
                }

            }
            return -1;
        }

        function isServiceProvider(org) {
            return indexOfType(org, 'Service Provider') != -1;
        }

        function isInstitution(org) {
            return indexOfType(org, 'Institution') != -1;
        }


        function hasOrgType(org, orgType) {

            var found = false;

            for (var i = 0; i < org.organizationTypes.length; i++) {
                if (org.organizationTypes[i].id == orgType.id) {
                    found = true;
                    break;
                }
            }
            return found;
        }

        function getActiveOrg() {
            return activeOrg;
        }

        function setActiveOrg(orgObj) {
            activeOrg = orgObj;
        }

        function updateEndpoints(org, endpoint, operation) {
            var deferred = $q.defer();

            $http.post('/services/rest/v1/organizations/' + org.id, null, {
                'params': {'endpoint_id': endpoint.id, 'operation': operation}
            }).success(function (data) {
                deferred.resolve(endpoint);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating the endpoints for " + org.name + ".");
            });

            return deferred.promise;
        }


        function deleteOrg(org) {
            var deferred = $q.defer();

            $http.delete('/services/rest/v1/organizations/' + org.id).success(function (data) {
                deferred.resolve(org);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while deleting an organization.");
            });

            return deferred.promise;
        }

        function updateOrg(org) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/organizations/' + org.id, org).success(function (data) {
                deferred.resolve(org);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating an organization.");
            });

            return deferred.promise;
        }

        function updateEnabled(org, enabled) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/organizations/' + org.id + '/property', { 'name' : 'enabled', 'value': enabled}).success(function (data) {
                deferred.resolve(org);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating the organization's enabled status.");
            });

            return deferred.promise;
        }


        function createOrg(org) {

            var deferred = $q.defer();

            $http.post('/services/rest/v1/organizations/', org).success(function (data) {
                angular.extend(org, data);
                deferred.resolve(org);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating an organization.");
            });

            return deferred.promise;
        }

        function register(formObject) {

            var deferred = $q.defer();

            $http.post('/registration/', formObject).success(function (data) {
                deferred.resolve(formObject);
            }).error(function (data) {

                deferred.reject(data);
            });

            return deferred.promise;
        }


        function getOrganizations() {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/organizations', {
                params: {'enabled': true},
                cache: false
            }).success(function (data) {
                organizations = data;
                deferred.resolve(organizations);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching organizations.");
            });

            return deferred.promise;
        };

        function getById(id) {
            var org = $filter('getByProperty')('id', id, organizations);

            if (org == null) {
                org = find(id);
            }

            return org;
        };

        function find(id) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/organizations/' + id, {
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the organization.");
            });

            return deferred.promise;
        }

        function getByName(name) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/organizations', {
                'params': {'name': name},
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the organization.");
            });

            return deferred.promise;
        }


        function search(name, organizationCode, organizationCodeType, enabled) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/organizations', {
                'params': {
                    'name': name,
                    'organizationCode': organizationCode,
                    'organizationCodeType': organizationCodeType,
                    'enabled': enabled
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the organization.");
            });

            return deferred.promise;
        }

        function getServiceProviders() {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/organizations', {
                'params': {
                    'type': 'Service Provider'
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the service providers.");
            });

            return deferred.promise;
        }

        function getServiceProvidersForInstitution(institution) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/service-providers', {
                'params': {
                    'institution_id': institution.id
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the service providers.");
            });

            return deferred.promise;
        }

        function getInstitutionsForServiceProvider(org) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/institutions', {
                'params': {
                    'service_provider_id': org.id
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the institutions.");
            });

            return deferred.promise;
        }

        function setServiceProvidersForInstitution(institution, serviceProviders) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/service-providers', serviceProviders, {
                'params': {
                    'institution_id': institution.id,
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating the service providers for institution.");
            });

            return deferred.promise;
        }

    }


    schoolCodesService.$inject = ['$http', '$q', 'toasterService'];

    function schoolCodesService($http, $q, toasterService) {


        var service = {
            saveSchoolCode: createSchoolCode,
            removeSchoolCode: removeSchoolCode,
            updateSchoolCode: updateSchoolCode
        };

        return service;


        function removeSchoolCode(schoolCode) {
            var deferred = $q.defer();

            $http.delete('/services/rest/v1/school-codes/' + schoolCode.id, schoolCode).success(function (data) {
                deferred.resolve(schoolCode);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while deleting a school code.");
            });

            return deferred.promise;
        }

        function updateSchoolCode(schoolCode) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/school-codes/' + schoolCode.id, schoolCode).success(function (data) {
                deferred.resolve(schoolCode);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating a school code.");
            });

            return deferred.promise;
        }


        function createSchoolCode(schoolCode) {

            var deferred = $q.defer();

            $http.post('/services/rest/v1/school-codes/', schoolCode).success(function (data) {
                angular.extend(schoolCode, data);
                deferred.resolve(schoolCode);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while creating a school code.");
            });

            return deferred.promise;
        }
    }

    settingsService.$inject = ['$http', '$q', '$cacheFactory', 'toasterService'];

    function settingsService($http, $q, $cacheFactory, toasterService) {


        var service = {
            getDeliveryMethods: getDeliveryMethods,
            getDocumentFormats: getDocumentFormats
        };

        return service;

        function getDeliveryMethods() {
            var deferred = $q.defer();

            $http.get('/services/rest/v1/delivery-methods', {
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching delivery methods.");
            });

            return deferred.promise;
        }

        function getDocumentFormats() {
            var deferred = $q.defer();

            $http.get('/services/rest/v1/document-formats', {
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching document formats.");
            });

            return deferred.promise;
        }


    }


    /* User Service */

    userService.$inject = ['$window', '$http', '$q', '$cacheFactory', '$filter', 'toasterService'];

    function userService($window, $http, $q, $cacheFactory, $filter, toasterService) {


        var service = {
            getUsers: getUsers,
            getById: getById,
            getByName: getByName,
            deleteUser: deleteUser,
            updateUser: updateUser,
            createUser: createUser,
            find: find,
            hasRole: hasRole,
            hasRoleByName: hasRoleByName,
            activeUser: $window.activeUser
        };

        return service;

        function deleteUser(user) {
            var deferred = $q.defer();

            $http.delete('/services/rest/v1/users/' + user.id).success(function (data) {

                removeUser(user);

                deferred.resolve(user);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while deleting a user.");
            });

            return deferred.promise;
        }

        function hasRole(user, role) {

            var found = false;

            for (var i = 0; i < user.roles.length; i++) {
                if (user.roles[i].id == role.id) {
                    found = true;
                    break;
                }
            }
            return found;
        }

        function hasRoleByName(user, roleName) {
            if (user == null) {
                return false;
            }
            var found = false;

            for (var i = 0; i < user.roles.length; i++) {
                if (user.roles[i].name === roleName) {
                    found = true;
                    break;
                }
            }
            return found;
        }

        function updateUser(user) {

            var deferred = $q.defer();

            $http.put('/services/rest/v1/users/' + user.id, user).success(function (data) {
                deferred.resolve(user);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating a user.");
            });

            return deferred.promise;
        }


        function createUser(user) {

            var deferred = $q.defer();

            $http.post('/services/rest/v1/users/', user).success(function (data) {
                angular.extend(user, data);
                deferred.resolve(user);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while updating a user.");
            });

            return deferred.promise;
        }


        function getUsers(orgID) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/users', {
                'params': {'organizationId': orgID},
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching users.");
            });

            return deferred.promise;
        };

        function getById(id) {
            var user = $filter('getByProperty')('id', id, users);

            if (user == null) {
                user = find(id);
            }

            return user;
        };

        function find(id) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/users/' + id, {
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the user.");
            });

            return deferred.promise;
        }

        function getByName(name, orgID) {

            var deferred = $q.defer();

            $http.get('/services/rest/v1/users', {
                'params': {
                    'organizationId': orgID,
                    'name': name
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching the user.");
            });

            return deferred.promise;
        }

    }


    function toNumber() {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return parseInt(val, 10);
                });
                ngModel.$formatters.push(function (val) {
                    return '' + val;
                });
            }
        }
    }

    function getByProperty() {
        return function (propertyName, propertyValue, collection) {
            var i = 0, len = collection.length;
            for (; i < len; i++) {
                if (collection[i][propertyName] == +propertyValue) {
                    return collection[i];
                }
            }
            return null;
        }
    }


    function trueFalse(){
        return function(text, length, end) {
            if (text) {
                return 'Y';
            }
            return 'N';
        };
    }

    fileModel.$inject = [ '$parse' ];

    function fileModel($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function(){
                    scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    };

    function friendlyRoleName() {
        return function (input) {

            var friendlyName = '';

            switch (input) {
                case 'ROLE_SYSTEM_ADMIN':
                    friendlyName = "System Administrator";
                    break;
                case 'ROLE_ORG_ADMIN':
                    friendlyName = "Organization Administrator";
                    break;
                case 'ROLE_SUPPORT':
                    friendlyName = "Support Technician";
                    break;
                default:
                    friendlyName = "Unknown Role"
            }

            return friendlyName;
        };
    }


})();
