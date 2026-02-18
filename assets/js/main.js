(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#page-wrapper'),
		$banner = $('#banner, #banner-about, #banner-articles'),
		$header = $('#header');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 75);
		});

	// Mobile?
		if (browser.mobile)
			$body.addClass('is-mobile');
		else {
			breakpoints.on('>medium', function() {
				$body.removeClass('is-mobile');
			});
			breakpoints.on('<=medium', function() {
				$body.addClass('is-mobile');
			});
		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1500,
			offset: $header.outerHeight()
		});

	// Menu.
		$('#menu')
			.append('<a href="#menu" class="close"></a>')
			.appendTo($body)
			.panel({
				delay: 500,
				hideOnClick: true,
				hideOnSwipe: true,
				resetScroll: true,
				resetForms: true,
				side: 'right',
				target: $body,
				visibleClass: 'is-menu-visible'
			});

	// Header.
		if ($banner.length > 0 && $header.hasClass('alt')) {
			$window.on('resize', function() {
				$window.trigger('scroll');
			});

			$banner.scrollex({
				bottom: $header.outerHeight() + 10,
				terminate: function() { $header.removeClass('alt'); },
				enter: function() { $header.addClass('alt'); },
				leave: function() { $header.removeClass('alt'); }
			});
		}

	/* =========================================================
	   ARTICLES PAGE LOGIC
	========================================================= */
	if ($body.hasClass('page-articles')) {

		const buttons = document.querySelectorAll('.filter-btn');
		const articles = document.querySelectorAll('.article-card');
		const $articleCards = $('.article-card'); 
		let activeFilters = [];

		buttons.forEach(btn => {
			btn.addEventListener('click', function () {
				const filter = this.dataset.filter;

				if (filter === "all") {
					activeFilters = [];
					buttons.forEach(b => b.classList.remove('active'));
					this.classList.add('active');
					applyFilters();
					return;
				}

				this.classList.toggle('active');
				if (activeFilters.includes(filter)) {
					activeFilters = activeFilters.filter(f => f !== filter);
				} else {
					activeFilters.push(filter);
				}

				document.querySelector('[data-filter="all"]').classList.remove('active');
				applyFilters();
			});
		});

		function applyFilters() {
			articles.forEach(article => {
				const country = article.dataset.country;
				const type = article.dataset.type;
				const matches = activeFilters.every(filter =>
					filter === country || filter === type
				);

				if (activeFilters.length === 0 || matches) {
					$(article).fadeIn(300);
				} else {
					$(article).hide();
				}
			});
		}

		// Load More Logic
		var visibleCount = 6;
		function updateVisibility() {
			$articleCards.hide().slice(0, visibleCount).fadeIn(300);
			if (visibleCount >= $articleCards.length) {
				$('#loadMore').hide();
			}
		}

		updateVisibility();

		$('#loadMore').on('click', function (e) {
			e.preventDefault();
			visibleCount += 6;
			updateVisibility();
		});
	}

})(jQuery);
