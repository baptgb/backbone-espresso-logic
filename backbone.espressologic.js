/**
 * Created by Baptiste Gouby on 2014-07-29.
 */
var EspressoLogic = {};

Backbone.EspressoLogic = (function(Backbone, _) {

    EspressoLogic.configuration = {
        metadataName: "@api_metadata",
        databasePrefix: "main"
    };

    EspressoLogic.Model = Backbone.Model.extend({

        constructor: function(attr, opts) {
            // Verifying if the api url has been configured
            if (_.isUndefined(EspressoLogic.configuration.url)) { throw new Error("Backbone.EspressoLogic : missing `url` property in library configuration"); }
            var apiUrl = EspressoLogic.configuration.url;

            // Set `modelName` with extend
            // or when creating by passing it to the constructor `attr`
            // or throw an error
            if (attr && attr.modelName) this.modelName = attr.modelName;
            if (_.isUndefined(this.modelName)) { throw new Error("Backbone.EspressoLogic : missing `modelName` property"); }

            // Set the `databasePrefix` if provided or to the default configuration value
            this.databasePrefix = (attr && attr.databasePrefix) || EspressoLogic.configuration.databasePrefix;

            // Define the `urlRoot` property
            // It depends if the Model is an EspressoLogic resource or not
            // A resource doesn't require to have a database prefix added to the url
            // To declare a resource url without `databasePrefix` and avoid a 404 Not Found error
            // Set a `resource` property on the object with extend or in the constructor `attr` argument
            if (attr && attr.resource) this.resource = attr.resource;
            if (this.resource) {
                this.urlRoot = apiUrl + this.modelName;
            } else {
                this.urlRoot = apiUrl + this.databasePrefix +":"+ this.modelName;
            }

            // Set the `apiFilter` property if provided
            if (opts && opts.apiFilter) this.apiFilter = opts.apiFilter;

            // Inherit from Backbone.Model
            Backbone.Model.call(this, attr, opts);
        },

        // The URL used to make the request is created.
        // Append the filter to the URL
        url: function() {
            var url = Backbone.Model.prototype.url.apply(this);
            if (this.apiFilter) {
                url += this.apiFilter;
            }
            return url;
        },

        // Override the `parse` method to adapt to Espresso Logic responses
        parse: function(response) {

            if (_.isUndefined(response)) { return; } // avoid errors on undefined responses ...

            var entity, metadataName = EspressoLogic.configuration.metadataName;

            // If the response has a status code 201 (Created) or 200 (OK), the Model data object will be the only item in the `txsummary` array
            // But in the case you have anything that adds a related entity (like a rule could do)(example: a user and its bank-account entity)
            // The returned `txsummary` will contain the created entities
            // The `modelName` attribute will be used to find the right entity in the array, using the resource api metadata
            if (response.statusCode && (response.statusCode === 201 || response.statusCode === 200)) {
                if (response.txsummary.length == 1) {
                    entity = response.txsummary[0];
                } else {
                    var self = this;
                    entity = _.find(response.txsummary, function (entity) {
                        var resourceName = entity[metadataName].resource;
                        return (resourceName == self.databasePrefix+":"+self.modelName);
                    });
                }
            // Espresso Logic returns an array even if we GET a single entity like [...]/user/1
            // Return the first index if the array length is 1, otherwise the entire array
            } else {
                entity = (response.length == 1) ? response[0] : response;
            }

            return entity;
        },

        // Allows to set a "filter" suffix to the requested url (see `url` method)
        filterBy: function(filterName, filterValue) {
            this.apiFilter = "?filter="+filterName+"='"+filterValue+"'";
            return this;
        }
    });

    EspressoLogic.Collection = Backbone.Collection.extend({

        constructor: function(models, opts) {

            // Set the `databasePrefix` if provided on the model prototype or to the default configuration value
            this.databasePrefix = this.model.prototype.databasePrefix || EspressoLogic.configuration.databasePrefix;

            //Set the `modelName` property using the one given in the related model
            this.modelName = this.model.prototype.modelName;
            if (_.isUndefined(this.modelName)) { throw new Error("Backbone.EspressoLogic : missing `modelName` property"); }

            // Verifying if the api url has been configured
            if (_.isUndefined(EspressoLogic.configuration.url)) { throw new Error("Backbone.EspressoLogic : missing `url` property in library configuration"); }
            // Configure the `urlRoot` property
            this.urlRoot = EspressoLogic.configuration.url + this.databasePrefix +":"+ this.modelName;

            // Define the `apiFilter`
            if (opts && opts.apiFilter) this.apiFilter = opts.apiFilter;

            // Inherit from Backbone.Collection
            Backbone.Collection.call(this, models, opts);
        },

        url: function() {
            var url = this.urlRoot;
            if (this.apiFilter) {
                url += this.apiFilter;
            }
            return url;
        },

        filterBy: function(filterName, filterValue) {
            this.apiFilter = "?filter="+filterName+"='"+filterValue+"'";
            return this;
        }

    });

    return EspressoLogic;

})
(Backbone, _);

module.exports = function(configuration) {
    if (_.isObject(configuration)) {
        var baseConf = EspressoLogic.configuration;
        EspressoLogic.configuration = _.merge(baseConf, configuration);
    }
};