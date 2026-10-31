import { useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const CONTENT_LABELS = {
  hero: 'Hero / Banner',
  about: 'About Us',
  services: 'Services',
  industries: 'Industries',
  benefits: 'Why Choose Us',
  whyUs: 'Why Choose Us Details',
  process: 'Our Process',
  contact: 'Contact Details',
  seo: 'SEO Settings',
}

const POLICY_KEY = 'policies'

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f5f9',
    color: '#17233d',
    fontFamily: 'Arial, sans-serif',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  brand: { margin: 0, fontSize: 25 },
  muted: { color: '#718096', fontSize: 14 },
  button: {
    padding: '11px 17px',
    background: '#142b50',
    color: '#fff',
    border: 0,
    borderRadius: 7,
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondary: {
    padding: '10px 15px',
    background: '#e8edf5',
    color: '#142b50',
    border: '1px solid #d5dce8',
    borderRadius: 7,
    cursor: 'pointer',
    fontWeight: 600,
  },
  danger: {
    padding: '10px 15px',
    background: '#fff0f0',
    color: '#b42318',
    border: '1px solid #f4caca',
    borderRadius: 7,
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 22,
  },
  panel: {
    background: '#fff',
    padding: 24,
    borderRadius: 13,
    boxShadow: '0 3px 18px #17233d0b',
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 15,
    marginBottom: 22,
  },
  stat: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 3px 18px #17233d0b',
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    border: '1px solid #ccd3df',
    borderRadius: 7,
    marginTop: 7,
    marginBottom: 16,
    fontSize: 14,
    background: '#fff',
    color: '#17233d',
  },
  textarea: {
    display: 'block',
    width: '100%',
    minHeight: 280,
    boxSizing: 'border-box',
    padding: 14,
    border: '1px solid #ccd3df',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 15,
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: 'monospace',
    resize: 'vertical',
  },
  label: { display: 'block', fontWeight: 600, fontSize: 14 },
  card: {
    border: '1px solid #e1e6ef',
    borderRadius: 9,
    padding: 16,
    marginTop: 14,
    overflowWrap: 'anywhere',
  },
  message: {
    padding: 13,
    borderRadius: 8,
    background: '#eaf3ff',
    color: '#174477',
    marginBottom: 18,
  },
  error: {
    padding: 13,
    borderRadius: 8,
    background: '#fff0f0',
    color: '#b42318',
    marginBottom: 18,
  },
}

function parseValue(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value ?? {}
}

export default function Admin() {
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [section, setSection] = useState('dashboard')
  const [records, setRecords] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [selectedKey, setSelectedKey] = useState('hero')
  const [editor, setEditor] = useState('')
  const [privacyPolicy, setPrivacyPolicy] = useState('')
  const [termsConditions, setTermsConditions] = useState('')
  const [policyLoaded, setPolicyLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')

  const publishedCount = records.filter(item => Number(item.is_published) === 1).length
  const newEnquiries = enquiries.filter(item => item.status === 'new').length

  const contentRecords = useMemo(
    () => records.filter(item => item.content_key !== POLICY_KEY),
    [records],
  )

  async function request(path, options = {}, authToken = token) {
    const isFormData = options.body instanceof FormData
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`)
    }

    return data
  }

  async function uploadImage(event) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    const body = new FormData()
    body.append('image', file)
    setUploading(true)
    setUploadedImageUrl('')
    setError('')
    setMessage('')

    try {
      const data = await request('/api/admin/uploads', { method: 'POST', body })
      if (!data.url) throw new Error('The server did not return an image URL.')
      setUploadedImageUrl(data.url)
      notify('Image uploaded. Copy its URL into the relevant image field in the content JSON.')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setUploading(false)
    }
  }

  async function copyUploadedImageUrl() {
    try {
      await navigator.clipboard.writeText(uploadedImageUrl)
      notify('Image URL copied to clipboard.')
    } catch {
      notify('Could not copy the image URL. Select and copy it manually.', true)
    }
  }

  function notify(text, isError = false) {
    setMessage(isError ? '' : text)
    setError(isError ? text : '')
  }

  async function loadDashboard(authToken) {
    setLoading(true)
    setError('')

    try {
      const [contentData, enquiryData] = await Promise.all([
        request('/api/admin/content', {}, authToken),
        request('/api/admin/enquiries', {}, authToken),
      ])

      if (!Array.isArray(contentData) || !Array.isArray(enquiryData)) {
        throw new Error('Unexpected dashboard response from server.')
      }

      const normalized = contentData.map(item => ({
        ...item,
        content_value: parseValue(item.content_value),
      }))

      setRecords(normalized)
      setEnquiries(enquiryData)

      const policyRecord = normalized.find(item => item.content_key === POLICY_KEY)
      const policyValue = policyRecord?.content_value || {}

      setPrivacyPolicy(
        typeof policyValue.privacyPolicy === 'string'
          ? policyValue.privacyPolicy
          : '',
      )
      setTermsConditions(
        typeof policyValue.termsConditions === 'string'
          ? policyValue.termsConditions
          : '',
      )
      setPolicyLoaded(true)

      const firstRecord = normalized.find(item => item.content_key === 'hero')
        || normalized.find(item => item.content_key !== POLICY_KEY)

      if (firstRecord) {
        setSelectedKey(firstRecord.content_key)
        setEditor(JSON.stringify(firstRecord.content_value, null, 2))
      }

      notify('Dashboard loaded successfully.')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  async function login(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = await request(
        '/api/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({ username: username.trim(), password }),
        },
        '',
      )

      if (!data.token) throw new Error('Login token was not returned.')

      setToken(data.token)
      await loadDashboard(data.token)
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  function selectContent(key) {
    setSelectedKey(key)
    const record = contentRecords.find(item => item.content_key === key)
    setEditor(JSON.stringify(record?.content_value ?? {}, null, 2))
    setError('')
    setMessage('')
  }

  function changeSection(nextSection) {
    setSection(nextSection)
    setError('')
    setMessage('')

    if (nextSection === 'content') {
      const record = contentRecords.find(item => item.content_key === selectedKey)
        || contentRecords[0]

      if (record) {
        setSelectedKey(record.content_key)
        setEditor(JSON.stringify(record.content_value, null, 2))
      }
    }
  }

  async function saveContent() {
    if (!selectedKey) {
      notify('Please select a content section.', true)
      return
    }

    let value

    try {
      value = JSON.parse(editor)
    } catch {
      notify('Invalid JSON. Please correct the format before saving.', true)
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await request(`/api/admin/content/${encodeURIComponent(selectedKey)}`, {
        method: 'PUT',
        body: JSON.stringify({ value, is_published: true }),
      })

      setRecords(previous => previous.map(item =>
        item.content_key === selectedKey
          ? { ...item, content_value: value, is_published: 1 }
          : item,
      ))

      notify(`${CONTENT_LABELS[selectedKey] || selectedKey} saved and published.`)
    } catch (err) {
      notify(err.message, true)
    } finally {
      setSaving(false)
    }
  }

  async function savePolicies() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const value = { privacyPolicy, termsConditions }

      await request(`/api/admin/content/${POLICY_KEY}`, {
        method: 'PUT',
        body: JSON.stringify({ value, is_published: true }),
      })

      setRecords(previous => {
        const exists = previous.some(item => item.content_key === POLICY_KEY)

        if (exists) {
          return previous.map(item =>
            item.content_key === POLICY_KEY
              ? { ...item, content_value: value, is_published: 1 }
              : item,
          )
        }

        return [
          ...previous,
          {
            content_key: POLICY_KEY,
            content_value: value,
            is_published: 1,
          },
        ]
      })

      notify('Privacy Policy and Terms & Conditions saved and published.')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setSaving(false)
    }
  }

  async function refreshEnquiries() {
    setLoading(true)
    try {
      const data = await request('/api/admin/enquiries')
      setEnquiries(data)
      notify('Enquiries refreshed.')
    } catch (err) {
      notify(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setEnquiries(previous => previous.map(item =>
        item.id === id ? { ...item, status } : item,
      ))

      notify('Enquiry status updated.')
    } catch (err) {
      notify(err.message, true)
    }
  }

  function logout() {
    setToken('')
    setPassword('')
    setRecords([])
    setEnquiries([])
    setSelectedKey('hero')
    setEditor('')
    setPrivacyPolicy('')
    setTermsConditions('')
    setPolicyLoaded(false)
    setSection('dashboard')
    notify('You have logged out.')
  }

  if (!token) {
    return (
      <main style={{
        ...styles.page,
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}>
        <form
          onSubmit={login}
          style={{
            ...styles.panel,
            width: 'min(100%, 390px)',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={styles.brand}>Admin Login</h1>
          <p style={styles.muted}>Sri Sai Manpower Services</p>

          <label style={styles.label} htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            style={styles.input}
            autoComplete="username"
            value={username}
            onChange={event => setUsername(event.target.value)}
            required
          />

          <label style={styles.label} htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            style={styles.input}
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />

          <button style={{ ...styles.button, width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {error && <p style={styles.error} role="alert">{error}</p>}
          <p style={styles.muted}>
            <a href="/">Back to website</a>
          </p>
        </form>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brand}>Admin Dashboard</h1>
          <p style={styles.muted}>Sri Sai Manpower Services · Website Management</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={styles.secondary} onClick={() => loadDashboard(token)} disabled={loading}>
            Refresh
          </button>
          <button style={styles.button} onClick={logout}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav} aria-label="Admin sections">
        {[
          ['dashboard', 'Dashboard'],
          ['content', 'Website Content'],
          ['policies', 'Privacy & Terms'],
          ['enquiries', `Enquiries (${enquiries.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => changeSection(key)}
            style={section === key ? styles.button : styles.secondary}
          >
            {label}
          </button>
        ))}
      </nav>

      {message && <p style={styles.message} role="status">{message}</p>}
      {error && <p style={styles.error} role="alert">{error}</p>}

      {section === 'dashboard' && (
        <>
          <div style={styles.grid}>
            <div style={styles.stat}>
              <p style={styles.muted}>Content Sections</p>
              <h2>{records.length}</h2>
            </div>
            <div style={styles.stat}>
              <p style={styles.muted}>Published Sections</p>
              <h2>{publishedCount}</h2>
            </div>
            <div style={styles.stat}>
              <p style={styles.muted}>Total Enquiries</p>
              <h2>{enquiries.length}</h2>
            </div>
            <div style={styles.stat}>
              <p style={styles.muted}>New Enquiries</p>
              <h2>{newEnquiries}</h2>
            </div>
          </div>

          <section style={styles.panel}>
            <h2>Welcome to Website Management</h2>
            <p>Manage your website content, legal policies and customer enquiries here.</p>
            <p style={styles.muted}>
              Changes are saved to the MySQL database through the protected admin API.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button style={styles.button} onClick={() => changeSection('content')}>
                Edit Website Content
              </button>
              <button style={styles.secondary} onClick={() => changeSection('policies')}>
                Edit Privacy & Terms
              </button>
              <button style={styles.secondary} onClick={() => changeSection('enquiries')}>
                View Enquiries
              </button>
            </div>
          </section>
        </>
      )}

      {section === 'content' && (
        <section style={styles.panel}>
          <h2>Website Content Editor</h2>
          <p style={styles.muted}>
            Select a section, edit its JSON content and save it to publish.
          </p>

          <label style={styles.label} htmlFor="content-select">Website section</label>
          <select
            id="content-select"
            style={styles.input}
            value={selectedKey}
            onChange={event => selectContent(event.target.value)}
          >
            {contentRecords.map(item => (
              <option key={item.content_key} value={item.content_key}>
                {CONTENT_LABELS[item.content_key] || item.content_key}
              </option>
            ))}
          </select>

          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Upload a website image</h3>
            <p style={styles.muted}>
              JPEG, PNG, GIF or WebP; maximum file size 5 MB. Uploaded images are stored on the backend server.
            </p>
            <label style={styles.label} htmlFor="website-image-upload">Image file</label>
            <input
              id="website-image-upload"
              style={styles.input}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={uploadImage}
              disabled={uploading}
            />
            {uploading && <p role="status">Uploading image...</p>}
            {uploadedImageUrl && (
              <div>
                <p style={{ overflowWrap: 'anywhere' }}>
                  Uploaded image URL: <a href={uploadedImageUrl} target="_blank" rel="noreferrer">{uploadedImageUrl}</a>
                </p>
                <button type="button" style={styles.secondary} onClick={copyUploadedImageUrl}>
                  Copy image URL
                </button>
              </div>
            )}
          </div>

          {selectedKey && (
            <>
              <p>
                Editing: <strong>{CONTENT_LABELS[selectedKey] || selectedKey}</strong>
              </p>
              <textarea
                aria-label="Website content JSON editor"
                style={styles.textarea}
                rows={22}
                value={editor}
                onChange={event => setEditor(event.target.value)}
                spellCheck={false}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  style={styles.button}
                  onClick={saveContent}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Publish'}
                </button>
                <button
                  style={styles.secondary}
                  onClick={() => selectContent(selectedKey)}
                >
                  Discard Changes
                </button>
              </div>
              <p style={styles.muted}>
                Keep valid JSON format. Image fields currently accept image URLs or existing public paths.
              </p>
            </>
          )}

          {contentRecords.length === 0 && <p>No website content records found.</p>}
        </section>
      )}

      {section === 'policies' && (
        <section style={styles.panel}>
          <h2>Privacy Policy & Terms and Conditions</h2>
          <p style={styles.muted}>
            Edit each policy separately. Both are stored together in the existing policies database record.
          </p>

          {!policyLoaded ? (
            <p>Loading policy content...</p>
          ) : (
            <>
              <label style={styles.label} htmlFor="privacy-policy">
                Privacy Policy
              </label>
              <textarea
                id="privacy-policy"
                style={{ ...styles.textarea, fontFamily: 'Arial, sans-serif' }}
                rows={12}
                value={privacyPolicy}
                onChange={event => setPrivacyPolicy(event.target.value)}
                placeholder="Enter your company-approved Privacy Policy..."
              />

              <label style={styles.label} htmlFor="terms-conditions">
                Terms & Conditions
              </label>
              <textarea
                id="terms-conditions"
                style={{ ...styles.textarea, fontFamily: 'Arial, sans-serif' }}
                rows={12}
                value={termsConditions}
                onChange={event => setTermsConditions(event.target.value)}
                placeholder="Enter your company-approved Terms & Conditions..."
              />

              <button
                style={styles.button}
                onClick={savePolicies}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Publish Policies'}
              </button>
            </>
          )}
        </section>
      )}

      {section === 'enquiries' && (
        <section style={styles.panel}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <h2>Enquiry Management</h2>
              <p style={styles.muted}>View customer enquiries and update their status.</p>
            </div>
            <button style={styles.secondary} onClick={refreshEnquiries} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Enquiries'}
            </button>
          </div>

          {enquiries.map(item => (
            <article key={item.id} style={styles.card}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <h3 style={{ marginTop: 0 }}>{item.name}</h3>
                <strong>#{item.id}</strong>
              </div>

              <p><strong>Phone:</strong> {item.phone}</p>
              <p><strong>Email:</strong> {item.email || 'Not provided'}</p>
              <p><strong>Service:</strong> {item.service || 'General enquiry'}</p>
              <p><strong>Message:</strong> {item.message}</p>
              <p>
                <strong>Date:</strong>{' '}
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : 'Not available'}
              </p>

              <label style={styles.label} htmlFor={`status-${item.id}`}>
                Enquiry Status
              </label>
              <select
                id={`status-${item.id}`}
                style={{ ...styles.input, maxWidth: 300 }}
                value={item.status}
                onChange={event => updateStatus(item.id, event.target.value)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </article>
          ))}

          {enquiries.length === 0 && <p>No enquiries found.</p>}
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: 18, color: '#718096', fontSize: 13 }}>
        Sri Sai Manpower Services · Admin Panel
      </footer>
    </main>
  )
}
