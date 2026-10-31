import { useEffect, useState } from 'react'
import Admin from './Admin.jsx'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'


const navigation = [
  { label: 'Home', href: '#home', icon: 'home' },
  { label: 'About', href: '#about', icon: 'about' },
  { label: 'Services', href: '#services', icon: 'services' },
  { label: 'Why Us', href: '#why-us', icon: 'why' },
  { label: 'Industries', href: '#industries', icon: 'industries' },
  { label: 'Contact', href: '#contact', icon: 'contact' },
]

function SiteIcon({ name }) {
  const paths = {
    home: 'M3 10.5 12 3l9 7.5M5 9v12h14V9M9 21v-7h6v7',
    about: 'M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
    services: 'M3 7h18v14H3zM7 7V4h10v3M3 12h18',
    why: 'm12 3 2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z',
    industries: 'M3 21V8l9-5 9 5v13M3 21h18M8 21v-6h8v6M8 10h.01M16 10h.01',
    contact: 'M4 4h16v16H4zM4 7l8 6 8-6',
    location: 'M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    phone: 'M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
    email: 'M3 5h18v14H3zM3 6l9 7 9-7',
  }

  return (
    <svg viewBox="0 0 24 24" width="17" height="17"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}


const defaultImages = [
  '/images/hero1.png',
  '/images/hero2.png',
  '/images/hero3.png',
]

function visibleText(value) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  return /^(add (the|your)|details to be confirmed|nothing$)|^(service|industry)\s+\d+$/i.test(text)
    ? ''
    : text
}

function contentItems(value) {
  if (!Array.isArray(value)) return []

  return value
    .map(item => (typeof item === 'string' ? { title: item } : item))
    .filter(item => item && typeof item === 'object' && visibleText(item.title))
}

function HeroSlideshow({ images }) {
  const [activeImage, setActiveImage] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const safeActiveImage = activeImage % Math.max(images.length, 1)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(preference.matches)

    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion || images.length < 2) return undefined

    const timer = window.setInterval(() => {
      setActiveImage(current => (current + 1) % images.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [isPaused, prefersReducedMotion, images.length])

  const showImage = index => {
    if (images.length) setActiveImage((index + images.length) % images.length)
  }

  return (
    <div className="hero-slideshow" aria-hidden="true">
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          className={`hero-image${index === safeActiveImage ? ' is-active' : ''}`}
          src={image}
          alt=""
          fetchPriority={index === 0 ? 'high' : 'auto'}
          onError={event => {
            event.currentTarget.hidden = true
          }}
        />
      ))}
      <div className="hero-overlay" />
      {images.length > 1 && (
        <div className="slideshow-controls">
          <button
            className="slide-control"
            type="button"
            aria-label="Previous image"
            onClick={() => showImage(safeActiveImage - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="slide-control"
            type="button"
            aria-label="Next image"
            onClick={() => showImage(safeActiveImage + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
          {!prefersReducedMotion && (
            <button
              className="slide-control slide-pause"
              type="button"
              aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
              onClick={() => setIsPaused(paused => !paused)}
            >
              <span aria-hidden="true">{isPaused ? '▶' : 'Ⅱ'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}


function PolicySection({ title, text, id }) {
  const policyText = visibleText(text)
  if (!policyText) return null

  return (
    <section className="section policy-section" id={id}>
      <span className="eyebrow">LEGAL INFORMATION</span>
      <h2>{title}</h2>
      <div className="policy-content">
        {policyText.split('\n').filter(Boolean).map((paragraph, index) => (
          <p key={`${id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}

function Website() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
  const isPrivacyPage = currentPath === '/privacy-policy'
  const isTermsPage = currentPath === '/terms-and-conditions'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [content, setContent] = useState({})
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState('')
  const [activeIndustry, setActiveIndustry] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })
  const [formStatus, setFormStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    const images = document.querySelectorAll(
      '.about-image-wrap img, .service-image-wrap img, .industry-image img'
    )

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view')
          } else {
            entry.target.classList.remove('is-in-view')
          }
        })
      },
      { threshold: 0.35 }
    )

    images.forEach(image => observer.observe(image))

    return () => observer.disconnect()
  }, [content, activeIndustry])

  useEffect(() => {
    const controller = new AbortController()

    async function loadContent() {
      setContentError('')
      try {
        const response = await fetch(`${API_URL}/api/content`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Could not load website content.')
        const data = await response.json()
        setContent(data)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setContentError(
            'Some website content could not be loaded. Please try again later.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setContentLoading(false)
      }
    }

    loadContent()
    return () => controller.abort()
  }, [])

  const hero = content.hero || {}
  const about = content.about || {}
  const services = content.services || {}
  const industries = content.industries || {}
  const benefits = content.benefits || {}
  const whyUs = content.whyUs || {}
  const process = content.process || {}
  const contact = content.contact || {}
  const policies = content.policies || {}
  const seo = content.seo || {}
  const slides = Array.isArray(hero.slides) ? hero.slides : []
  const heroImages = slides
    .map(slide => slide?.image)
    .filter(image => typeof image === 'string' && image.trim())
  const serviceItems = contentItems(services.items)
  const industryItems = contentItems(industries.items)
  const benefitItems = contentItems(benefits.items)
  const whyUsItems = contentItems(whyUs.items)
  const processItems = contentItems(process.items)
  const selectedIndustry = industryItems[activeIndustry] || industryItems[0]
  const contactPhone = typeof contact.phone === 'string' ? contact.phone.trim() : ''
  const contactEmail = typeof contact.email === 'string' ? contact.email.trim() : ''
  const contactAddress = typeof contact.address === 'string' ? contact.address.trim() : ''
  const mapImage = typeof contact.mapImage === 'string' ? contact.mapImage.trim() : ''
  const whatsapp = typeof contact.whatsapp === 'string' ? contact.whatsapp.replace(/\D/g, '') : ''

  useEffect(() => {
    if (seo.title) document.title = seo.title

    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.name = 'description'
      document.head.appendChild(descriptionTag)
    }
    if (seo.description) descriptionTag.content = seo.description
  }, [seo.title, seo.description])

  const updateForm = event => {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  async function submitEnquiry(event) {
    event.preventDefault()
    setSubmitting(true)
    setFormStatus('')

    try {
      const response = await fetch(`${API_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to submit your enquiry.')

      setFormStatus(result.message || 'Thank you! Your enquiry has been submitted.')
      setForm({ name: '', email: '', phone: '', service: '', message: '' })
    } catch (error) {
      setFormStatus(error.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="website">
      <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
        <a
          className="brand"
          href={currentPath === '/' ? '#home' : '/#home'}
          aria-label="Sri Sai Manpower Services home"
          onClick={() => setIsMenuOpen(false)}
        >
          <img className="brand-logo" src="/images/sai2.png" alt="Sri Sai Manpower Services" />
          <span className="brand-copy">
            <strong>SRI SAI</strong>
            <small>MANPOWER SERVICES</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`nav-links${isMenuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          {navigation.map(item => (
            <a
  key={item.href}
  href={currentPath === '/' ? item.href : `/${item.href}`}
  onClick={() => setIsMenuOpen(false)}
>
              <SiteIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <a className="quote-button header-quote" href={currentPath === '/' ? '#contact' : '/#contact'}>
          Get a Quote <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        {isPrivacyPage ? (
          <PolicySection title="Privacy Policy" text={policies.privacyPolicy} />
        ) : isTermsPage ? (
          <PolicySection title="Terms & Conditions" text={policies.termsConditions} />
        ) : (
          <>
            <section className="hero" id="home" aria-labelledby="hero-title">
              <HeroSlideshow images={heroImages.length ? heroImages : defaultImages} />
              <div className="hero-content">
                <span className="eyebrow hero-label">SRI SAI MANPOWER SERVICES</span>
                <span className="hero-rule" aria-hidden="true" />
                <h1 id="hero-title">
                  {visibleText(hero.title) || 'Sri Sai Manpower Services'}
                  {visibleText(hero.subtitle) && (
                    <>
                      <br />
                      <span>{visibleText(hero.subtitle)}</span>
                    </>
                  )}
                </h1>
                {visibleText(hero.description) && <p>{visibleText(hero.description)}</p>}
                <div className="hero-actions">
                  <a className="quote-button" href="#contact">
                    Get a Quote <span aria-hidden="true">↗</span>
                  </a>
                  {whatsapp ? (
                    <a
                      className="secondary-button"
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp Us <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <a className="secondary-button" href="#contact">
                      Contact Us <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                <div className="hero-stats">
                  {contentItems(hero.highlights).slice(0, 3).map((item, index) => (
                    <div key={`${item.title}-${index}`}>
                      <strong>{item.title}</strong>
                      {visibleText(item.description) && <span>{item.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {benefitItems.length > 0 && (
              <section className="foundation" aria-labelledby="foundation-title">
                <div className="foundation-heading">
                  <span className="eyebrow">FOUNDATION OF SERVICE</span>
                  <h2 id="foundation-title">
                    {visibleText(benefits.title) || 'Reliable Support. Every Day.'}
                  </h2>
                </div>
                <div className="benefit-grid">
                  {benefitItems.map((item, index) => (
                    <article className="benefit" key={`${item.title}-${index}`}>
                      <span className="benefit-icon" aria-hidden="true">
                        {['✓', '◇', '◷', '♡'][index % 4]}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        {visibleText(item.description) && <p>{item.description}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {visibleText(about.description) && (
              <section className="section about-section" id="about">
                <div className="about-copy">
                  <span className="eyebrow">ABOUT US</span>
                  <h2>{visibleText(about.title) || 'Your Trusted Facility Service Partner'}</h2>
                  <p>{visibleText(about.description)}</p>
                  {contentItems(about.highlights).length > 0 && (
                    <div className="about-highlights">
                      {contentItems(about.highlights).map((item, index) => (
                        <article key={`${item.title}-${index}`}>
                          <span className="small-icon" aria-hidden="true">✦</span>
                          <div>
                            <h3>{item.title}</h3>
                            {visibleText(item.description) && <p>{item.description}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  <a className="quote-button about-button" href="#services">
                    View Services <span aria-hidden="true">→</span>
                  </a>
                </div>
                <div className="about-image-wrap">
                  <img
                    src={visibleText(about.image) || '/images/Property 1=Default (3).png'}
                    alt="Sri Sai service team"
                    loading="lazy"
                  />
                  {visibleText(about.highlight) && (
                    <div className="image-caption">
                      <span className="eyebrow">FIELD QUALITY</span>
                      <p>{visibleText(about.highlight)}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {serviceItems.length > 0 && (
              <section className="section services-section" id="services">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">OUR SERVICES</span>
                    <h2>{visibleText(services.title) || 'Complete Facility Support Under One Roof'}</h2>
                  </div>
                  {visibleText(services.description) && <p>{visibleText(services.description)}</p>}
                </div>

                <div className="service-list">
                  {serviceItems.map((item, index) => (
                    <article
                      className={`service-card${index % 2 ? ' service-card-reversed' : ''}`}
                      key={`${item.title}-${index}`}
                    >
                      <div className="service-image-wrap">
                        <img
                          src={visibleText(item.image) || defaultImages[index % defaultImages.length]}
                          alt={item.title}
                          loading="lazy"
                        />
                        <span className="image-tag">SRI SAI MANPOWER SERVICES</span>
                      </div>
                      <div className="service-copy">
                        <div className="service-kicker">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <span className="eyebrow">{item.title}</span>
                        </div>
                        <h3>{visibleText(item.heading) || item.title}</h3>
                        {visibleText(item.description) && <p>{visibleText(item.description)}</p>}
                        {contentItems(item.details).length > 0 && (
                          <ul className="service-details">
                            {contentItems(item.details).map((detail, detailIndex) => (
                              <li key={`${detail.title}-${detailIndex}`}>{detail.title}</li>
                            ))}
                          </ul>
                        )}
                        <a className="quote-button service-button" href="#contact">
                          {visibleText(item.button) || 'Request Service'}
                          <span aria-hidden="true">→</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {whyUsItems.length > 0 && (
              <section className="section why-section" id="why-us">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">WHY CHOOSE US</span>
                    <h2>{visibleText(whyUs.title) || 'More Than A Service. A Reliable Partner.'}</h2>
                  </div>
                  {visibleText(whyUs.description) && <p>{visibleText(whyUs.description)}</p>}
                </div>
                <div className="why-grid">
                  {whyUsItems.map((item, index) => (
                    <article className="why-card" key={`${item.title}-${index}`}>
                      <div className="why-card-top">
                        <span className="benefit-icon" aria-hidden="true">
                          {['♧', '⚙', '◎', '◷', '◇'][index % 5]}
                        </span>
                        <span className="why-number">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <h3>{item.title}</h3>
                      {visibleText(item.description) && <p>{visibleText(item.description)}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {industryItems.length > 0 && (
              <section className="section industries-section" id="industries">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">SECTOR EXPERTISE</span>
                    <h2>{visibleText(industries.title) || 'Industries We Serve'}</h2>
                  </div>
                  {visibleText(industries.description) && <p>{visibleText(industries.description)}</p>}
                </div>
                <div className="industry-showcase">
                  <div className="industry-list" role="list">
                    {industryItems.map((item, index) => (
                      <button
                        className={`industry-item${index === activeIndustry ? ' is-active' : ''}`}
                        key={`${item.title}-${index}`}
                        type="button"
                        aria-pressed={index === activeIndustry}
                        onClick={() => setActiveIndustry(index)}
                      >
                        <span className="industry-index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="industry-name">
                          {item.title}
                          {visibleText(item.description) && <small>{visibleText(item.description)}</small>}
                        </span>
                        <span className="industry-arrow" aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                  <div className="industry-image">
                    <img
                      src={visibleText(selectedIndustry?.image || industries.image) || '/images/Property 1=Default (5).png'}
                      alt={selectedIndustry?.title || 'Facilities served'}
                      loading="lazy"
                    />
                    <span>{selectedIndustry?.title || ''}</span>
                  </div>
                </div>
              </section>
            )}

            {processItems.length > 0 && (
              <section className="section process-section">
                <div className="process-heading">
                  <span className="eyebrow">OUR PROCESS</span>
                  <h2>{visibleText(process.title) || 'Simple Process. Professional Execution.'}</h2>
                </div>
                <ol className="process-list">
                  {processItems.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      <span className="process-number">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{item.title}</h3>
                        {visibleText(item.description) && <p>{visibleText(item.description)}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {serviceItems.length > 0 && (
              <section className="solutions-section">
                <span className="eyebrow">INTEGRATED SOLUTIONS</span>
                <h2>One Partner.<br /><span>Multiple Solutions.</span></h2>
                <div className="solutions-grid">
                  {serviceItems.map((item, index) => (
                    <a className="solution-item" href="#contact" key={`${item.title}-${index}`}>
                      <span className="solution-icon" aria-hidden="true">
                        {['◇', '♧', '✦'][index % 3]}
                      </span>
                      <h3>{item.title}</h3>
                      {visibleText(item.heading) && <p>{visibleText(item.heading)}</p>}
                    </a>
                  ))}
                </div>
                <p className="solution-note">One reliable partner for your facility requirements.</p>
                <a className="quote-button" href="#contact">Talk to Our Team</a>
              </section>
            )}

            <section className="contact-section" id="contact">
              <div className="contact-copy">
                <span className="eyebrow">DIRECT PROCUREMENT</span>
                <h2>{visibleText(contact.title) || 'Need Professional Facility Support?'}</h2>
                <p><p>Tell us what you need. Our facility operations specialists review requirements within 4 business hours to provide initial staffing requirements and pricing estimates.</p></p>
                <div className="contact-details">
                  {contactPhone && (
                    <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>
                      <span className="contact-phone-icon">
                        <SiteIcon name="phone" />
                      </span>
                      <span><small>PHONE</small>{contactPhone}</span>
                    </a>
                  )}
                  {contactEmail && (
                    <a href={`mailto:${contactEmail}`}>
                      <span aria-hidden="true">✉</span>
                      <span><small>EMAIL</small>{contactEmail}</span>
                    </a>
                  )}
                  {contactAddress && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`} target="_blank" rel="noreferrer">
                      <span aria-hidden="true">⌖</span>
                      <span><small>ADDRESS</small>{contactAddress}</span>
                    </a>
                  )}
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                      <span aria-hidden="true">↗</span>
                      <span><small>WHATSAPP</small>Message our team</span>
                    </a>
                  )}
                </div>
                {mapImage && (
                  <div className="contact-map">
                    <img src={mapImage} alt="Sri Sai Manpower Services location map" />
                  </div>
                )}

                {visibleText(contact.responseTime) && (
                  <div className="contact-note">
                    <span className="eyebrow">ENQUIRY SUPPORT</span>
                    <p>{visibleText(contact.responseTime)}</p>
                  </div>
                )}
              </div>

              <form className="enquiry-form" onSubmit={submitEnquiry}>
                <h3>Enquiry Form</h3>
                <label>
                  Full Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    required
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Phone *
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={updateForm}
                      required
                      maxLength={30}
                      autoComplete="tel"
                      placeholder="Your phone number"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateForm}
                      maxLength={254}
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
                <label>
                  Service Required
                  {serviceItems.length > 0 ? (
                    <select name="service" value={form.service} onChange={updateForm}>
                      <option value="">Select a service</option>
                      {serviceItems.map((item, index) => (
                        <option key={`${item.title}-${index}`} value={item.title}>{item.title}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="service"
                      value={form.service}
                      onChange={updateForm}
                      maxLength={150}
                      placeholder="Service required"
                    />
                  )}
                </label>
                <label>
                  Requirements / Message *
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={updateForm}
                    required
                    rows={4}
                    maxLength={3000}
                    placeholder="Tell us about your workforce or service requirements"
                  />
                </label>
                <button className="quote-button submit-button" type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Enquiry'} <span aria-hidden="true">→</span>
                </button>
                {formStatus && <p className="form-status" role="status" aria-live="polite">{formStatus}</p>}
              </form>
            </section>

            {contentError && <p className="content-error" role="status">{contentError}</p>}
            {contentLoading && <p className="content-loading">Loading website content...</p>}
          </>
        )}
      </main>

      <section className="closing-cta">
        <div className="closing-cta-content">
          <span className="eyebrow">SRI SAI MANPOWER SERVICES</span>
          <h2>Ready to get <span>started?</span></h2>
          <p>Tell us about your requirements and connect with our team.</p>
          <div className="hero-actions">
            {whatsapp ? (
              <a className="quote-button" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                WhatsApp Us
              </a>
            ) : (
              <a className="quote-button" href="#contact">Talk to Our Team</a>
            )}
            <a
  className="secondary-button"
  href={currentPath === '/' ? '#contact' : '/#contact'}
>
  Request a Quote
</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">

        <div className="footer-main">
          <div className="footer-about">
            <a className="brand footer-brand" href={currentPath === '/' ? '#home' : '/#home'} aria-label="Sri Sai Manpower Services home">
              <img className="footer-logo-image" src="/images/footer-logo.png" alt="Sri Sai Manpower Services" />
            </a>
            <p>{visibleText(about.description) || 'Sri Sai Manpower Services'}</p>
          </div>

          <div className="footer-column">
            <h3>Core Services</h3>
            {serviceItems.map((item, index) => (
              <a
  href={currentPath === '/' ? '#services' : '/#services'}
  key={`${item.title}-${index}`}
>
                <SiteIcon name="services" />
                <span>{item.title}</span>
              </a>
            ))}
          </div>

          <div className="footer-column">
            <h3>Quick Links</h3>
            {navigation.map(item => (
              <a
  key={item.href}
  href={currentPath === '/' ? item.href : `/${item.href}`}
>
                <SiteIcon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div className="footer-column footer-contact">
            <h3>Contact</h3>
            {contactAddress && (
              <span className="footer-contact-item">
                <SiteIcon name="location" />
                <span>{contactAddress}</span>
              </span>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>
                <SiteIcon name="phone" />
                <span>{contactPhone}</span>
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}>
                <SiteIcon name="email" />
                <span>{contactEmail}</span>
              </a>
            )}
          </div>

        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sri Sai Manpower Services</span>
          <div className="footer-policy-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-and-conditions">Terms & Conditions</a>
            <a href="/admin">Admin Login</a>
          </div>
        </div>
      </footer >
    </div >
  )
}

function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/admin') return <Admin />
  return <Website />
}

export default App
