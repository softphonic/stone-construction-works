document.addEventListener('DOMContentLoaded', function() {
    // Language Toggle
    const langBtns = document.querySelectorAll('.lang-btn');
    const langContents = document.querySelectorAll('.lang-content');
    const translatableElements = document.querySelectorAll('[data-en]');

    function setLanguage(lang) {
        // Update language buttons
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update content visibility
        langContents.forEach(content => {
            content.classList.toggle('active', content.dataset.lang === lang);
        });

        // Update translatable elements
        translatableElements.forEach(el => {
            const text = el.dataset[lang];
            if (text) {
                el.textContent = text;
            }
        });

        // Persist preference
        localStorage.setItem('preferredLang', lang);
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // Restore language preference
    const savedLang = localStorage.getItem('preferredLang');
    if (savedLang) {
        setLanguage(savedLang);
    }

    // Mobile Menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    // Gallery lightbox effect (simple hover zoom)
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    cursor: pointer;
                    padding: 40px;
                `;

                const fullImg = document.createElement('img');
                fullImg.src = img.src;
                fullImg.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                `;

                overlay.appendChild(fullImg);
                document.body.appendChild(overlay);
                document.body.style.overflow = 'hidden';

                overlay.addEventListener('click', () => {
                    overlay.remove();
                    document.body.style.overflow = '';
                });
            }
        });
    });
});
