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

		function cap(str) {
			return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
		}

		function tagLabel(country, type) {
			const parts = [cap(type), cap(country)].filter(Boolean);
			return parts.join(' · ');
		}

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

		function getMatching() {
			return allArticles.filter(a => {
				const countryOk = !activeCountry || a.country === activeCountry;
				const typeOk    = !activeType    || a.type    === activeType;
				return countryOk && typeOk;
			});
		}

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

		loadMoreBtn.addEventListener('click', function (e) {
			e.preventDefault();
			visibleCount += BATCH;
			render();
		});

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

	/* =========================================================
	   FEATURES GRID — Random articles for index.html
	========================================================= */
	var featuresEl = document.querySelector('#three .features');
	if (featuresEl) {

		fetch('articles.json')
			.then(function(res) {
				if (!res.ok) throw new Error('Could not load articles.json');
				return res.json();
			})
			.then(function(articles) {

				var shuffled = articles
					.map(function(a) { return { a: a, sort: Math.random() }; })
					.sort(function(x, y) { return x.sort - y.sort; })
					.map(function(x) { return x.a; })
					.slice(0, 6);

				featuresEl.innerHTML = '';

				var shades = [
					'rgba(0,0,0,0.025)',
					'rgba(0,0,0,0.025)',
					'rgba(0,0,0,0.065)',
					'rgba(0,0,0,0.065)',
					'rgba(0,0,0,0.11)',
					'rgba(0,0,0,0.11)'
				];

				var overlays = [
					'rgba(242,183,5,0.38)',
					'rgba(242,183,5,0.38)',
					'rgba(242,183,5,0.48)',
					'rgba(242,183,5,0.48)',
					'rgba(242,183,5,0.58)',
					'rgba(242,183,5,0.58)'
				];

				var items = [];

				shuffled.forEach(function(article, i) {

					var li = document.createElement('li');
					li.style.backgroundColor = shades[i];

					if (i === 0) li.style.borderTopLeftRadius = '3px';
					if (i === 1) li.style.borderTopRightRadius = '3px';
					if (i === 4) li.style.borderBottomLeftRadius = '3px';
					if (i === 5) li.style.borderBottomRightRadius = '3px';

					var a = document.createElement('a');
					a.className = 'feature-card';
					a.href = 'articles/' + article.slug + '/';

					var img = document.createElement('img');
					img.className = 'feature-img';
					img.src = 'articles/' + article.slug + '/hero.jpg';
					img.alt = article.title;
					img.loading = 'lazy';

					var overlay = document.createElement('div');
					overlay.className = 'feature-overlay';
					overlay.style.background = overlays[i];

					var title = document.createElement('h3');
					title.className = 'feature-title';
					title.textContent = article.title;

					a.appendChild(img);
					a.appendChild(overlay);
					a.appendChild(title);
					li.appendChild(a);
					featuresEl.appendChild(li);
					items.push(li);
				});

				var CYCLE_DURATION = 3000;
				var currentIndex   = 0;
				var cycleTimer     = null;
				var manualHover    = false;

				function activateItem(index) {
					items.forEach(function(item) {
						item.classList.remove('feature-active');
					});
					items[index].classList.add('feature-active');
				}

				function startCycle() {
					clearInterval(cycleTimer);
					cycleTimer = setInterval(function() {
						if (!manualHover) {
							currentIndex = (currentIndex + 1) % items.length;
							activateItem(currentIndex);
						}
					}, CYCLE_DURATION);
				}

				items.forEach(function(item) {
					item.addEventListener('mouseenter', function() {
						manualHover = true;
						items.forEach(function(i) { i.classList.remove('feature-active'); });
					});
					item.addEventListener('mouseleave', function() {
						manualHover = false;
						activateItem(currentIndex);
					});
				});

				activateItem(0);
				startCycle();
			})
			.catch(function(err) {
				console.error('Features grid failed to load:', err);
			});

	}

	/* =========================================================
	   ARTICLE PAGE LOGIC
	   Path context: en/articles/slug/index.html
	   ../../  = en/
	   ../     = en/articles/
	========================================================= */
	if ($body.hasClass('page-article')) {

		var pathParts = window.location.pathname.split('/').filter(Boolean);
		var slug = pathParts[pathParts.length - 1] === 'index.html'
			? pathParts[pathParts.length - 2]
			: pathParts[pathParts.length - 1];

		var titleEl     = document.getElementById('articleTitle');
		var tagsEl      = document.getElementById('articleTags');
		var suggestedEl = document.getElementById('suggestedArticles');

		function capFirst(str) {
			return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
		}

		function buildSuggestedCard(article) {
			var a = document.createElement('a');
			a.className = 'article-card';
			// from en/articles/slug/, go up one level to en/articles/, then into other slug
			a.href = '../' + article.slug + '/';

			var tagText = [capFirst(article.type), capFirst(article.country)].filter(Boolean).join(' · ');

			a.innerHTML =
				'<div class="image">' +
					'<img src="../' + article.slug + '/hero.jpg" alt="' + article.title + '" loading="lazy" />' +
				'</div>' +
				'<div class="card-body">' +
					'<span class="card-tag">' + tagText + '</span>' +
					'<h3 class="card-title">' + article.title + '</h3>' +
					'<p class="card-excerpt">' + article.excerpt + '</p>' +
				'</div>';

			return a;
		}

		// articles.json is at en/articles.json — two levels up from en/articles/slug/
		fetch('../../articles.json')
			.then(function(res) {
				if (!res.ok) throw new Error('Could not load articles.json');
				return res.json();
			})
			.then(function(articles) {

				var current = articles.find(function(a) { return a.slug === slug; });
				if (!current) {
					console.error('Article not found in JSON for slug:', slug);
					return;
				}

				// Apply colour class
				var color = current.color || 'grey';
				document.body.classList.add('color-' + color);

				// Page title
				document.title = current.title + ' | Badatales';

				// Header title
				titleEl.textContent = current.title;

				// Tags — link to articles page with filter
				// articles.html is at en/articles.html — two levels up
				if (current.country) {
					var countryTag = document.createElement('a');
					countryTag.href = '../../articles.html?filter=' + current.country;
					countryTag.textContent = capFirst(current.country);
					tagsEl.appendChild(countryTag);
				}
				if (current.type) {
					var typeTag = document.createElement('a');
					typeTag.href = '../../articles.html?filter=' + current.type;
					typeTag.textContent = capFirst(current.type);
					tagsEl.appendChild(typeTag);
				}

				// 2 random suggested articles excluding current
				var others = articles.filter(function(a) { return a.slug !== slug; });
				var suggested = others
					.map(function(a) { return { a: a, sort: Math.random() }; })
					.sort(function(x, y) { return x.sort - y.sort; })
					.slice(0, 2)
					.map(function(x) { return x.a; });

				suggested.forEach(function(article) {
					suggestedEl.appendChild(buildSuggestedCard(article));
				});
			})
			.catch(function(err) {
				console.error('Article page failed to load:', err);
			});

	}

})(jQuery);
