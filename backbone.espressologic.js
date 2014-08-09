/**
 * Created by Baptiste Gouby on 2014-07-29.
 */
Backbone.EspressoLogic = (function(Backbone, _) {

    var EspressoLogic = {};
    EspressoLogic.Model = Backbone.Model.extend({
        /**
         * Using Espresso Logic, we can provide SQL-like filters to the requested URL
         * We just have to set a filter in the options when creating a model
         */
        initialize: function(attr, opts) {
            if (opts && opts.apiFilter) {
                this.apiFilter = opts.apiFilter;
            }
        },
        /**
         * The URL used to make the request is created.
         * Append the filter to the URL
         */
        url: function() {
            var url = this.urlRoot;
            if (this.apiFilter) {
                url += this.apiFilter;
            }
            return url;
        },
        parse: function(response) {
            // If the response has a status code 201 (Created), the Model data object will be the only item in the 'txsummary' array
            if (response.statusCode && response.statusCode === 201) {
                return response.txsummary[0];
            // Espresso Logic returns an array even if we GET a single entity like '[...]/user/1
            // If the array length is only 1, it returns object
            } else if (response.length === 1) {
                return response[0];
            } else {
                return response;
            }
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
        }
    });

    return EspressoLogic;

})
(Backbone, _);