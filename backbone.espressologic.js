/**
 * Created by Baptiste Gouby on 2014-07-29.
 */
var EspressoLogic = {};

Backbone.EspressoLogic = (function(Backbone, _) {

    EspressoLogic.configuration = {
        metadataName: "@api_metadata"
    };

    EspressoLogic.Model = Backbone.Model.extend({

        // Inherit from Backbone.Model
        constructor: function(attr, opts) {
            if (opts && opts.apiFilter) this.apiFilter = opts.apiFilter;
            if (attr && attr.modelName) this.modelName = attr.modelName;
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
            var entity, metadataName = EspressoLogic.configuration.metadataName;

            // If the response has a status code 201 (Created) or 200 (OK), the Model data object will be the only item in the `txsummary` array
            // But in the case you have anything that adds a related entity (like a rule could do)(example: a user and its bank-account entity)
            // The returned `txsummary` will contain the created entities
            // The `modelName` attribute will be used to find the right entity in the array, using the href metadata
            if (response.statusCode && (response.statusCode === 201 || response.statusCode === 200)) {
                if (response.txsummary.length == 1) {
                    entity = response.txsummary[0];
                } else {
                    var modelName = this.modelName.toLowerCase();
                    entity = _.find(response.txsummary, function (entity) {
                        var href = entity[metadataName].href;
                        return href.indexOf(modelName) != -1;
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
        // Inherit from Backbone.Collection
        constructor: function(models, opts) {
            if (opts && opts.apiFilter) this.apiFilter = opts.apiFilter;
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