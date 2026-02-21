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
	   ARTICLES PAGE LOGIC — JSON driven
	   Replace the entire articles block in main.js with this.
	========================================================= */
	if ($body.hasClass('page-articles')) {

		const BATCH          = 6;
		const container      = document.getElementById('articlesContainer');
		const noResults      = document.getElementById('noResults');
		const loadMoreWrap   = document.getElementById('loadMoreWrapper');
		const loadMoreBtn    = document.getElementById('loadMore');
		const filterBtns     = document.querySelectorAll('.filter-btn');

		const countryFilters = ['scotland', 'alaska', 'usa'];
		const typeFilters    = ['locations', 'stories', 'tips'];

		let allArticles   = [];
		let activeCountry = null;
		let activeType    = null;
		let visibleCount  = BATCH;

		// ── Helpers ────────────────────────────────────────
		function cap(str) {
			return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
		}

		function tagLabel(country, type) {
			const parts = [cap(type), cap(country)].filter(Boolean);
			return parts.join(' · ');
		}

		// ── Build a single card element ────────────────────
		function buildCard(article) {
			const a = document.createElement('a');
			a.className        = 'article-card';
			a.href             = 'articles/' + article.slug + '/';
			a.dataset.country  = article.country || '';
			a.dataset.type     = article.type    || '';

			a.innerHTML = `
				<div class="image">
					<img src="articles/${article.slug}/hero.jpg"
					     alt="${article.title}"
					     loading="lazy" />
				</div>
				<div class="card-body">
					<span class="card-tag">${tagLabel(article.country, article.type)}</span>
					<h3 class="card-title">${article.title}</h3>
					<p class="card-excerpt">${article.excerpt}</p>
				</div>`;

			return a;
		}

		// ── Build a row section (pair of 2 cards) ──────────
		// nth-child shading applied via inline style since
		// dynamically injected elements don't get nth-child reliably
		function buildRow(cardA, cardB, rowIndex) {
			const shades = [
				'rgba(0,0,0,0.075)',
				'rgba(0,0,0,0.15)',
				'rgba(0,0,0,0.225)'
			];
			const section = document.createElement('section');
			section.className = 'article-row';
			section.style.backgroundColor = shades[rowIndex % 3];

			const inner = document.createElement('div');
			inner.className = 'inner';
			inner.appendChild(cardA);
			if (cardB) inner.appendChild(cardB);
			section.appendChild(inner);
			return section;
		}

		// ── Filter matching ────────────────────────────────
		function getMatching() {
			return allArticles.filter(a => {
				const countryOk = !activeCountry || a.country === activeCountry;
				const typeOk    = !activeType    || a.type    === activeType;
				return countryOk && typeOk;
			});
		}

		// ── Render ─────────────────────────────────────────
		function render() {
			container.innerHTML = '';
			const matching = getMatching();
			const slice    = matching.slice(0, visibleCount);

			if (matching.length === 0) {
				noResults.style.display    = 'block';
				loadMoreWrap.style.display = 'none';
				return;
			}

			noResults.style.display = 'none';

			for (let i = 0; i < slice.length; i += 2) {
				const cardA = buildCard(slice[i]);
				const cardB = slice[i + 1] ? buildCard(slice[i + 1]) : null;
				container.appendChild(buildRow(cardA, cardB, Math.floor(i / 2)));
			}

			loadMoreWrap.style.display = visibleCount >= matching.length ? 'none' : 'block';
		}

		// ── Filter buttons ─────────────────────────────────
		filterBtns.forEach(btn => {
			btn.addEventListener('click', function () {
				const filter = this.dataset.filter;

				if (filter === 'all') {
					activeCountry = null;
					activeType    = null;
					filterBtns.forEach(b => b.classList.remove('active'));
					this.classList.add('active');
					visibleCount = BATCH;
					render();
					return;
				}

				const isCountry = countryFilters.includes(filter);
				const isType    = typeFilters.includes(filter);

				if (isCountry) {
					if (activeCountry === filter) {
						activeCountry = null;
						this.classList.remove('active');
					} else {
						countryFilters.forEach(c => {
							document.querySelector('[data-filter="' + c + '"]')?.classList.remove('active');
						});
						activeCountry = filter;
						this.classList.add('active');
					}
				} else if (isType) {
					if (activeType === filter) {
						activeType = null;
						this.classList.remove('active');
					} else {
						typeFilters.forEach(t => {
							document.querySelector('[data-filter="' + t + '"]')?.classList.remove('active');
						});
						activeType = filter;
						this.classList.add('active');
					}
				}

				if (!activeCountry && !activeType) {
					document.querySelector('[data-filter="all"]').classList.add('active');
				} else {
					document.querySelector('[data-filter="all"]').classList.remove('active');
				}

				visibleCount = BATCH;
				render();
			});
		});

		// ── Load More ──────────────────────────────────────
		loadMoreBtn.addEventListener('click', function (e) {
			e.preventDefault();
			visibleCount += BATCH;
			render();
		});

		// ── Fetch JSON and boot ────────────────────────────
		fetch('articles.json')
			.then(res => {
				if (!res.ok) throw new Error('Could not load articles.json');
				return res.json();
			})
			.then(data => {
				allArticles = data;
				render();
			})
			.catch(err => {
				console.error('Articles failed to load:', err);
				noResults.textContent   = 'Articles could not be loaded.';
				noResults.style.display = 'block';
			});

	}
	

})(jQuery);   

