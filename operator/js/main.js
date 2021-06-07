$(document).ready(function () {
    // isWindow was deprecated in jQuery 3.3.0
    function isWindow(obj) {
        return obj !== null && obj !== undefined && obj === obj.window;
    }

    //
    // jQuery print event callback helpers.
    //   - https://gist.github.com/shaliko/4110822#gistcomment-1543771
    //   - https://www.tjvantoll.com/2012/06/15/detecting-print-requests-with-javascript/
    $.fn.beforeprint = function (callback) {
        return $(this).each(function () {
            if (! isWindow(this)) {
                return;
            }
            if (this.onbeforeprint !== undefined) {
                $(this).on('beforeprint', callback);
            } else if (this.matchMedia) {
                this.matchMedia('print').addListener(callback);
            }
        });
    };
    $.fn.afterprint = function (callback) {
        return $(this).each(function () {
            if (! isWindow(this)) {
                return;
            }
            if (this.onafterprint !== undefined) {
                $(this).on('afterprint', callback);
            } else if (this.matchMedia) {
                $(this).one('mouseover', callback); // https://stackoverflow.com/a/15662720/2653593
            }
        });
    };

    // Search - Don't submit if it's empty
    $('form[name=search_form]').on('submit', function(e) {
        if ($(this).find('input[name=query]').val() == '') {
            e.preventDefault();
        }
    });

    // Check / Uncheck all checkboxes in an input group.
    $(document).on('click', 'a.check_all, button.check_all', function (e) {
        e.preventDefault();

        $(this).parents('.sp-input-group').find('input[type="checkbox"]').prop('checked', true);
    });
    $(document).on('click', 'a.uncheck_all, button.uncheck_all', function (e) {
        e.preventDefault();

        $(this).parents('.sp-input-group').find('input[type="checkbox"]').prop('checked', false);
    });

    // For opening collapsed form containers
    $(document.body).on('click', '.sp-form-container.sp-collapsed', function () {
        $(this).removeClass('sp-collapsed');
        $(this).find('.sp-hidden').not('.sp-translatable-modal').not('.sp-translatable-modal .sp-hidden').removeClass('sp-hidden');
    });

    // Toggle show/hide of the filters area
    $(document.body).on('click', 'button.sp-filter-results', function () {
        $('div.sp-filter-results').show();

        $('#content').animate({
            scrollTop: $('div.sp-filter-results').position().top - 24
        }, 1000);
    });

    /**
     * Global AJAX error handler to catch session timeouts.
     */
    $(document).ajaxError(function sessionHandler(event, xhr, ajaxOptions, thrownError) {
        if (xhr.status == 401) {
            // Logged out, redirect to login
            window.location.replace(laroute.route(
                'operator.sessionexpired',
                {'intended': btoa(window.location.href)}
            ));
            return false;
        } else if (xhr.status == 403) {
            // Ensure this is a session expired message (VerifyCsrfToken middleware)
            var json = JSON.parse(xhr.responseText);
            if (json.message == Lang.get('messages.session_expired')) {
                // Show error and scroll to it
                if (!$('.session-error').is(':visible')) {
                    $('.sp-content-inner').prepend('<div class="session-error sp-alert sp-alert-error">' +
                        Lang.get("messages.session_refresh") + '</div>');
                }
                $('#content').animate({ scrollTop: 0 }, 1000);
                return false;
            }
        }
    });

    // Scrolling for sidebar on desktop
    App.extend('sidebarScrollbar', $('.sp-sidebar-inner'));
    if (typeof $.fn.overlayScrollbars !== 'undefined' && App.sidebarScrollbar.length) {
        /**
         * Initialise overlay scrollbars on the element.
         *
         * @param $elem
         * @returns {jQuery|*}
         */
        var initOverlayScrollbars = function ($elem) {
            return $elem.overlayScrollbars({
                overflowBehavior: {
                    x: 'hidden'
                },
                scrollbars: {
                    autoHide: 'leave'
                }
            });
        };

        /**
         * Destroy the overlay scrollbars instance.
         */
        var destroyOverlayScrollbars = function () {
            if (typeof App.sidebarScrollbar.overlayScrollbars() !== 'undefined') {
                App.sidebarScrollbar.overlayScrollbars().destroy();
            }
        };

        // Initialise overlay scrollbars on the sidebar.
        initOverlayScrollbars(App.sidebarScrollbar);

        // Destroy and reinitialise overlay scrollbars on print event otherwise overflow content is hidden.
        $(window).beforeprint(destroyOverlayScrollbars)
            .afterprint(initOverlayScrollbars.bind(null, App.sidebarScrollbar));
    }

    // For opening/collapsing sidebar boxes
    $(document.body).on('click', 'h3.collapsable', function() {
        $(this).find('.arrow').toggleClass('down up');
        $(this).find('.fa').toggleClass('fa-chevron-down fa-chevron-up');
        $(this).next().toggle(500);
    });

});

function array_map (callback) { // eslint-disable-line camelcase
                                //  discuss at: http://locutus.io/php/array_map/
                                // original by: Andrea Giammarchi (http://webreflection.blogspot.com)
                                // improved by: Kevin van Zonneveld (http://kvz.io)
                                // improved by: Brett Zamir (http://brett-zamir.me)
                                //    input by: thekid
                                //      note 1: If the callback is a string (or object, if an array is supplied),
                                //      note 1: it can only work if the function name is in the global context
                                //   example 1: array_map( function (a){return (a * a * a)}, [1, 2, 3, 4, 5] )
                                //   returns 1: [ 1, 8, 27, 64, 125 ]

    var argc = arguments.length
    var argv = arguments
    var obj = null
    var cb = callback
    var j = argv[1].length
    var i = 0
    var k = 1
    var m = 0
    var tmp = []
    var tmpArr = []

    var $global = (typeof window !== 'undefined' ? window : GLOBAL)

    while (i < j) {
        while (k < argc) {
            tmp[m++] = argv[k++][i]
        }

        m = 0
        k = 1

        if (callback) {
            if (typeof callback === 'string') {
                cb = $global[callback]
            } else if (typeof callback === 'object' && callback.length) {
                obj = typeof callback[0] === 'string' ? $global[callback[0]] : callback[0]
                if (typeof obj === 'undefined') {
                    throw new Error('Object not found: ' + callback[0])
                }
                cb = typeof callback[1] === 'string' ? obj[callback[1]] : callback[1]
            }
            tmpArr[i++] = cb.apply(obj, tmp)
        } else {
            tmpArr[i++] = tmp
        }

        tmp = []
    }

    return tmpArr
}

function emailSelectizeConfig(plugins)
{
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    var config = {
        'restore_on_backspace': {},
        'remove_button': {},
        'max_items': {
            'message': Lang.get('general.show_count_more')
        }
    };

    for (var name in config) {
        if (config.hasOwnProperty(name) && plugins.indexOf(name) === -1) {
            delete config[name];
        }
    }

    return {
        plugins: config,
        delimiter: ',',
        persist: false,
        dropdownParent: 'body',
        placeholder: Lang.get('ticket.enter_email_address'),
        render: {
            item: function(item, escape) {
                return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
            }
        },
        createFilter: function(input) {
            var match = input.match(re);
            if (match) return !this.options.hasOwnProperty(match[0]);

            return false;
        },
        create: function(input) {
            if (re.test(input)) {
                return {
                    value: input,
                    text: input
                };
            }

            return false;
        }
    };
}
