/* =========================================================
   Ashok Jadhav Stone Construction Works — interactions
   Modules: i18n, nav, reveal, counters, gallery + lightbox,
   testimonials, FAQ, form, floating buttons.
   Depends on window.I18N (assets/js/translations.js).
   ========================================================= */
(function () {
    'use strict';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- i18n ---------------- */
    const I18N = window.I18N || { en: {}, mr: {} };
    const SUPPORTED = ['en', 'mr'];
    let currentLang = 'en';

    function translate(lang) {
        const dict = I18N[lang] || {};

        // Text content
        $$('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] != null) el.textContent = dict[key];
        });

        // Attributes: "attr:key,attr2:key2"
        $$('[data-i18n-attr]').forEach(el => {
            el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
            });
        });

        currentLang = lang;
        document.documentElement.lang = lang;
        try { localStorage.setItem('preferredLang', lang); } catch (e) {}

        $$('.lang-btn').forEach(btn => {
            const active = btn.dataset.lang === lang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });
    }

    function initLang() {
        let saved;
        try { saved = localStorage.getItem('preferredLang'); } catch (e) {}
        if (!SUPPORTED.includes(saved)) {
            const nav = (navigator.language || 'en').toLowerCase();
            saved = nav.startsWith('mr') ? 'mr' : 'en';
        }
        translate(saved);

        $$('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => translate(btn.dataset.lang));
        });
    }

    /* ---------------- Navigation ---------------- */
    function initNav() {
        const navbar = $('#navbar');
        const toggle = $('#menuToggle');
        const links = $('#navLinks');
        if (!navbar) return;

        // Scrolled state
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        // Mobile menu with backdrop
        let backdrop = $('.nav-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'nav-backdrop';
            document.body.appendChild(backdrop);
        }

        const closeMenu = () => {
            links.classList.remove('open');
            backdrop.classList.remove('show');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
        };
        const openMenu = () => {
            links.classList.add('open');
            backdrop.classList.add('show');
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('nav-open');
        };

        if (toggle) {
            toggle.addEventListener('click', () => {
                links.classList.contains('open') ? closeMenu() : openMenu();
            });
        }
        backdrop.addEventListener('click', closeMenu);
        $$('a', links).forEach(a => a.addEventListener('click', closeMenu));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    }

    /* ---------------- Scroll reveal ---------------- */
    function initReveal() {
        const items = $$('.reveal');
        if (prefersReduced || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('in'));
            return;
        }
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    // subtle stagger for siblings entering together
                    entry.target.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
                    entry.target.classList.add('in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(el => io.observe(el));
    }

    /* ---------------- Counters ---------------- */
    function animateCount(el) {
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || '';
        if (prefersReduced) { el.textContent = target + suffix; return; }
        const duration = 1600;
        const start = performance.now();
        const step = now => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function initCounters() {
        const nums = $$('.stat-num');
        if (!nums.length) return;
        if (!('IntersectionObserver' in window)) { nums.forEach(animateCount); return; }
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
            });
        }, { threshold: 0.5 });
        nums.forEach(n => io.observe(n));
    }

    /* ---------------- Gallery filter + lightbox ---------------- */
    function initGallery() {
        const grid = $('#galleryGrid');
        if (!grid) return;
        const items = $$('.gallery-item', grid);

        $$('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.dataset.filter;
                items.forEach(item => {
                    const show = f === 'all' || item.dataset.category === f;
                    item.classList.toggle('is-hidden', !show);
                });
            });
        });

        // Lightbox
        const lb = $('#lightbox');
        const lbImg = $('#lightboxImg');
        const lbClose = $('#lightboxClose');
        if (!lb || !lbImg) return;

        const open = (src, alt) => {
            lbImg.src = src; lbImg.alt = alt || '';
            lb.hidden = false;
            document.body.style.overflow = 'hidden';
            lbClose.focus();
        };
        const close = () => {
            lb.hidden = true; lbImg.src = '';
            document.body.style.overflow = '';
        };

        items.forEach(item => {
            const img = $('img', item);
            item.addEventListener('click', () => img && open(img.currentSrc || img.src, img.alt));
        });
        lbClose.addEventListener('click', close);
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });
    }

    /* ---------------- Testimonials ---------------- */
    function initTestimonials() {
        const track = $('#testimonialTrack');
        const dotsWrap = $('#tDots');
        if (!track) return;
        const slides = $$('.testimonial', track);
        const total = slides.length;
        if (!total) return;
        let index = 0;
        let timer;

        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 't-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
            dot.addEventListener('click', () => { go(i); reset(); });
            dotsWrap.appendChild(dot);
        });
        const dots = $$('.t-dot', dotsWrap);

        function go(i) {
            index = (i + total) % total;
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d, di) => d.classList.toggle('active', di === index));
        }
        function next() { go(index + 1); }
        function prev() { go(index - 1); }
        function reset() { if (timer) { clearInterval(timer); start(); } }
        function start() { if (!prefersReduced) timer = setInterval(next, 6000); }

        $('#tNext') && $('#tNext').addEventListener('click', () => { next(); reset(); });
        $('#tPrev') && $('#tPrev').addEventListener('click', () => { prev(); reset(); });

        const slider = $('#testimonialSlider');
        slider.addEventListener('mouseenter', () => clearInterval(timer));
        slider.addEventListener('mouseleave', start);

        // Touch swipe
        let startX = 0;
        track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); reset(); }
        }, { passive: true });

        start();
    }

    /* ---------------- Contact form ---------------- */
    function initForm() {
        const form = $('#contactForm');
        if (!form) return;
        const success = $('#formSuccess');

        const setError = (field, on) => field.closest('.field').classList.toggle('invalid', on);

        const validators = {
            cName: v => v.trim().length >= 2,
            cPhone: v => /^[0-9]{10}$/.test(v.replace(/\D/g, '')),
            cEmail: v => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
            cService: v => v.trim() !== '',
            cMessage: v => v.trim().length >= 5
        };

        Object.keys(validators).forEach(id => {
            const el = $('#' + id);
            if (!el) return;
            el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) setError(el, !validators[id](el.value)); });
            el.addEventListener('blur', () => setError(el, !validators[id](el.value)));
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            let ok = true;
            Object.keys(validators).forEach(id => {
                const el = $('#' + id);
                const valid = validators[id](el.value);
                setError(el, !valid);
                if (!valid && ok) { ok = false; el.focus(); }
            });
            if (!ok) return;

            const dict = I18N[currentLang] || {};
            const name = $('#cName').value.trim();
            const phone = $('#cPhone').value.trim();
            const email = $('#cEmail').value.trim();
            const service = $('#cService').value.trim();
            const message = $('#cMessage').value.trim();

            const lines = [
                'New enquiry — Ashok Jadhav Stone Construction Works',
                'Name: ' + name,
                'Phone: ' + phone,
                email ? 'Email: ' + email : null,
                'Service: ' + service,
                'Message: ' + message
            ].filter(Boolean);

            const waUrl = 'https://wa.me/918208322416?text=' + encodeURIComponent(lines.join('\n'));

            if (success) {
                success.hidden = false;
                if (dict['contact.form.success']) success.textContent = dict['contact.form.success'];
            }
            window.open(waUrl, '_blank', 'noopener');
            form.reset();
        });
    }

    /* ---------------- Back to top ---------------- */
    function initBackTop() {
        const btn = $('#backTop');
        if (!btn) return;
        const onScroll = () => btn.classList.toggle('show', window.scrollY > 600);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
    }

    /* ---------------- Misc ---------------- */
    function initMisc() {
        const year = $('#year');
        if (year) year.textContent = new Date().getFullYear();
    }

    /* ---------------- Boot ---------------- */
    function init() {
        initLang();
        initNav();
        initReveal();
        initCounters();
        initGallery();
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
