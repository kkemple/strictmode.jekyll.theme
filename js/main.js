;(function($, _, Backbone, lunr) {

    window.blog = window.blog || {};

    var TIMEOUT_ID = 0;

    // this will hold our posts json for search
    var Posts = Backbone.Collection.extend({
        url: '/json/posts.json',
        initialize: function() {
            this.index = lunr(function() {
                this.field('title', {boost: 10});
                this.field('categories', {boost: 5});
                this.field('excerpt');
                this.ref('id')
            });
        },
        parse: function(posts) {
            var self = this;

            // when we get posts, add them to lunr index and break categories into an array
            _(posts).each(function(post) {
                self.index.add(post);

                post.categories = post.categories.replace(/\s+/g, '').split(',');
            });

            // return the posts for the collection
            return posts;
        },
        filter: function(term) {
            var self = this;

            // map over results from lunr search and return the corresponding post model in each result's place
            var results = _(this.index.search(term)).map(function(r) {
                return self.get(r.ref);
            });

            // return the models to place in search results container
            return results;
        }
    });

    // view for each of our search results models returned
    var SearchResult = Backbone.View.extend({
        template: _.template($('#search-result').html().trim()),
        render: function() {
            this.$el.html(this.template(this.model.attributes));
            return this;
        }
    });

    // initialize and fetch our posts collection
    blog.posts = new Posts();
    blog.posts.fetch();

    // empties the search results container, added all new results
    var loadSearchResults = function(models) {
        var $results = $('.results').empty();

        if (!models.length) {
            $results.append($('<p class="note">No results found...</p>'));
        }

        _(models).each(function(m) {
            $results.append(new SearchResult({ model: m }).render().$el);
        });
    };

    // DOM ready callback
    $(function() {
        var $siteSearch = $('.site-search'),
            $showSearch = $('.show-search'),
            $closeSearch = $('.close-search');

        // make the search an offcanvas panel
        blog.$search = $('#search-container').scotchPanel({
            containerSelector: 'body',
            direction: 'right',
            duration: 300,
            transistion: 'ease',
            distanceX: '300px',
            enableEscapeKey: true
        });

        // handle search related events
        $showSearch.on('click', function(e) { e.preventDefault(); $siteSearch.val(''); blog.$search.toggle(); });
        $closeSearch.on('click', function(e) { e.preventDefault(); $siteSearch.val(''); blog.$search.close(); });

        // handle actual search event
        $siteSearch.on('keyup change', function(e) {
            clearTimeout(TIMEOUT_ID);
            var $search = $(this);

            // wait 300ms to fire search, incase user is still typing
            TIMEOUT_ID = setTimeout(function() {
                loadSearchResults(blog.posts.filter($search.val().trim()));
            }, 300);
        });
    });

})(jQuery, _, Backbone, lunr);