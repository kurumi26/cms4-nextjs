/**
 * Pato - Main JavaScript
 * Version: 2.0.0 | January 2026
 * Vanilla JS (no jQuery dependency)
 */

(function() {
    'use strict';

    let glightboxInstance = null;
    let glightboxRefreshTimer = null;
    let isUpdatingLightbox = false;

    // In Next.js we load scripts with strategy=afterInteractive, which can run
    // after DOMContentLoaded. Run init immediately if the DOM is already ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initWebPDetection();
        initPageTransitions();
        initBackToTop();
        initFlatpickr();
        initVideoModal();
        initFixedHeader();
        initSidebar();
        initGalleryFilter();
        initGLightbox();
        initDynamicContentObserver();
        initParallax();
        initCopyrightYear();
    }

    /**
     * Dynamic Copyright Year
     */
    function initCopyrightYear() {
        const yearEl = document.getElementById('copyright-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    /**
     * WebP Detection and Image Conversion
     * Detects WebP support and converts all JPG images to WebP
     */
    function initWebPDetection() {
        const webpTest = new Image();
        webpTest.onload = webpTest.onerror = function() {
            const supportsWebP = webpTest.height === 2;

            if (supportsWebP) {
                document.documentElement.classList.add('webp');
                convertImagesToWebP();
            } else {
                document.documentElement.classList.add('no-webp');
            }
        };
        webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    }

    /**
     * Convert all JPG images to WebP format
     */
    function convertImagesToWebP() {
        // Convert img src attributes
        document.querySelectorAll('img[src$=".jpg"]').forEach(img => {
            const webpSrc = img.src.replace(/\.jpg$/i, '.webp');
            img.src = webpSrc;
        });

        // Convert background-image inline styles
        document.querySelectorAll('[style*="background-image"]').forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('.jpg')) {
                el.setAttribute('style', style.replace(/\.jpg/gi, '.webp'));
            }
        });

        // Convert href attributes for lightbox links
        document.querySelectorAll('a[href$=".jpg"]').forEach(link => {
            link.href = link.href.replace(/\.jpg$/i, '.webp');
        });

        // Convert data-logofixed attributes
        document.querySelectorAll('[data-logofixed]').forEach(el => {
            const logoFixed = el.dataset.logofixed;
            if (logoFixed && logoFixed.includes('.png')) {
                // Keep PNG for logos (usually have transparency)
            }
        });
    }

    /**
     * Page Transitions (CSS-based replacement for Animsition)
     */
    function initPageTransitions() {
        // Add fade-in animation on page load
        document.body.classList.add('page-loaded');

        // Add fade-out on internal link clicks
        document
            .querySelectorAll(
                'a:not([target="_blank"]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not(.glightbox):not([data-lightbox])'
            )
            .forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.classList && this.classList.contains('glightbox')) return;
                const href = this.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('javascript')) {
                    e.preventDefault();
                    document.body.classList.add('page-leaving');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            });
        });
    }

    /**
     * Back to Top Button
     */
    function initBackToTop() {
        const btn = document.getElementById('myBtn');
        if (!btn) return;

        const windowH = window.innerHeight / 2;

        window.addEventListener('scroll', () => {
            if (window.scrollY > windowH) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Flatpickr Date Picker
     */
    function initFlatpickr() {
        // Support both old class (.my-calendar) and new class (.js-datepicker)
        const calendars = document.querySelectorAll('.my-calendar, .js-datepicker');
        if (typeof flatpickr === 'undefined' || calendars.length === 0) return;

        calendars.forEach(calendar => {
            flatpickr(calendar, {
                dateFormat: 'd/m/Y',
                minDate: 'today',
                disableMobile: true,
            });
        });

        // Calendar icon click handler
        document.querySelectorAll('.btn-calendar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const input = btn.closest('.wrap-inputdate').querySelector('.my-calendar, .js-datepicker');
                if (input && input._flatpickr) {
                    input._flatpickr.open();
                }
            });
        });
    }

    /**
     * Video Modal Handling
     */
    function initVideoModal() {
        const videoContainer = document.querySelector('.video-mo-01');
        if (!videoContainer) return;

        const iframe = videoContainer.querySelector('iframe');
        if (!iframe) return;

        const srcOld = iframe.getAttribute('src');

        // Handle modal show - using Bootstrap 5 events
        const modal = document.getElementById('modal-video-01');
        if (modal) {
            modal.addEventListener('show.bs.modal', () => {
                iframe.src = srcOld + '&autoplay=1';
                setTimeout(() => {
                    videoContainer.style.opacity = '1';
                }, 300);
            });

            modal.addEventListener('hide.bs.modal', () => {
                iframe.src = srcOld;
                videoContainer.style.opacity = '0';
            });
        }
    }

    /**
     * Fixed Header on Scroll
     */
    function initFixedHeader() {
        const header = document.querySelector('header');
        if (!header) return;

        const logo = header.querySelector('.logo img');
        if (!logo) return;

        const linkLogo1 = logo.getAttribute('src');
        const linkLogo2 = logo.dataset.logofixed;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 5 && window.innerWidth > 992) {
                logo.setAttribute('src', linkLogo2);
                header.classList.add('header-fixed');
            } else {
                header.classList.remove('header-fixed');
                logo.setAttribute('src', linkLogo1);
            }
        });
    }

    /**
     * Sidebar Toggle
     */
    function initSidebar() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay-sidebar trans-0-4';
        document.body.appendChild(overlay);

        const sidebar = document.querySelector('.sidebar');
        const btnShow = document.querySelector('.btn-show-sidebar');
        const btnHide = document.querySelector('.btn-hide-sidebar');

        if (!sidebar) return;

        if (btnShow) {
            btnShow.addEventListener('click', () => {
                sidebar.classList.add('show-sidebar');
                overlay.classList.add('show-overlay-sidebar');
            });
        }

        if (btnHide) {
            btnHide.addEventListener('click', () => {
                sidebar.classList.remove('show-sidebar');
                overlay.classList.remove('show-overlay-sidebar');
            });
        }

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show-sidebar');
            overlay.classList.remove('show-overlay-sidebar');
        });
    }

    /**
     * Gallery Filter (CSS Grid replacement for Isotope)
     */
    function initGalleryFilter() {
        const filterGroup = document.querySelector('.filter-tope-group');
        const grid = document.querySelector('.isotope-grid');

        if (!filterGroup || !grid) return;

        const items = grid.querySelectorAll('.isotope-item');
        const labels = filterGroup.querySelectorAll('.label-gallery');

        labels.forEach(label => {
            label.addEventListener('click', () => {
                // Update active state
                labels.forEach(l => l.classList.remove('is-actived'));
                label.classList.add('is-actived');

                // Filter items
                const filter = label.dataset.filter;

                items.forEach(item => {
                    if (filter === '*') {
                        item.style.display = '';
                        item.classList.remove('hidden');
                    } else {
                        if (item.classList.contains(filter.replace('.', ''))) {
                            item.style.display = '';
                            item.classList.remove('hidden');
                        } else {
                            item.style.display = 'none';
                            item.classList.add('hidden');
                        }
                    }
                });
            });
        });
    }

    /**
     * GLightbox for Image Galleries
     */
    function initGLightbox() {
        if (typeof GLightbox === 'undefined') return;

        // Pato CMS gallery markup sometimes uses a <div class="overlay-item-gallery">
        // instead of an <a> link. Convert overlays to anchors so clicking zooms.
        ensureGalleryLightboxLinks(document);

        // Convert data-lightbox to glightbox format
        document.querySelectorAll('[data-lightbox]').forEach(el => {
            const gallery = el.dataset.lightbox;
            el.classList.add('glightbox');
            el.dataset.gallery = gallery;
            delete el.dataset.lightbox;
        });

        // Recreate instance so newly injected links (client-side navigation) work.
        if (glightboxInstance && typeof glightboxInstance.destroy === 'function') {
            glightboxInstance.destroy();
        }
        glightboxInstance = GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            loop: true,
            zoomable: true,
        });
    }

    function ensureGalleryLightboxLinks(root) {
        if (!root || !root.querySelectorAll) return;

        const items = root.querySelectorAll(
            '.public-page-content .item-gallery, .section-gallery .item-gallery'
        );

        isUpdatingLightbox = true;
        try {
            items.forEach(item => {
                const img = item.querySelector('img');
                if (!img) return;

                const src = img.getAttribute('src') || img.currentSrc || img.src;
                if (!src) return;

                const overlay = item.querySelector('.overlay-item-gallery');
                if (!overlay) return;

                // If already a link, just ensure glightbox attrs exist.
                if (overlay.tagName && overlay.tagName.toLowerCase() === 'a') {
                    overlay.classList.add('glightbox');
                    if (!overlay.getAttribute('href')) overlay.setAttribute('href', src);
                    if (!overlay.dataset.gallery) overlay.dataset.gallery = 'pato-gallery';
                    if (!overlay.getAttribute('aria-label')) overlay.setAttribute('aria-label', 'Zoom image');
                    return;
                }

                // Replace div overlay with anchor overlay to enable click-to-zoom.
                const link = document.createElement('a');
                link.className = overlay.className;
                link.classList.add('glightbox');
                link.setAttribute('href', src);
                link.setAttribute('aria-label', 'Zoom image');
                link.dataset.gallery = 'pato-gallery';
                link.innerHTML = overlay.innerHTML;

                overlay.parentNode.replaceChild(link, overlay);
            });
        } finally {
            isUpdatingLightbox = false;
        }
    }

    function initDynamicContentObserver() {
        // Re-run lightbox wiring when Next.js client-side navigation swaps page content.
        if (typeof MutationObserver === 'undefined') return;
        if (document.body && document.body.dataset.patoObserverInit === '1') return;
        if (document.body) document.body.dataset.patoObserverInit = '1';

        const obs = new MutationObserver(() => {
            if (isUpdatingLightbox) return;
            // GLightbox injects DOM nodes into <body> when opened.
            // Our observer would otherwise re-init (destroy) and instantly close it.
            if (document.body && document.body.classList.contains('glightbox-open')) return;
            clearTimeout(glightboxRefreshTimer);
            glightboxRefreshTimer = setTimeout(() => {
                initGLightbox();
            }, 100);
        });

        obs.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Simple Parallax Effect (CSS-based)
     */
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax100');
        if (parallaxElements.length === 0) return;

        // Use CSS background-attachment: fixed for simple parallax
        parallaxElements.forEach(el => {
            el.style.backgroundAttachment = 'fixed';
            el.style.backgroundPosition = 'center';
            el.style.backgroundSize = 'cover';
        });
    }

})();
