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

		const buttons     = document.querySelectorAll('.filter-btn');
		const articles    = document.querySelectorAll('.article-card');
		const $articleCards = $('.article-card');
		const grid        = document.querySelector('.articles-grid');

		// Track one active filter per group separately
		let activeCountry = null;   // e.g. "scotland", null = any
		let activeType    = null;   // e.g. "tips",     null = any

		// Country filters
		const countryFilters = ['scotland', 'alaska', 'usa'];
		// Type filters
		const typeFilters    = ['locations', 'stories', 'tips'];

		// "No results" message — injected once, reused
		let $noResults = $('<p class="articles-no-results">No articles found for this combination.</p>');
		$(grid).after($noResults);
		$noResults.hide();

		// ── Load More ──────────────────────────────────────
		var BATCH = 6;
		var visibleCount = BATCH;

		function getMatchingCards() {
			return $articleCards.filter(function () {
				const country = this.dataset.country || '';
				const type    = this.dataset.type    || '';
				const countryOk = !activeCountry || country === activeCountry;
				const typeOk    = !activeType    || type    === activeType;
				return countryOk && typeOk;
			});
		}

		function applyFilters() {
			// Reset pagination when filters change
			visibleCount = BATCH;

			const $matching = getMatchingCards();

			// Hide all cards first
			$articleCards.hide();

			if ($matching.length === 0) {
				$noResults.fadeIn(200);
				$('#loadMore').hide();
				return;
			}

			$noResults.hide();

			// Show first batch of matching cards
			$matching.slice(0, visibleCount).fadeIn(300);

			// Load More visibility
			if (visibleCount >= $matching.length) {
				$('#loadMore').hide();
			} else {
				$('#loadMore').show();
			}
		}

		// ── Button click handler ───────────────────────────
		buttons.forEach(btn => {
			btn.addEventListener('click', function () {
				const filter = this.dataset.filter;

				if (filter === 'all') {
					// Clear everything
					activeCountry = null;
					activeType    = null;
					buttons.forEach(b => b.classList.remove('active'));
					this.classList.add('active');
					applyFilters();
					return;
				}

				// Determine which group this filter belongs to
				const isCountry = countryFilters.includes(filter);
				const isType    = typeFilters.includes(filter);

				if (isCountry) {
					if (activeCountry === filter) {
						// Clicking the already-active country → deselect
						activeCountry = null;
						this.classList.remove('active');
					} else {
						// Deactivate any other country button
						countryFilters.forEach(c => {
							document.querySelector(`[data-filter="${c}"]`)?.classList.remove('active');
						});
						activeCountry = filter;
						this.classList.add('active');
					}
				} else if (isType) {
					if (activeType === filter) {
						// Clicking the already-active type → deselect
						activeType = null;
						this.classList.remove('active');
					} else {
						// Deactivate any other type button
						typeFilters.forEach(t => {
							document.querySelector(`[data-filter="${t}"]`)?.classList.remove('active');
						});
						activeType = filter;
						this.classList.add('active');
					}
				}

				// If nothing active at all, snap "All" back on
				if (!activeCountry && !activeType) {
					document.querySelector('[data-filter="all"]').classList.add('active');
				} else {
					document.querySelector('[data-filter="all"]').classList.remove('active');
				}

				applyFilters();
			});
		});

		// ── Load More ──────────────────────────────────────
		$('#loadMore').on('click', function (e) {
			e.preventDefault();
			visibleCount += BATCH;

			const $matching = getMatchingCards();
			$matching.slice(0, visibleCount).fadeIn(300);

			if (visibleCount >= $matching.length) {
				$(this).hide();
			}
		});

		// ── Initial render ─────────────────────────────────
		applyFilters();
	}

