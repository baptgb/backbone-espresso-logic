/**
 * Created by Baptiste Gouby on 2014-07-29.
 */
var EspressoLogic = {};

Backbone.EspressoLogic = (function(Backbone, _) {

    EspressoLogic.configuration = {
        metadataName: "@api_metadata"
    };

    EspressoLogic.Model = Backbone.Model.extend({
        /**
         * Using Espresso Logic, we can provide SQL-like filters to the requested URL
         * We just have to set a filter in the options when creating a model
         */
        initialize: function(attr, opts) {
            if (opts && opts.apiFilter) this.apiFilter = opts.apiFilter;
            if (attr && attr.modelName) this.modelName = attr.modelName;
        },
        /**
         * The URL used to make the request is created.
         * Append the filter to the URL
         */
        url: function() {
            var url = Backbone.Model.prototype.url.apply(this);
            if (this.apiFilter) {
                url += this.apiFilter;
            }
            return url;
        },
        parse: function(response) {
            // If the response has a status code 201 (Created) or 200 (OK), the Model data object will be the only item in the 'txsummary' array
            if (response.statusCode && (response.statusCode === 201 || response.statusCode === 200)) {
                var metadataName    = EspressoLogic.configuration.metadataName,
                    modelName       = this.modelName.toLowerCase();
                return _.find(response.txsummary, function(entity){
                    var href = entity[metadataName].href;
                    return href.indexOf(modelName) != -1;
                });
                // Espresso Logic returns an array even if we GET a single entity like '[...]/user/1
                // If the array length is only 1, it returns object
            } else if (response.length === 1) {
                return response[0];
            } else {
                return response;
            }
        },
        filterBy: function(filterName, filterValue) {
            this.apiFilter = "?filter="+filterName+"='"+filterValue+"'";
            return this;
        }
    });

    EspressoLogic.Collection = Backbone.Collection.extend({
        initialize: function(attr, opts) {
            if (opts && opts.apiFilter) {
                this.apiFilter = opts.apiFilter;
            }
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