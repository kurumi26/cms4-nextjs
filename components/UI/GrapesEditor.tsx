"use client";

import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import grapesjsPresetWebpage from "grapesjs-preset-webpage";
import grapesjsBlocksBasic from "grapesjs-blocks-basic";
import grapesjsPluginForms from "grapesjs-plugin-forms";
import "grapesjs/dist/css/grapes.min.css";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/xml/xml";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";

type GrapesEditorProps = {
  value?: string;
  onChange: (content: string) => void;
  height?: number;
};

const extractContentParts = (html: string): { body: string; css: string; js: string } => {
  const raw = html || "";
  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const css = styleMatch?.[1] || "";
  const js = scriptMatch?.[1] || "";

  let body = raw;
  if (styleMatch?.[0]) body = body.replace(styleMatch[0], "");
  if (scriptMatch?.[0]) body = body.replace(scriptMatch[0], "");

  return { body: body.trim(), css, js };
};

const extractFileList = (input: any): File[] => {
  if (!input) return [];
  if (input instanceof File) return [input];
  if (input instanceof FileList) return Array.from(input);
  if (Array.isArray(input)) return input.filter((item) => item instanceof File);

  const dropFiles = input?.dataTransfer?.files;
  if (dropFiles instanceof FileList) return Array.from(dropFiles);

  const targetFiles = input?.target?.files;
  if (targetFiles instanceof FileList) return Array.from(targetFiles);

  return [];
};

const registerCmsBlocks = (editor: any) => {
  const bm = editor.BlockManager;

  const add = (id: string, config: any) => {
    if (bm.get(id)) return;
    bm.add(id, config);
  };

  add("cms-hero", {
    label: "Hero Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-flag" },
    content: `
      <section class="cms-hero" style="padding:64px 24px;background:#f8fafc;text-align:center;">
        <div style="max-width:900px;margin:0 auto;">
          <h1 style="font-size:42px;line-height:1.2;margin:0 0 12px;">Build Beautiful Pages Faster</h1>
          <p style="font-size:18px;color:#475569;margin:0 0 24px;">Drop in ready sections and customize text, colors, and spacing in seconds.</p>
          <a href="#" style="display:inline-block;background:#0d6efd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;">Get Started</a>
        </div>
      </section>
    `,
  });

  add("cms-about", {
    label: "About Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-info-circle" },
    content: `
      <section style="padding:56px 24px;">
        <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200" alt="About" style="width:100%;border-radius:12px;object-fit:cover;min-height:260px;"/>
          <div>
            <h2 style="margin:0 0 12px;">About Our Brand</h2>
            <p style="margin:0;color:#475569;line-height:1.7;">Share your company story, mission, and what makes your team different.</p>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-features-3", {
    label: "Features 3-Column",
    category: "CMS Sections",
    attributes: { class: "fa fa-th-large" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:1100px;margin:0 auto;">
          <h2 style="text-align:center;margin:0 0 22px;">Why Choose Us</h2>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Fast Setup</h3><p style="margin:0;color:#475569;">Launch quickly with ready-made building blocks.</p></div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Responsive</h3><p style="margin:0;color:#475569;">Layouts adapt naturally across desktop and mobile.</p></div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Customizable</h3><p style="margin:0;color:#475569;">Edit text, spacing, and visuals with full control.</p></div>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-testimonials", {
    label: "Testimonials",
    category: "CMS Sections",
    attributes: { class: "fa fa-commenting" },
    content: `
      <section style="padding:56px 24px;background:#f8fafc;">
        <div style="max-width:1000px;margin:0 auto;">
          <h2 style="text-align:center;margin:0 0 20px;">What Customers Say</h2>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
            <blockquote style="margin:0;padding:20px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;">“Great service and excellent quality.”<br/><strong>- Customer A</strong></blockquote>
            <blockquote style="margin:0;padding:20px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;">“Very easy to use and manage content.”<br/><strong>- Customer B</strong></blockquote>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-pricing", {
    label: "Pricing Cards",
    category: "CMS Sections",
    attributes: { class: "fa fa-tags" },
    content: `
      <section style="padding:56px 24px;">
        <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;"><h3>Starter</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">$19</p><p style="color:#475569;">Great for small teams.</p></div>
          <div style="border:2px solid #0d6efd;border-radius:12px;padding:18px;"><h3>Pro</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">$49</p><p style="color:#475569;">Best for growing teams.</p></div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;"><h3>Business</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">$99</p><p style="color:#475569;">Advanced needs and support.</p></div>
        </div>
      </section>
    `,
  });

  add("cms-faq", {
    label: "FAQ",
    category: "CMS Sections",
    attributes: { class: "fa fa-question-circle" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:900px;margin:0 auto;">
          <h2 style="margin:0 0 14px;">Frequently Asked Questions</h2>
          <details open style="padding:12px 0;border-bottom:1px solid #e2e8f0;"><summary style="font-weight:600;cursor:pointer;">How do I update content?</summary><p style="margin:8px 0 0;color:#475569;">Use the visual editor and click save when done.</p></details>
          <details style="padding:12px 0;border-bottom:1px solid #e2e8f0;"><summary style="font-weight:600;cursor:pointer;">Is this mobile-friendly?</summary><p style="margin:8px 0 0;color:#475569;">Yes, all section templates are responsive-ready.</p></details>
          <details style="padding:12px 0;"><summary style="font-weight:600;cursor:pointer;">Can I add custom code?</summary><p style="margin:8px 0 0;color:#475569;">Yes, use the code editor option in the top panel.</p></details>
        </div>
      </section>
    `,
  });

  add("cms-gallery-4", {
    label: "Image Gallery",
    category: "CMS Media",
    attributes: { class: "fa fa-image" },
    content: `
      <section style="padding:40px 24px;">
        <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
          <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800" alt="Gallery 1" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800" alt="Gallery 2" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800" alt="Gallery 3" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=800" alt="Gallery 4" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
        </div>
      </section>
    `,
  });

  add("cms-cta", {
    label: "Call To Action",
    category: "CMS Sections",
    attributes: { class: "fa fa-bullhorn" },
    content: `
      <section style="padding:48px 24px;background:#0f172a;color:#fff;">
        <div style="max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <h2 style="margin:0 0 8px;">Ready to get started?</h2>
            <p style="margin:0;color:#cbd5e1;">Create your next page with reusable visual blocks.</p>
          </div>
          <a href="#" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Contact Us</a>
        </div>
      </section>
    `,
  });

  add("cms-header", {
    label: "Header / Navbar",
    category: "CMS Sections",
    attributes: { class: "fa fa-header" },
    content: `
      <header style="position:sticky;top:0;z-index:20;background:#0f172a;color:#fff;padding:14px 24px;">
        <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
          <a href="#" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:.4px;">Restaurant Place</a>
          <nav style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Home</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Menu</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">About</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Contact</a>
            <a href="#" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:8px 14px;border-radius:999px;font-weight:600;">Book Now</a>
          </nav>
        </div>
      </header>
    `,
  });

  add("cms-footer", {
    label: "Footer",
    category: "CMS Sections",
    attributes: { class: "fa fa-window-minimize" },
    content: `
      <footer style="background:#111827;color:#cbd5e1;padding:34px 24px;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:18px;">
          <div>
            <h3 style="margin:0 0 10px;color:#fff;">Restaurant Place</h3>
            <p style="margin:0;line-height:1.7;">Serve great food and warm experiences. Update this content with your address and contact details.</p>
          </div>
          <div>
            <h4 style="margin:0 0 10px;color:#fff;">Quick Links</h4>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Home</a></p>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Menu</a></p>
            <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Contact</a></p>
          </div>
          <div>
            <h4 style="margin:0 0 10px;color:#fff;">Follow</h4>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Facebook</a></p>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Instagram</a></p>
            <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Twitter</a></p>
          </div>
        </div>
        <div style="max-width:1120px;margin:18px auto 0;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:13px;color:#94a3b8;">© 2026 Restaurant Place. All rights reserved.</div>
      </footer>
    `,
  });

  add("cms-header-hero-combo", {
    label: "Header + Hero Combo",
    category: "CMS Sections",
    attributes: { class: "fa fa-object-group" },
    content: `
      <section>
        <header style="position:relative;z-index:10;background:#0f172a;color:#fff;padding:14px 24px;">
          <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <a href="#" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:.4px;">Restaurant Place</a>
            <nav style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Home</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Menu</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">About</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Contact</a>
            </nav>
          </div>
        </header>
        <div style="padding:74px 24px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;text-align:center;">
          <div style="max-width:900px;margin:0 auto;">
            <p style="margin:0 0 8px;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">Welcome</p>
            <h1 style="font-size:44px;line-height:1.2;margin:0 0 12px;">Good Food, Great Moments</h1>
            <p style="font-size:18px;color:#d1d5db;margin:0 0 24px;">Craft your homepage quickly using prebuilt blocks, then customize every detail.</p>
            <a href="#" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">Explore Menu</a>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-footer-contact-strip", {
    label: "Footer + Contact Strip",
    category: "CMS Sections",
    attributes: { class: "fa fa-address-card" },
    content: `
      <section>
        <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
          <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#334155;font-size:14px;">
            <span>📍 123 Main Street, Quezon City</span>
            <span>📞 +63 900 123 4567</span>
            <span>✉️ hello@restaurantplace.com</span>
          </div>
        </div>
        <footer style="background:#111827;color:#cbd5e1;padding:34px 24px;">
          <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:18px;">
            <div>
              <h3 style="margin:0 0 10px;color:#fff;">Restaurant Place</h3>
              <p style="margin:0;line-height:1.7;">Serve great food and warm experiences. Update this content with your address and contact details.</p>
            </div>
            <div>
              <h4 style="margin:0 0 10px;color:#fff;">Quick Links</h4>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Home</a></p>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Menu</a></p>
              <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Contact</a></p>
            </div>
            <div>
              <h4 style="margin:0 0 10px;color:#fff;">Follow</h4>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Facebook</a></p>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Instagram</a></p>
              <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Twitter</a></p>
            </div>
          </div>
          <div style="max-width:1120px;margin:18px auto 0;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:13px;color:#94a3b8;">© 2026 Restaurant Place. All rights reserved.</div>
        </footer>
      </section>
    `,
  });

  add("cms-map", {
    label: "Map Embed",
    category: "CMS Media",
    attributes: { class: "fa fa-map-marker" },
    content: `
      <section style="padding:24px;">
        <div style="max-width:1000px;margin:0 auto;">
          <iframe
            src="https://www.google.com/maps?q=Manila&output=embed"
            style="width:100%;height:320px;border:0;border-radius:10px;"
            loading="lazy"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    `,
  });

  add("cms-carousel-selection", {
    label: "Carousel (Selection Dots)",
    category: "CMS Media",
    attributes: { class: "fa fa-sliders" },
    content: `
      <section style="padding:40px 24px;background:#f8fafc;">
        <div style="max-width:980px;margin:0 auto;">
          <style>
            .cms-car{position:relative;overflow:hidden;border-radius:14px;background:#0f172a}
            .cms-car-track{display:flex;transition:transform .45s ease}
            .cms-car-slide{width:100%;flex:0 0 100%;position:relative;min-height:320px}
            .cms-car-slide img{width:100%;height:320px;object-fit:cover;display:block;opacity:.9}
            .cms-car-cap{position:absolute;left:24px;bottom:20px;color:#fff;max-width:70%}
            .cms-car-cap h3{margin:0 0 6px;font-size:28px}
            .cms-car-cap p{margin:0;color:#e2e8f0}
            .cms-car-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}
            .cms-car-dot{width:12px;height:12px;border-radius:999px;background:#cbd5e1;cursor:pointer;display:inline-block;border:0;padding:0}
            .cms-car-dot.is-active{background:#0d6efd}
            .cms-car-arrow{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:999px;border:0;background:rgba(15,23,42,.62);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;z-index:2}
            .cms-car-arrow:hover{background:rgba(15,23,42,.82)}
            .cms-car-arrow.prev{left:10px}
            .cms-car-arrow.next{right:10px}
          </style>
          <div class="cms-car js-cms-car" data-autoplay="true" data-interval="4000">
            <div class="cms-car-track">
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400" alt="Slide 1"/>
                <div class="cms-car-cap"><h3>Freshly Prepared</h3><p>Highlight your latest offer here.</p></div>
              </div>
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400" alt="Slide 2"/>
                <div class="cms-car-cap"><h3>Family Favorites</h3><p>Showcase bestselling dishes.</p></div>
              </div>
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=1400" alt="Slide 3"/>
                <div class="cms-car-cap"><h3>Reserve a Table</h3><p>Add your CTA and booking link.</p></div>
              </div>
            </div>
            <button type="button" class="cms-car-arrow prev" aria-label="Previous slide">❮</button>
            <button type="button" class="cms-car-arrow next" aria-label="Next slide">❯</button>
            <div class="cms-car-dots">
              <button type="button" class="cms-car-dot" aria-label="Slide 1"></button>
              <button type="button" class="cms-car-dot" aria-label="Slide 2"></button>
              <button type="button" class="cms-car-dot" aria-label="Slide 3"></button>
            </div>
          </div>
          <script>
            (function () {
              var cars = document.querySelectorAll('.js-cms-car');
              cars.forEach(function (car) {
                if (car.getAttribute('data-bound') === '1') return;
                car.setAttribute('data-bound', '1');

                var track = car.querySelector('.cms-car-track');
                var slides = Array.prototype.slice.call(car.querySelectorAll('.cms-car-slide'));
                var dots = Array.prototype.slice.call(car.querySelectorAll('.cms-car-dot'));
                var prevBtn = car.querySelector('.cms-car-arrow.prev');
                var nextBtn = car.querySelector('.cms-car-arrow.next');
                var idx = 0;
                var timer = null;
                var interval = Number(car.getAttribute('data-interval') || 4000);
                var autoplay = String(car.getAttribute('data-autoplay') || 'true') !== 'false';

                var render = function () {
                  if (!track || !slides.length) return;
                  track.style.transform = 'translateX(-' + idx * 100 + '%)';
                  dots.forEach(function (d, i) {
                    if (i === idx) d.classList.add('is-active');
                    else d.classList.remove('is-active');
                  });
                };

                var goTo = function (nextIndex) {
                  if (!slides.length) return;
                  idx = (nextIndex + slides.length) % slides.length;
                  render();
                };

                var start = function () {
                  if (!autoplay || slides.length < 2) return;
                  if (timer) window.clearInterval(timer);
                  timer = window.setInterval(function () { goTo(idx + 1); }, Math.max(1500, interval));
                };

                var stop = function () {
                  if (!timer) return;
                  window.clearInterval(timer);
                  timer = null;
                };

                if (prevBtn) prevBtn.addEventListener('click', function () { goTo(idx - 1); start(); });
                if (nextBtn) nextBtn.addEventListener('click', function () { goTo(idx + 1); start(); });

                dots.forEach(function (dot, i) {
                  dot.addEventListener('click', function () {
                    goTo(i);
                    start();
                  });
                });

                car.addEventListener('mouseenter', stop);
                car.addEventListener('mouseleave', start);

                render();
                start();
              });
            })();
          </script>
        </div>
      </section>
    `,
  });

  add("cms-slicer-slider", {
    label: "Slicer / Slider Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-columns" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:stretch;">
          <div style="position:relative;overflow:hidden;border-radius:14px;min-height:300px;">
            <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1400" alt="Slicer Visual" style="width:100%;height:100%;object-fit:cover;display:block;"/>
            <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(15,23,42,.62),rgba(15,23,42,.12));"></div>
            <div style="position:absolute;left:20px;bottom:18px;color:#fff;max-width:70%;">
              <h3 style="margin:0 0 6px;font-size:30px;">Feature Spotlight</h3>
              <p style="margin:0;color:#e2e8f0;">Use this as a sliced hero panel or promo area.</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 1</h4>
              <p style="margin:0;color:#475569;">Add text, links, and short details.</p>
            </div>
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 2</h4>
              <p style="margin:0;color:#475569;">Perfect for highlights and quick stats.</p>
            </div>
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 3</h4>
              <p style="margin:0;color:#475569;">Duplicate this card to add more slices.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-spacer", {
    label: "Spacer",
    category: "CMS Utility",
    attributes: { class: "fa fa-arrows-v" },
    content: `<div style="height:40px;"></div>`,
  });

  add("cms-divider", {
    label: "Divider",
    category: "CMS Utility",
    attributes: { class: "fa fa-minus" },
    content: `<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;"/>`,
  });

  add("cms-social-links", {
    label: "Social Links",
    category: "CMS Utility",
    attributes: { class: "fa fa-share-alt" },
    content: `
      <div style="display:flex;gap:12px;justify-content:center;padding:12px 0;">
        <a href="#" style="text-decoration:none;">Facebook</a>
        <a href="#" style="text-decoration:none;">Instagram</a>
        <a href="#" style="text-decoration:none;">Twitter</a>
      </div>
    `,
  });

  add("cms-quick-links", {
    label: "Quick Links",
    category: "CMS Utility",
    attributes: { class: "fa fa-link" },
    content: `
      <section style="padding:20px 24px;">
        <div style="max-width:900px;margin:0 auto;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <h4 style="margin:0 0 12px;">Quick Links</h4>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Home</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Menu</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Promos</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">About</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Contact</a>
          </div>
        </div>
      </section>
    `,
  });
};

export default function GrapesEditor({ value = "", onChange, height = 800 }: GrapesEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastEmittedRef = useRef<string>("");
  const jsRef = useRef<string>("");

  useEffect(() => {
    if (!hostRef.current || editorRef.current) return;

    const { body, css, js } = extractContentParts(value);
    jsRef.current = js;

    const editor = grapesjs.init({
      container: hostRef.current,
      fromElement: false,
      height: `${height}px`,
      storageManager: false,
      plugins: [grapesjsPresetWebpage, grapesjsBlocksBasic, grapesjsPluginForms],
      assetManager: {
        upload: false,
        uploadFile: async (event: any) => {
          const files = extractFileList(event);
          if (!files.length) return;

          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));

          try {
            const res = await fetch("/api/assets/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              throw new Error("Upload failed");
            }

            const data = await res.json();
            const urls = Array.isArray(data?.urls) ? data.urls.filter(Boolean) : [];

            if (!urls.length) return;

            editor.AssetManager.add(
              urls.map((url: string) => ({
                src: url,
                type: "image",
              }))
            );
          } catch (error) {
            console.error("Grapes asset upload failed:", error);
            if (typeof window !== "undefined") {
              window.alert("Asset upload failed. Please try again.");
            }
          }
        },
      },
      codeManager: {
        optsCodeViewer: {
          readOnly: 0,
          lineWrapping: true,
          autoRefresh: true,
        },
      },
      selectorManager: { componentFirst: true },
      components: body || "<div>Start building your page...</div>",
      style: css,
    });

    registerCmsBlocks(editor);

    const buildContent = (ed: any) => {
      const html = ed.getHtml() || "";
      const styles = ed.getCss() || "";
      const script = (jsRef.current || "").trim();
      const cssTag = styles ? `\n<style>${styles}</style>` : "";
      const jsTag = script ? `\n<script>${script}</script>` : "";
      return `${html}${cssTag}${jsTag}`.trim();
    };

    const openCodeModal = async (ed: any) => {
        const modal = ed.Modal;
      const CodeMirror = (await import("codemirror")).default;
      const beautifyModule: any = await import("js-beautify");
      const baseEditorHeight = 300;
      let isStretched = false;

      const resetCodeCommandState = () => {
        try {
          const viewsButtons = ed?.Panels?.getPanel?.("views")?.get?.("buttons");
          if (viewsButtons?.forEach) {
            viewsButtons.forEach((btn: any) => {
              const id = String(btn?.get?.("id") || "");
              const cmd = String(btn?.get?.("command") || "");
              if (id === "open-code" || id === "cms-open-code" || cmd === "cms:open-code" || cmd === "core:open-code" || cmd === "open-code") {
                btn.set?.("active", false);
              }
            });
          }
        } catch {
          // ignore state-sync errors
        }
      };

      const beautifyHtml = beautifyModule?.html || beautifyModule?.default?.html;
      const beautifyCss = beautifyModule?.css || beautifyModule?.default?.css;
      const beautifyJs = beautifyModule?.js || beautifyModule?.default?.js;

      const formatByType = (code: string, type: "html" | "css" | "js") => {
        const source = code || "";
        if (!source.trim()) return "";

        const options = {
          indent_size: 2,
          preserve_newlines: true,
          max_preserve_newlines: 2,
          end_with_newline: false,
        };

        try {
          if (type === "html" && typeof beautifyHtml === "function") {
            return beautifyHtml(source, options);
          }
          if (type === "css" && typeof beautifyCss === "function") {
            return beautifyCss(source, options);
          }
          if (type === "js" && typeof beautifyJs === "function") {
            return beautifyJs(source, options);
          }
          return source;
        } catch {
          return source;
        }
      };

      const initialHtml = formatByType(ed.getHtml() || "", "html");
      const initialCss = formatByType(ed.getCss() || "", "css");
      const initialJs = formatByType(jsRef.current || "", "js");

        const wrapper = document.createElement("div");
        wrapper.style.display = "grid";
        wrapper.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
        wrapper.style.gap = "12px";
        wrapper.style.minHeight = "320px";
        wrapper.style.width = "100%";

        const htmlCol = document.createElement("div");
        const cssCol = document.createElement("div");
        const jsCol = document.createElement("div");
        htmlCol.style.minWidth = "0";
        cssCol.style.minWidth = "0";
        jsCol.style.minWidth = "0";

        const htmlLabel = document.createElement("div");
        htmlLabel.textContent = "HTML";
        htmlLabel.style.fontWeight = "600";
        htmlLabel.style.marginBottom = "6px";
        htmlLabel.style.color = "#f3f4f6";

        const cssLabel = document.createElement("div");
        cssLabel.textContent = "CSS";
        cssLabel.style.fontWeight = "600";
        cssLabel.style.marginBottom = "6px";
        cssLabel.style.color = "#f3f4f6";

        const jsLabel = document.createElement("div");
        jsLabel.textContent = "JS";
        jsLabel.style.fontWeight = "600";
        jsLabel.style.marginBottom = "6px";
        jsLabel.style.color = "#f3f4f6";

        const htmlInput = document.createElement("textarea");
        htmlInput.value = initialHtml;
        htmlInput.style.width = "100%";
        htmlInput.style.height = "300px";
        htmlInput.style.minHeight = "220px";
        htmlInput.style.resize = "vertical";
        htmlInput.style.fontFamily = "monospace";
        htmlInput.style.fontSize = "13px";
        htmlInput.style.padding = "10px";
        htmlInput.style.background = "#111827";
        htmlInput.style.color = "#e5e7eb";
        htmlInput.style.border = "1px solid #374151";
        htmlInput.style.borderRadius = "6px";
        htmlInput.style.caretColor = "#93c5fd";

        const cssInput = document.createElement("textarea");
        cssInput.value = initialCss;
        cssInput.style.width = "100%";
        cssInput.style.height = "300px";
        cssInput.style.minHeight = "220px";
        cssInput.style.resize = "vertical";
        cssInput.style.fontFamily = "monospace";
        cssInput.style.fontSize = "13px";
        cssInput.style.padding = "10px";
        cssInput.style.background = "#111827";
        cssInput.style.color = "#e5e7eb";
        cssInput.style.border = "1px solid #374151";
        cssInput.style.borderRadius = "6px";
        cssInput.style.caretColor = "#93c5fd";

        const jsInput = document.createElement("textarea");
        jsInput.value = initialJs;
        jsInput.style.width = "100%";
        jsInput.style.height = "300px";
        jsInput.style.minHeight = "220px";
        jsInput.style.resize = "vertical";
        jsInput.style.fontFamily = "monospace";
        jsInput.style.fontSize = "13px";
        jsInput.style.padding = "10px";
        jsInput.style.background = "#111827";
        jsInput.style.color = "#e5e7eb";
        jsInput.style.border = "1px solid #374151";
        jsInput.style.borderRadius = "6px";
        jsInput.style.caretColor = "#93c5fd";

        htmlCol.appendChild(htmlLabel);
        htmlCol.appendChild(htmlInput);
        cssCol.appendChild(cssLabel);
        cssCol.appendChild(cssInput);
        jsCol.appendChild(jsLabel);
        jsCol.appendChild(jsInput);

        wrapper.appendChild(htmlCol);
        wrapper.appendChild(cssCol);
        wrapper.appendChild(jsCol);

        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "flex-end";
        footer.style.gap = "8px";
        footer.style.marginTop = "12px";
        footer.style.paddingTop = "10px";
        footer.style.borderTop = "1px solid rgba(255,255,255,0.15)";
        footer.style.background = "#1f1f1f";
        footer.style.zIndex = "2";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "8px 14px";
        cancelBtn.style.border = "1px solid #5f6368";
        cancelBtn.style.background = "#2d2f33";
        cancelBtn.style.color = "#ffffff";
        cancelBtn.style.borderRadius = "4px";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.onclick = () => {
          resetCodeCommandState();
          modal.close();
        };

        const stretchBtn = document.createElement("button");
        stretchBtn.type = "button";
        stretchBtn.textContent = "Stretch";
        stretchBtn.style.padding = "8px 14px";
        stretchBtn.style.border = "1px solid #5f6368";
        stretchBtn.style.background = "#2d2f33";
        stretchBtn.style.color = "#ffffff";
        stretchBtn.style.borderRadius = "4px";
        stretchBtn.style.cursor = "pointer";

        const formatBtn = document.createElement("button");
        formatBtn.type = "button";
        formatBtn.textContent = "Format";
        formatBtn.style.padding = "8px 14px";
        formatBtn.style.border = "1px solid #5f6368";
        formatBtn.style.background = "#2d2f33";
        formatBtn.style.color = "#ffffff";
        formatBtn.style.borderRadius = "4px";
        formatBtn.style.cursor = "pointer";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.textContent = "Save";
        saveBtn.style.padding = "8px 14px";
        saveBtn.style.border = "1px solid #1677ff";
        saveBtn.style.background = "#1677ff";
        saveBtn.style.color = "#ffffff";
        saveBtn.style.borderRadius = "4px";
        saveBtn.style.cursor = "pointer";

        let htmlEditor: any = null;
        let cssEditor: any = null;
        let jsEditor: any = null;

        const setEditorHeight = (height: number) => {
          htmlInput.style.height = `${height}px`;
          cssInput.style.height = `${height}px`;
          jsInput.style.height = `${height}px`;

          if (htmlEditor && cssEditor && jsEditor) {
            htmlEditor.setSize("100%", height);
            cssEditor.setSize("100%", height);
            jsEditor.setSize("100%", height);
            htmlEditor.refresh();
            cssEditor.refresh();
            jsEditor.refresh();
          }
        };

        const applyStretch = () => {
          const dialog = document.querySelector(".gjs-mdl-dialog") as HTMLElement | null;

          if (isStretched) {
            content.style.maxHeight = "92vh";
            wrapper.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
            stretchBtn.textContent = "Normal";
            if (dialog) {
              dialog.style.width = "96vw";
              dialog.style.maxWidth = "96vw";
            }
            const height = Math.max(420, Math.floor(window.innerHeight * 0.6));
            setEditorHeight(height);
          } else {
            content.style.maxHeight = "82vh";
            wrapper.style.gridTemplateColumns = "repeat(auto-fit, minmax(260px, 1fr))";
            stretchBtn.textContent = "Stretch";
            if (dialog) {
              dialog.style.width = "";
              dialog.style.maxWidth = "";
            }
            setEditorHeight(baseEditorHeight);
          }
        };

        stretchBtn.onclick = () => {
          isStretched = !isStretched;
          applyStretch();
        };

        formatBtn.onclick = () => {
          const htmlValue = htmlEditor ? htmlEditor.getValue() : htmlInput.value || "";
          const cssValue = cssEditor ? cssEditor.getValue() : cssInput.value || "";
          const jsValue = jsEditor ? jsEditor.getValue() : jsInput.value || "";

          const prettyHtml = formatByType(htmlValue, "html");
          const prettyCss = formatByType(cssValue, "css");
          const prettyJs = formatByType(jsValue, "js");

          if (htmlEditor) htmlEditor.setValue(prettyHtml);
          else htmlInput.value = prettyHtml;

          if (cssEditor) cssEditor.setValue(prettyCss);
          else cssInput.value = prettyCss;

          if (jsEditor) jsEditor.setValue(prettyJs);
          else jsInput.value = prettyJs;
        };

        saveBtn.onclick = () => {
          const htmlValue = formatByType(
            htmlEditor ? htmlEditor.getValue() : htmlInput.value || "",
            "html"
          );
          const cssValue = formatByType(
            cssEditor ? cssEditor.getValue() : cssInput.value || "",
            "css"
          );
          const jsValue = formatByType(
            jsEditor ? jsEditor.getValue() : jsInput.value || "",
            "js"
          );

          jsRef.current = jsValue;
          ed.setComponents(htmlValue);
          ed.setStyle(cssValue);
          const next = buildContent(ed);
          if (next !== lastEmittedRef.current) {
            lastEmittedRef.current = next;
            onChange(next);
          }
          resetCodeCommandState();
          modal.close();
        };

        footer.appendChild(formatBtn);
        footer.appendChild(stretchBtn);
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        const content = document.createElement("div");
        content.style.display = "flex";
        content.style.flexDirection = "column";
        content.style.maxHeight = "82vh";
        content.style.overflow = "auto";
        content.style.paddingBottom = "2px";
        content.style.background = "#1f1f1f";
        content.appendChild(wrapper);
        content.appendChild(footer);

        modal.setTitle("Code");
        modal.setContent(content);
        modal.open();

        const modalModel = modal.getModel?.();
        if (modalModel) {
          const onModalChange = () => {
            const isOpen = modalModel.get?.("open");
            if (!isOpen) {
              resetCodeCommandState();
              modalModel.off?.("change:open", onModalChange);
            }
          };
          modalModel.on?.("change:open", onModalChange);
        }

        requestAnimationFrame(() => {
          const editorOptions = {
            theme: "material-darker",
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
          };

          htmlEditor = CodeMirror.fromTextArea(htmlInput, {
            ...editorOptions,
            mode: "htmlmixed",
          });
          cssEditor = CodeMirror.fromTextArea(cssInput, {
            ...editorOptions,
            mode: "css",
          });
          jsEditor = CodeMirror.fromTextArea(jsInput, {
            ...editorOptions,
            mode: "javascript",
          });

          htmlEditor.setSize("100%", baseEditorHeight);
          cssEditor.setSize("100%", baseEditorHeight);
          jsEditor.setSize("100%", baseEditorHeight);

          htmlEditor.getWrapperElement().style.borderRadius = "6px";
          cssEditor.getWrapperElement().style.borderRadius = "6px";
          jsEditor.getWrapperElement().style.borderRadius = "6px";

          htmlEditor.refresh();
          cssEditor.refresh();
          jsEditor.refresh();

          applyStretch();
        });
    };

    editor.Commands.add("cms:open-code", {
      run(ed: any) {
        openCodeModal(ed);
      },
      stop() {},
    });

    if (editor.Commands.has("open-code")) {
      editor.Commands.extend("open-code", {
        run(ed: any) {
          openCodeModal(ed);
        },
        stop() {},
      });
    } else {
      editor.Commands.add("open-code", {
        run(ed: any) {
          openCodeModal(ed);
        },
        stop() {},
      });
    }

    if (editor.Commands.has("core:open-code")) {
      editor.Commands.extend("core:open-code", {
        run(ed: any) {
          openCodeModal(ed);
        },
        stop() {},
      });
    } else {
      editor.Commands.add("core:open-code", {
        run(ed: any) {
          openCodeModal(ed);
        },
        stop() {},
      });
    }

    let isSidePanelHidden = false;
    let sidePanelWidth = 0;
    const applySidePanelVisibility = (hidden: boolean) => {
      const root = editor.getContainer() as HTMLElement;
      const viewsContainer = root.querySelector(".gjs-pn-views-container") as HTMLElement | null;
      const viewsPanel = root.querySelector(".gjs-pn-panel.gjs-pn-views") as HTMLElement | null;
      const canvas = root.querySelector(".gjs-cv-canvas") as HTMLElement | null;

      if (viewsContainer) {
        const measured = Math.round(viewsContainer.getBoundingClientRect().width);
        if (!sidePanelWidth && measured > 0) {
          sidePanelWidth = measured;
        }
        viewsContainer.style.transition = "width 220ms ease, opacity 180ms ease";
        viewsContainer.style.overflow = "hidden";
      }
      if (viewsPanel) {
        viewsPanel.style.transition = "opacity 180ms ease";
      }
      if (canvas) {
        canvas.style.transition = "right 220ms ease";
      }

      const expandedWidth = sidePanelWidth || 280;

      if (viewsContainer) {
        viewsContainer.style.width = hidden ? "0px" : `${expandedWidth}px`;
        viewsContainer.style.minWidth = hidden ? "0px" : `${expandedWidth}px`;
        viewsContainer.style.opacity = hidden ? "0" : "1";
        viewsContainer.style.pointerEvents = hidden ? "none" : "";
      }
      if (viewsPanel) {
        viewsPanel.style.opacity = hidden ? "0" : "1";
        viewsPanel.style.pointerEvents = hidden ? "none" : "";
      }
      if (canvas) {
        canvas.style.right = hidden ? "0px" : `${expandedWidth}px`;
      }
    };

    editor.Commands.add("cms:toggle-side-panel", {
      run(ed: any, sender: any) {
        isSidePanelHidden = !isSidePanelHidden;
        applySidePanelVisibility(isSidePanelHidden);
        if (sender?.set) {
          sender.set("active", isSidePanelHidden);
          sender.set("attributes", {
            ...(sender.get("attributes") || {}),
            title: isSidePanelHidden ? "Show Side Panel" : "Hide Side Panel",
          });
        }
      },
    });

    const panels = editor.Panels.getPanels();
    panels.forEach((panel: any) => {
      const buttons = panel.get("buttons");
      if (!buttons) return;
      buttons.forEach((btn: any) => {
        const cmd = btn.get("command");
        const id = btn.get("id");
        if (cmd === "core:open-code" || id === "open-code") {
          btn.set("command", "cms:open-code");
          btn.set("togglable", false);
          btn.set("active", false);
        }
      });
    });

    const optionsPanel = editor.Panels.getPanel("options");
    if (optionsPanel) {
      const optionsButtons = optionsPanel.get("buttons");
      const hasCustom = optionsButtons?.some((btn: any) => btn.get("id") === "cms-open-code");
      if (!hasCustom) {
        (optionsButtons as any)?.add({
          id: "cms-open-code",
          className: "fa fa-file-code-o",
          command: "cms:open-code",
          togglable: false,
          attributes: { title: "Edit Code" },
        } as any);
      }

      const hasToggleSide = optionsButtons?.some((btn: any) => btn.get("id") === "cms-toggle-side-panel");
      if (!hasToggleSide) {
        (optionsButtons as any)?.add({
          id: "cms-toggle-side-panel",
          className: "fa fa-columns",
          command: "cms:toggle-side-panel",
          togglable: false,
          attributes: { title: "Hide Side Panel" },
        } as any);
      }
    }

    const ensureUrlTraits = (component: any) => {
      if (!component) return;
      const tagName = String(component.get("tagName") || "").toLowerCase();

      if (tagName === "a") {
        component.set("traits", [
          {
            type: "text",
            name: "href",
            label: "URL",
            placeholder: "https://example.com",
          },
          {
            type: "select",
            name: "target",
            label: "Target",
            options: [
              { id: "", label: "Same tab" },
              { id: "_blank", label: "New tab" },
            ],
          },
          {
            type: "text",
            name: "rel",
            label: "Rel",
            placeholder: "noopener noreferrer",
          },
        ]);
      }

      if (tagName === "button") {
        component.set("traits", [
          {
            type: "text",
            name: "data-url",
            label: "URL",
            placeholder: "https://example.com",
          },
          {
            type: "select",
            name: "data-target",
            label: "Target",
            options: [
              { id: "", label: "Same tab" },
              { id: "_blank", label: "New tab" },
            ],
          },
        ]);
      }

      if (tagName === "video" || tagName === "iframe") {
        component.set("traits", [
          {
            type: "text",
            name: "src",
            label: "URL",
            placeholder: "https://...",
          },
          {
            type: "checkbox",
            name: "allowfullscreen",
            label: "Allow Fullscreen",
            valueTrue: "allowfullscreen",
            valueFalse: "",
          },
        ]);
      }
    };

    editor.on("component:selected", (component: any) => {
      ensureUrlTraits(component);

      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (["a", "button", "video", "iframe"].includes(tagName)) {
        const traitsBtn = editor.Panels.getButton("views", "open-tm");
        if (traitsBtn && !traitsBtn.get("active")) {
          traitsBtn.set("active", true);
        }
      }
    });

    editor.on("component:update:attributes:data-url", (component: any) => {
      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (tagName !== "button") return;

      const attrs = component.getAttributes?.() || {};
      const url = String(attrs["data-url"] || "").trim();
      if (!url) {
        const nextOnClick = String(attrs.onclick || "").replace(/window\.open\([^)]*\);?/g, "").replace(/window\.location\.href\s*=\s*[^;]+;?/g, "").trim();
        component.addAttributes({ onclick: nextOnClick });
        return;
      }

      const target = String(attrs["data-target"] || "").trim();
      const escaped = JSON.stringify(url);
      const onClick = target === "_blank"
        ? `window.open(${escaped}, '_blank');`
        : `window.location.href=${escaped};`;

      component.addAttributes({ onclick: onClick });
    });

    editor.on("component:update:attributes:data-target", (component: any) => {
      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (tagName !== "button") return;
      const attrs = component.getAttributes?.() || {};
      if (!attrs["data-url"]) return;
      const url = String(attrs["data-url"] || "").trim();
      const target = String(attrs["data-target"] || "").trim();
      const escaped = JSON.stringify(url);
      const onClick = target === "_blank"
        ? `window.open(${escaped}, '_blank');`
        : `window.location.href=${escaped};`;
      component.addAttributes({ onclick: onClick });
    });

    editorRef.current = editor;

    const emit = () => {
      const next = buildContent(editor);
      if (next !== lastEmittedRef.current) {
        lastEmittedRef.current = next;
        onChange(next);
      }
    };

    editor.on("update", emit);

    return () => {
      try {
        editor.off("update", emit);
        editor.destroy();
      } catch {
        // ignore destroy errors
      }
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const incoming = value || "";
    if (!incoming || incoming === lastEmittedRef.current) return;

    const { body, css, js } = extractContentParts(incoming);
    jsRef.current = js;
    editor.setComponents(body || "");
    editor.setStyle(css || "");
    lastEmittedRef.current = incoming;
  }, [value]);

  return <div ref={hostRef} />;
}
