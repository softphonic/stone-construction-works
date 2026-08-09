/* =========================================================
   Ashok Jadhav Stone Construction Works — site behaviour
   ---------------------------------------------------------
   Every module is optional: a page that does not contain a
   module's markup simply skips it, so one bundle can serve
   all pages without throwing.

   Modules: i18n, navigation, reveal, counters, gallery,
   lightbox, testimonials, contact form, back-to-top.
   Depends on window.I18N (js/translations.js).
   ========================================================= */
(function () {
    'use strict';

    var WHATSAPP_NUMBER = '918208322416';

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ================= i18n ================= */
    var I18N = window.I18N || { en: {}, mr: {} };
    var SUPPORTED = ['en', 'mr'];
    var DEFAULT_LANG = 'en';
    var STORAGE_KEY = 'preferredLang';
    var currentLang = DEFAULT_LANG;
    var langListeners = [];

    function storageGet(key) {
        try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }
    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }

    function t(key) {
        var dict = I18N[currentLang] || {};
        if (dict[key] != null) return dict[key];
        var fallback = I18N[DEFAULT_LANG] || {};
        return fallback[key] != null ? fallback[key] : '';
    }

    /** Devanagari digits for Marathi so mixed numerals never appear. */
    function localiseDigits(value) {
        if (currentLang !== 'mr') return String(value);
        var mr = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return String(value).replace(/[0-9]/g, function (d) { return mr[+d]; });
    }

    function onLangChange(fn) {
        langListeners.push(fn);
    }

    function applyLanguage(lang) {
        if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
        currentLang = lang;

        var dict = I18N[lang] || {};

        $$('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key] != null) el.textContent = dict[key];
        });

        // "attr:key" or "attr:key,attr2:key2"
        $$('[data-i18n-attr]').forEach(function (el) {
            el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
                var parts = pair.split(':');
                var attr = (parts[0] || '').trim();
                var key = (parts[1] || '').trim();
                if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
            });
        });

        document.documentElement.lang = lang;
        storageSet(STORAGE_KEY, lang);

        $$('.lang-btn').forEach(function (btn) {
            btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
        });

        langListeners.forEach(function (fn) {
            try { fn(lang); } catch (e) { /* one listener must not break the rest */ }
        });
    }

    function initLang() {
        // English is the default. Only an explicit earlier choice overrides it —
        // browser locale is deliberately ignored so the site never opens in Marathi
        // for a first-time visitor.
        var saved = storageGet(STORAGE_KEY);
        applyLanguage(SUPPORTED.indexOf(saved) !== -1 ? saved : DEFAULT_LANG);

        $$('.lang-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { applyLanguage(btn.dataset.lang); });
        });
    }

    /* ================= Navigation ================= */
    function initNav() {
        var navbar = $('.navbar');
        var toggle = $('#menuToggle');
        var menu = $('#navMenu');

        if (navbar) {
            var onScroll = function () {
                navbar.classList.toggle('scrolled', window.scrollY > 20);
            };
            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });
        }

        if (!toggle || !menu) return;

        var mobileQuery = window.matchMedia('(max-width: 1023px)');
        var backdrop = $('.nav-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'nav-backdrop';
            // The panel sits inside the sticky navbar, which is its own stacking
            // context. The backdrop has to live there too, otherwise it paints
            // over the panel and swallows every tap on a menu link.
            (navbar || document.body).appendChild(backdrop);
        }

        var isOpen = function () { return menu.classList.contains('open'); };

        function openMenu() {
            menu.classList.add('open');
            backdrop.classList.add('show');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('nav-open');
            // The panel is visibility:hidden until the class lands, and focus()
            // is refused on a hidden element, so wait for the style to apply.
            var first = $('a, button', menu);
            if (first) window.requestAnimationFrame(function () { first.focus(); });
        }

        function closeMenu(returnFocus) {
            if (!isOpen()) return;
            menu.classList.remove('open');
            backdrop.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
            if (returnFocus) toggle.focus();
        }

        toggle.addEventListener('click', function () {
            isOpen() ? closeMenu(true) : openMenu();
        });

        backdrop.addEventListener('click', function () { closeMenu(false); });

        var closeBtn = $('#navClose');
        if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });

        // Any navigation action closes the panel — including in-page anchors,
        // which do not trigger a page load.
        $$('a', menu).forEach(function (link) {
            link.addEventListener('click', function () { closeMenu(false); });
        });

        document.addEventListener('keydown', function (e) {
            if (!isOpen()) return;
            if (e.key === 'Escape') {
                closeMenu(true);
                return;
            }
            if (e.key === 'Tab') trapFocus(e, menu);
        });

        // Returning to desktop width must never leave the body scroll-locked.
        var onBreakpoint = function () { if (!mobileQuery.matches) closeMenu(false); };
        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', onBreakpoint);
        } else if (typeof mobileQuery.addListener === 'function') {
            mobileQuery.addListener(onBreakpoint);
        }
    }

    function focusableIn(container) {
        return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
            .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    }

    function trapFocus(e, container) {
        var items = focusableIn(container);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    /* ================= Scroll reveal ================= */
    function initReveal() {
        var items = $$('.reveal');
        if (!items.length) return;
        if (prefersReduced || !('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el, i) {
            // Stagger by DOM order so siblings animate consistently on every load.
            el.style.transitionDelay = (i % 4) * 70 + 'ms';
            io.observe(el);
        });
    }

    /* ================= Stat counters ================= */
    function initCounters() {
        var nums = $$('.stat-num');
        if (!nums.length) return;

        function render(el, value) {
            el.textContent = localiseDigits(value) + (el.dataset.suffix || '');
        }

        function animate(el) {
            var target = parseInt(el.dataset.count, 10) || 0;
            el.dataset.done = 'true';
            if (prefersReduced) { render(el, target); return; }
            var duration = 1500;
            var start = performance.now();
            var step = function (now) {
                var p = Math.min((now - start) / duration, 1);
                render(el, Math.round((1 - Math.pow(1 - p, 3)) * target));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        // Re-render finished counters when the language (and therefore the
        // numeral system) changes.
        onLangChange(function () {
            nums.forEach(function (el) {
                if (el.dataset.done === 'true') render(el, parseInt(el.dataset.count, 10) || 0);
            });
        });

        if (!('IntersectionObserver' in window)) {
            nums.forEach(animate);
            return;
        }
        var io = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animate(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        nums.forEach(function (n) { io.observe(n); });
    }

    /* ================= Gallery filters ================= */
    function initGalleryFilters() {
        var grid = $('#galleryGrid');
        var buttons = $$('.filter-btn');
        if (!grid || !buttons.length) return;

        var items = $$('.gallery-item', grid);
        var empty = $('#galleryEmpty');

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.dataset.filter;
                buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });

                var visible = 0;
                items.forEach(function (item) {
                    var show = filter === 'all' || item.dataset.category === filter;
                    item.hidden = !show;
                    if (show) visible++;
                });
                if (empty) empty.hidden = visible > 0;
            });
        });
    }

    /* ================= Lightbox ================= */
    function initLightbox() {
        var box = $('#lightbox');
        var boxImg = $('#lightboxImg');
        var boxCap = $('#lightboxCap');
        var closeBtn = $('#lightboxClose');
        var prevBtn = $('#lightboxPrev');
        var nextBtn = $('#lightboxNext');
        var triggers = $$('.gallery-item');
        if (!box || !boxImg || !closeBtn || !triggers.length) return;

        var lastFocused = null;
        var current = null;

        // Only the tiles the active filter is showing take part in the sequence.
        function visibleTriggers() {
            return triggers.filter(function (el) { return el.offsetParent !== null; });
        }

        function show(trigger) {
            var img = $('img', trigger);
            if (!img) return;
            current = trigger;
            boxImg.src = img.currentSrc || img.src;
            boxImg.alt = img.alt || '';
            if (boxCap) boxCap.textContent = img.alt || '';
        }

        function step(delta) {
            var list = visibleTriggers();
            if (list.length < 2) return;
            var i = list.indexOf(current);
            show(list[(i + delta + list.length) % list.length]);
        }

        function open(trigger) {
            lastFocused = trigger;
            show(trigger);
            box.hidden = false;
            document.body.classList.add('nav-open');
            var many = visibleTriggers().length > 1;
            if (prevBtn) prevBtn.hidden = !many;
            if (nextBtn) nextBtn.hidden = !many;
            closeBtn.focus();
        }

        function close() {
            if (box.hidden) return;
            box.hidden = true;
            boxImg.removeAttribute('src');
            document.body.classList.remove('nav-open');
            // Return focus to the tile actually on screen, not the one clicked.
            if (current || lastFocused) (current || lastFocused).focus();
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () { open(trigger); });
        });
        closeBtn.addEventListener('click', close);
        if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
        box.addEventListener('click', function (e) { if (e.target === box) close(); });
        document.addEventListener('keydown', function (e) {
            if (box.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'Tab') trapFocus(e, box);
        });
    }

    /* ================= Testimonials ================= */
    function initTestimonials() {
        var track = $('#testimonialTrack');
        var slider = $('#testimonialSlider');
        if (!track || !slider) return;

        var slides = $$('.testimonial', track);
        if (slides.length < 1) return;

        var dotsWrap = $('#tDots');
        var prevBtn = $('#tPrev');
        var nextBtn = $('#tNext');
        var index = 0;
        var timer = null;
        var dots = [];

        if (dotsWrap) {
            slides.forEach(function (_, i) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 't-dot';
                dot.setAttribute('aria-selected', String(i === 0));
                dot.setAttribute('aria-label', 'Review ' + (i + 1));
                dot.addEventListener('click', function () { go(i); restart(); });
                dotsWrap.appendChild(dot);
                dots.push(dot);
            });
        }

        function go(i) {
            index = (i + slides.length) % slides.length;
            track.style.transform = 'translateX(' + (-index * 100) + '%)';
            slides.forEach(function (slide, si) {
                // Off-screen slides must not be reachable by keyboard or screen readers.
                slide.setAttribute('aria-hidden', String(si !== index));
            });
            dots.forEach(function (dot, di) { dot.setAttribute('aria-selected', String(di === index)); });
        }

        function next() { go(index + 1); }
        function prev() { go(index - 1); }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function start() {
            if (prefersReduced || slides.length < 2 || timer) return;
            timer = setInterval(next, 6500);
        }
        function restart() { stop(); start(); }

        if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
        if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        slider.addEventListener('focusin', stop);
        slider.addEventListener('focusout', start);

        var startX = 0;
        var startY = 0;
        track.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        track.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            // Ignore mostly-vertical gestures so page scrolling still feels natural.
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
                dx < 0 ? next() : prev();
                restart();
            }
        }, { passive: true });

        go(0);
        start();
    }

    /* ================= Contact form ================= */
    function initForm() {
        var form = $('#contactForm');
        if (!form) return;

        var success = $('#formSuccess');
        var fallback = $('#formFallback');
        var honeypot = $('#cCompany');

        var rules = {
            cName: function (v) { return v.trim().length >= 2; },
            cPhone: function (v) { return /^[6-9][0-9]{9}$/.test(v.replace(/\D/g, '')); },
            cEmail: function (v) { return v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
            cService: function (v) { return v.trim() !== ''; },
            cMessage: function (v) { return v.trim().length >= 5; }
        };

        function setState(el, valid) {
            var field = el.closest('.field');
            if (field) field.classList.toggle('invalid', !valid);
            el.setAttribute('aria-invalid', String(!valid));
        }

        Object.keys(rules).forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('blur', function () { setState(el, rules[id](el.value)); });
            el.addEventListener('input', function () {
                var field = el.closest('.field');
                if (field && field.classList.contains('invalid')) setState(el, rules[id](el.value));
            });
            el.addEventListener('change', function () { setState(el, rules[id](el.value)); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Bots fill every field, including the one humans cannot see.
            if (honeypot && honeypot.value !== '') return;

            var firstInvalid = null;
            Object.keys(rules).forEach(function (id) {
                var el = document.getElementById(id);
                if (!el) return;
                var valid = rules[id](el.value);
                setState(el, valid);
                if (!valid && !firstInvalid) firstInvalid = el;
            });
            if (firstInvalid) { firstInvalid.focus(); return; }

            var value = function (id) {
                var el = document.getElementById(id);
                return el ? el.value.trim() : '';
            };

            var lines = [
                'New enquiry — Ashok Jadhav Stone Construction Works',
                'Name: ' + value('cName'),
                'Phone: ' + value('cPhone'),
                value('cEmail') ? 'Email: ' + value('cEmail') : null,
                'Service: ' + value('cService'),
                'Message: ' + value('cMessage')
            ].filter(Boolean);

            var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
            var opened = window.open(url, '_blank', 'noopener');

            if (success) {
                success.textContent = t('contact.form.success');
                success.hidden = false;
            }
            // Pop-up blockers are common on mobile: always leave a tappable link.
            if (fallback) {
                fallback.href = url;
                fallback.textContent = t('contact.form.blocked');
                fallback.hidden = !!opened;
            }
            if (opened) form.reset();
        });
    }

    /* ================= Back to top ================= */
    function initBackTop() {
        var btn = $('#backTop');
        if (!btn) return;
        var onScroll = function () { btn.classList.toggle('show', window.scrollY > 600); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
    }

    /* ================= Misc ================= */
    function initMisc() {
        var year = $('#year');
        if (year) {
            var setYear = function () { year.textContent = localiseDigits(new Date().getFullYear()); };
            setYear();
            onLangChange(setYear);
        }
    }

    /* ================= Boot ================= */
    function init() {
        initLang();
        initNav();
        initReveal();
        initCounters();
        initGalleryFilters();
        initLightbox();
        initTestimonials();
        initForm();
        initBackTop();
        initMisc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
