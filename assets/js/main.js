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
	   SHARED HELPERS
	========================================================= */

	var lang = document.documentElement.lang || 'en';

	var tagsData = null;

	function translateTag(key) {
		if (tagsData) {
			var dict = tagsData.countries[key] || tagsData.types[key];
			if (dict) return dict[lang] || dict['en'];
		}
		return key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
	}

	function tagLabel(country, type) {
		var parts = [translateTag(type), translateTag(country)].filter(Boolean);
		return parts.join(' · ');
	}

	function localized(article) {
		return article[lang] || article['en'];
	}

	// Fetch tags.json first, then run page logic
	fetch('../tags.json')
		.then(function(res) { return res.json(); })
		.then(function(data) {
			tagsData = data;
			initPages();
		})
		.catch(function() {
			// tags.json failed — continue without translations
			initPages();
		});

	function initPages() {

	/* =========================================================
	   ARTICLES PAGE LOGIC
	========================================================= */
	if ($body.hasClass('page-articles')) {

		const BATCH        = 6;
		const container    = document.getElementById('articlesContainer');
		const noResults    = document.getElementById('noResults');
		const loadMoreWrap = document.getElementById('loadMoreWrapper');
		const loadMoreBtn  = document.getElementById('loadMore');

		const countryGroup = document.getElementById('countryFilters');
		const typeGroup    = document.getElementById('typeFilters');

		let allArticles   = [];
		let activeCountry = null;
		let activeType    = null;
		let visibleCount  = BATCH;
		let countryKeys   = [];
		let typeKeys      = [];

		// Build filter buttons dynamically from tags.json
		function buildFilterButtons() {
			if (!tagsData) return;

			countryKeys = Object.keys(tagsData.countries);
			typeKeys    = Object.keys(tagsData.types);

			countryKeys.forEach(function(key) {
				var btn = document.createElement('button');
				btn.className = 'filter-btn';
				btn.dataset.filter = key;
				btn.textContent = tagsData.countries[key][lang] || tagsData.countries[key]['en'];
				countryGroup.appendChild(btn);
			});

			typeKeys.forEach(function(key) {
				var btn = document.createElement('button');
				btn.className = 'filter-btn';
				btn.dataset.filter = key;
				btn.textContent = tagsData.types[key][lang] || tagsData.types[key]['en'];
				typeGroup.appendChild(btn);
			});

			// Re-attach listeners after buttons are built
			attachFilterListeners();
		}

		function attachFilterListeners() {
			var filterBtns = document.querySelectorAll('.filter-btn');

			filterBtns.forEach(function(btn) {
				btn.addEventListener('click', function() {
					var filter = this.dataset.filter;

					if (filter === 'all') {
						activeCountry = null;
						activeType    = null;
						filterBtns.forEach(function(b) { b.classList.remove('active'); });
						this.classList.add('active');
						visibleCount = BATCH;
						render();
						return;
					}

					var isCountry = countryKeys.includes(filter);
					var isType    = typeKeys.includes(filter);

					if (isCountry) {
						if (activeCountry === filter) {
							activeCountry = null;
							this.classList.remove('active');
						} else {
							countryKeys.forEach(function(c) {
								var el = document.querySelector('[data-filter="' + c + '"]');
								if (el) el.classList.remove('active');
							});
							activeCountry = filter;
							this.classList.add('active');
						}
					} else if (isType) {
						if (activeType === filter) {
							activeType = null;
							this.classList.remove('active');
						} else {
							typeKeys.forEach(function(t) {
								var el = document.querySelector('[data-filter="' + t + '"]');
								if (el) el.classList.remove('active');
							});
							activeType = filter;
							this.classList.add('active');
						}
					}

					var allBtn = document.querySelector('[data-filter="all"]');
					if (!activeCountry && !activeType) {
						if (allBtn) allBtn.classList.add('active');
					} else {
						if (allBtn) allBtn.classList.remove('active');
					}

					visibleCount = BATCH;
					render();
				});
			});
		}

		function buildCard(article) {
			var loc = localized(article);
			var a = document.createElement('a');
			a.className       = 'article-card';
			a.href            = 'articles/' + loc.slug + '/';
			a.dataset.country = article.country || '';
			a.dataset.type    = article.type    || '';

			a.innerHTML =
				'<div class="image">' +
					'<img src="articles/' + loc.slug + '/hero.jpg" alt="' + loc.title + '" loading="lazy" />' +
				'</div>' +
				'<div class="card-body">' +
					'<span class="card-tag">' + tagLabel(article.country, article.type) + '</span>' +
					'<h3 class="card-title">' + loc.title + '</h3>' +
					'<p class="card-excerpt">' + loc.excerpt + '</p>' +
				'</div>';

			return a;
		}

		function buildRow(cardA, cardB, rowIndex) {
			var shades = ['rgba(0,0,0,0.075)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.225)'];
			var section = document.createElement('section');
			section.className = 'article-row';
			section.style.backgroundColor = shades[rowIndex % 3];
			var inner = document.createElement('div');
			inner.className = 'inner';
			inner.appendChild(cardA);
			if (cardB) inner.appendChild(cardB);
			section.appendChild(inner);
			return section;
		}

		function getMatching() {
			return allArticles.filter(function(a) {
				var countryOk = !activeCountry || a.country === activeCountry;
				var typeOk    = !activeType    || a.type    === activeType;
				return countryOk && typeOk;
			});
		}

		function render() {
			container.innerHTML = '';
			var matching = getMatching();
			var slice    = matching.slice(0, visibleCount);

			if (matching.length === 0) {
				noResults.style.display    = 'block';
				loadMoreWrap.style.display = 'none';
				return;
			}

			noResults.style.display = 'none';

			for (var i = 0; i < slice.length; i += 2) {
				var cardA = buildCard(slice[i]);
				var cardB = slice[i + 1] ? buildCard(slice[i + 1]) : null;
				container.appendChild(buildRow(cardA, cardB, Math.floor(i / 2)));
			}

			loadMoreWrap.style.display = visibleCount >= matching.length ? 'none' : 'block';
		}

		loadMoreBtn.addEventListener('click', function(e) {
			e.preventDefault();
			visibleCount += BATCH;
			render();
		});

		fetch('../articles.json')
			.then(function(res) {
				if (!res.ok) throw new Error('Could not load articles.json');
				return res.json();
			})
			.then(function(data) {
				allArticles = data;
				buildFilterButtons();
				render();
			})
			.catch(function(err) {
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

		fetch('../articles.json')
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
					'rgba(0,0,0,0.025)', 'rgba(0,0,0,0.025)',
					'rgba(0,0,0,0.065)', 'rgba(0,0,0,0.065)',
					'rgba(0,0,0,0.11)',  'rgba(0,0,0,0.11)'
				];

				var overlays = [
					'rgba(242,183,5,0.38)', 'rgba(242,183,5,0.38)',
					'rgba(242,183,5,0.48)', 'rgba(242,183,5,0.48)',
					'rgba(242,183,5,0.58)', 'rgba(242,183,5,0.58)'
				];

				var items = [];

				shuffled.forEach(function(article, i) {
					var loc = localized(article);

					var li = document.createElement('li');
					li.style.backgroundColor = shades[i];

					if (i === 0) li.style.borderTopLeftRadius = '3px';
					if (i === 1) li.style.borderTopRightRadius = '3px';
					if (i === 4) li.style.borderBottomLeftRadius = '3px';
					if (i === 5) li.style.borderBottomRightRadius = '3px';

					var a = document.createElement('a');
					a.className = 'feature-card';
					a.href = 'articles/' + loc.slug + '/';

					var img = document.createElement('img');
					img.className = 'feature-img';
					img.src = 'articles/' + loc.slug + '/hero.jpg';
					img.alt = loc.title;
					img.loading = 'lazy';

					var overlay = document.createElement('div');
					overlay.className = 'feature-overlay';
					overlay.style.background = overlays[i];

					var title = document.createElement('h3');
					title.className = 'feature-title';
					title.textContent = loc.title;

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
					items.forEach(function(item) { item.classList.remove('feature-active'); });
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
	========================================================= */
	if ($body.hasClass('page-article')) {

		var pathParts = window.location.pathname.split('/').filter(Boolean);
		var slug = pathParts[pathParts.length - 1] === 'index.html'
			? pathParts[pathParts.length - 2]
			: pathParts[pathParts.length - 1];

		var titleEl     = document.getElementById('articleTitle');
		var tagsEl      = document.getElementById('articleTags');
		var suggestedEl = document.getElementById('suggestedArticles');

		function buildSuggestedCard(article) {
			var loc = localized(article);
			var a = document.createElement('a');
			a.className = 'article-card';
			a.href = '../' + loc.slug + '/';

			a.innerHTML =
				'<div class="image">' +
					'<img src="../' + loc.slug + '/hero.jpg" alt="' + loc.title + '" loading="lazy" />' +
				'</div>' +
				'<div class="card-body">' +
					'<span class="card-tag">' + tagLabel(article.country, article.type) + '</span>' +
					'<h3 class="card-title">' + loc.title + '</h3>' +
					'<p class="card-excerpt">' + loc.excerpt + '</p>' +
				'</div>';

			return a;
		}

		fetch('../../../articles.json')
			.then(function(res) {
				if (!res.ok) throw new Error('Could not load articles.json');
				return res.json();
			})
			.then(function(articles) {

				var current = articles.find(function(a) {
					var loc = localized(a);
					return loc.slug === slug;
				});

				if (!current) {
					console.error('Article not found in JSON for slug:', slug);
					return;
				}

				var loc = localized(current);

				var color = current.color || 'grey';
				document.body.classList.add('color-' + color);

				document.title = loc.title + ' | Badatales';
				titleEl.textContent = loc.title;

				if (current.country) {
					var countryTag = document.createElement('a');
					countryTag.href = '../../articles.html?filter=' + current.country;
					countryTag.textContent = translateTag(current.country);
					tagsEl.appendChild(countryTag);
				}
				if (current.type) {
					var typeTag = document.createElement('a');
					typeTag.href = '../../articles.html?filter=' + current.type;
					typeTag.textContent = translateTag(current.type);
					tagsEl.appendChild(typeTag);
				}

				var others = articles.filter(function(a) {
					return localized(a).slug !== slug;
				});
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

	} // end initPages

})(jQuery);
