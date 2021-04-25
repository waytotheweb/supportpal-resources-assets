/**
 * Functions to handle a specific article.
 *
 * @param parameters
 * @constructor
 */
function Article(parameters)
{
    "use strict";

    /**
     * Array of AJAX instances, for each type dropdown.
     *
     * @type {Array}
     */
    var xhr = [];

    /**
     * Initialise the type and category drop-downs for a given ID.
     *
     * @param id
     */
    this.initDropdowns = function (id)
    {
        var self = this;

        // Initialise the visible type drop-down.
        $('select[name="category['+id+'][type]"]').selectize({
            plugins: ['disableDelete'],
            onChange: function(value) {
                // Hide the URL/views for this type
                this.$input.parents('.sp-form-container').find('.type-url, .type-views').remove();

                // Only carry on if we have a type
                if (!value.length) return;

                // Get the category selectize instance.
                var select_categories = this.$input.parents(self.getClassName()).find('select[name$="[categories][]"]');
                if (select_categories.length == 0 || typeof select_categories[0].selectize === 'undefined') {
                    void 0;

                    return;
                }

                // Reset form validation, the slug may now be valid.
                $('form.validate').validate().resetForm();

                // Load the categories for the selected self-service type.
                select_categories = select_categories[0].selectize;

                select_categories.disable();
                select_categories.clearOptions();
                select_categories.load(function(callback) {
                    xhr[id] && xhr[id].abort();
                    xhr[id] = $.ajax({
                        url: laroute.route('selfservice.operator.type.categories', {'operatorSelfserviceType': value}),
                        success: function(res) {
                            select_categories.enable();
                            callback(res.data);
                        },
                        error: function() {
                            callback();
                        }
                    })
                });
            }
        });

        // Initialise and disable the category drop-down (we will enable it once the user selects a type).
        var $select_category = $('select[name="category['+id+'][categories][]"]').selectize({
            plugins: ['remove_button'],
            valueField: 'id',
            labelField: 'name',
            searchField: 'name',
            create: false,
            maxItems: null,
            placeholder: Lang.get("selfservice.associate_category"),
            render: {
                item: function(item, escape) {
                    return '<div class="item">' + escape(item.name) +
                        '<span class="sp-description">' + escape(item.hierarchy) + '</span>' +
                        '</div>';
                },
                option: function(item, escape) {
                    return '<div>' + escape(item.name) +
                        '<span class="sp-description">' + escape(item.hierarchy) + '</span>' +
                        '</div>';
                }
            }
        });
        $select_category[0].selectize.disable();
    };

    /**
     * Initialise a new type / category drop-down.
     *
     * @returns void
     */
    this.addNewCategory = function ()
    {
        // Clone the DOM.
        var index = addNewItem(this.getClassName());

        // Initialise the type and category drop-downs with selectize.
        this.initDropdowns(index);
    };

    /**
     * Name of the class.
     *
     * @returns {string}
     */
    this.getClassName = function ()
    {
        return parameters.className;
    }
}

$(document).ready(function() {

    /**
     * Initialise a new article.
     *
     * @type {Article}
     */
    var article = new Article({ 'className': '.category' });

    /*
     * Add a new type selection
     */
    $('#add-type').on('click', function() {
        article.addNewCategory();
    });

    /*
     * Remove an type selection
     */
    $('#categories').on('click', '.remove-button', function() {
        $(this).parents(article.getClassName()).remove();

        // If it was the last one, add an empty form back in
        if ($(article.getClassName()).length == 1) {
            article.addNewCategory();
        }
    });

    // Initialise the visible type and category drop-down's.
    $('select[name^="category["]').each(function () {
        var results = $(this).prop('name').match(/^\w+\[(\d+)]\[\w+]\[]$/);

        if (results !== null && results.length == 2) {
            article.initDropdowns(results[1]);

            // Enable the category dropdowns... initDropdowns sets them to be disabled.
            if ($('select[name="category['+results[1]+'][type]"]')[0].selectize.getValue() !== '') {
                this.selectize.enable();
            }
        }
    });

    // Initialise redactor.
    $('.section-items').find('textarea[name^="text"]').redactor(opts);

    /*
     * Initialise article tags.
     */
    $('select[name="tag[]"]').selectize({
        plugins: ['remove_button'],
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        create: tagPermission ? true : false,
        createFilter: function(input) {
            return input.length <= 45;
        },
        maxItems: null,
        placeholder: Lang.get("selfservice.associate_tag")
    });

    // Only show published_at when article is published.
    $('#toggle_published').on('change', function () {
        var $published_at = $('.published_at');
        if (this.checked) {
            $published_at.removeClass('sp-hidden');
            $published_at.find(':input').prop('disabled', false);

            // If the article is currently not published
            if ($published_at.hasClass('not-published')) {
                // Update the pickers to the current date and time.
                var date = new Date();
                $published_at.find('.datepicker')[0]._flatpickr.setDate(date);
                $published_at.find('.timepicker')[0]._flatpickr.setDate(date);

                // Remove class so it doesn't automatically get set if it's toggled again
                $published_at.removeClass('not-published');
            }
        } else {
            $published_at.addClass('sp-hidden');
            $published_at.find(':input').prop('disabled', 'disabled');
        }
    });

});
