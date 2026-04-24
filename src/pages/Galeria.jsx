import { useState } from 'react';
import Navbar from '../components/Navbar';
import '../styles/galeria.css';

/* Glob all images from both years */
const raw2024 = import.meta.glob(
  '../assets/imagenes_torneo/2024/*',
  { eager: true, query: '?url', import: 'default' },
);
const raw2025 = import.meta.glob(
  '../assets/imagenes_torneo/2025/*',
  { eager: true, query: '?url', import: 'default' },
);

function toLabel(path) {
  return path
    .split('/').pop()
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const GALLERY_2025 = Object.entries(raw2025).map(([path, url]) => ({
  url,
  label: toLabel(path),
  path,
}));

const GALLERY_2024 = Object.entries(raw2024).map(([path, url]) => ({
  url,
  label: toLabel(path),
  path,
}));

function GallerySection({ year, title, items }) {
  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="gallery-year-section">
      <div className="gallery-year-header">
        <span className="gallery-year-tag">{year}</span>
        <h2 className="gallery-year-title">{title}</h2>
      </div>

      <div className="gallery-grid">
        {items.map((img, i) => (
          <button
            key={img.path}
            className={`gallery-item${i === 0 ? ' gallery-item--hero' : ''}`}
            type="button"
            onClick={() => setLightbox(img)}
            aria-label={`Ver foto: ${img.label}`}
          >
            <img src={img.url} alt={img.label} loading="lazy" />
            <div className="gallery-item-overlay">
              <span className="gallery-item-label">{img.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.label}
          onClick={() => setLightbox(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.label}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="lightbox-caption">{lightbox.label}</p>
        </div>
      )}
    </div>
  );
}

function Galeria() {
  return (
    <>
      <Navbar mode="public" />
      <main className="public-page galeria-page">

        <div className="page-hero-small">
          <h1><span>Galería</span></h1>
          <p>Momentos memorables de los torneos de la Facultad</p>
        </div>

        <section className="galeria-section">
          <GallerySection
            year="2025"
            title="Super Copa – Champions League"
            items={GALLERY_2025}
          />
          <GallerySection
            year="2024"
            title="Super Copa de Ingeniería de Sistemas"
            items={GALLERY_2024}
          />
        </section>

        <footer className="landing-footer">
          <div className="footer-logo"><em>Code</em> Cup</div>
          <div className="footer-text">© 2026 · Facultad de Ingeniería de Sistemas · UFPS Cúcuta</div>
        </footer>

      </main>
    </>
  );
}

export default Galeria;
