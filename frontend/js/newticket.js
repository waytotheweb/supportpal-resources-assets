$(document).ready(function () {
    // Date picker
    $('.datepicker').datepicker();

    // Enable hide / show password toggle
    $('input[type=password]').hideShowPassword();

    // Redactor
    $('textarea[name="text"]').redactor();

    // Regex for email
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    // CC email input
    $('select[name="cc[]"]').selectize({
        plugins: ['restore_on_backspace', 'remove_button'],
        delimiter: ',',
        persist: false,
        dropdownParent: 'body',
        createFilter: function (input) {
            var match = input.match(re);
            if (match) {
                return ! this.options.hasOwnProperty(match[0]);
            }

            return false;
        },
        create: function (input) {
            if (re.test(input)) {
                return {
                    value: input,
                    text: input
                };
            }
            return false;
        }
    });

    /**
     * Fetch related articles
     **/
    // Setup before functions
    var typingTimer;
    var doneTypingInterval = 1000;

    // On keyup, start the countdown
    $('input[name="subject"]').on('keyup', function () {
        // Only if self-service module is enabled and setting is on
        if (relatedArticlesEnabled) {
            // Clear any existing timer
            clearTimeout(typingTimer);
            // If there is a subject and it is 3 characters or longer
            if ($(this).val().length > 2) {
                var subject = $(this).val();
                typingTimer = setTimeout(function () {
                    fetchArticles(subject);
                }, doneTypingInterval);
            }
        }
    });

    // User has finished typing, fetch related articles
    function fetchArticles(subject)
    {
        $.get(
            laroute.route('ticket.frontend.ticket.relatedArticles'),
            {
                "subject": subject
            },
            function (response) {
                if (response.status == 'success') {
                    // Show box with view
                    $('.sp-suggested-articles .sp-articles-list').html(response.data.view);
                    $('.sp-suggested-articles').removeClass('sp-hidden');
                } else {
                    // Hide box
                    $('.sp-suggested-articles').addClass('sp-hidden');
                }
            },
            'json'
        ).fail(function () {
            // Hide box
            $('.sp-suggested-articles').addClass('sp-hidden');
        });
    }
});
