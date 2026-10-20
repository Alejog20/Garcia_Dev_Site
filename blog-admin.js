(function () {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const editorView = document.getElementById('editor-view');
  const tokenInput = document.getElementById('token-input');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');
  const postList = document.getElementById('post-list');
  const newPostBtn = document.getElementById('new-post-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const editorHeading = document.getElementById('editor-heading');
  const fieldSlug = document.getElementById('field-slug');
  const fieldTitle = document.getElementById('field-title');
  const fieldExcerpt = document.getElementById('field-excerpt');
  const fieldCategory = document.getElementById('field-category');
  const fieldBody = document.getElementById('field-body');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const editorError = document.getElementById('editor-error');
  const previewPane = document.getElementById('preview-pane');
  const mdToolbar = document.getElementById('md-toolbar');
  const featuredImageBtn = document.getElementById('featured-image-btn');
  const featuredImageInput = document.getElementById('featured-image-input');
  const featuredImagePreview = document.getElementById('featured-image-preview');
  const inlineImageBtn = document.getElementById('inline-image-btn');
  const inlineImageInput = document.getElementById('inline-image-input');

  let editingSlug = null; // null => creating a new post
  let featuredImageUrl = null;

  function showView(view) {
    loginView.hidden = view !== 'login';
    dashboardView.hidden = view !== 'dashboard';
    editorView.hidden = view !== 'editor';
  }

  async function api(path, options) {
    const res = await fetch(path, Object.assign({ credentials: 'include' }, options));
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || 'Something went wrong');
    return json;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- dashboard ----

  function renderPosts(posts) {
    postList.innerHTML = '';
    if (!posts.length) {
      const li = document.createElement('li');
      li.className = 'post-row';
      li.textContent = 'No posts yet.';
      postList.appendChild(li);
      return;
    }
    posts.forEach(post => {
      const li = document.createElement('li');
      li.className = 'post-row';
      const thumb = post.featured_image_url
        ? `<img class="thumb" src="${escapeHtml(post.featured_image_url)}" alt="">`
        : '<div class="thumb"></div>';
      li.innerHTML = `
        ${thumb}
        <div class="meta-col">
          <div class="title">${escapeHtml(post.title)} <span class="badge ${post.published ? 'published' : ''}">${post.published ? 'Published' : 'Draft'}</span></div>
          <div class="meta">/blog/${escapeHtml(post.slug)} &middot; updated ${formatDate(post.updated_at)}</div>
        </div>
        <div class="row-actions">
          <button class="secondary" data-action="edit">Edit</button>
          <button class="secondary" data-action="toggle">${post.published ? 'Unpublish' : 'Publish'}</button>
          <button class="danger" data-action="delete">Delete</button>
        </div>
      `;
      li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditor(post));
      li.querySelector('[data-action="toggle"]').addEventListener('click', () => togglePublish(post));
      li.querySelector('[data-action="delete"]').addEventListener('click', () => deletePost(post));
      postList.appendChild(li);
    });
  }

  async function loadDashboard() {
    const json = await api('/api/blog/posts');
    renderPosts(json.posts);
    showView('dashboard');
  }

  async function togglePublish(post) {
    const action = post.published ? 'unpublish' : 'publish';
    await api(`/api/blog/posts/${encodeURIComponent(post.slug)}/${action}`, { method: 'POST' });
    loadDashboard();
  }

  async function deletePost(post) {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    await api(`/api/blog/posts/${encodeURIComponent(post.slug)}`, { method: 'DELETE' });
    loadDashboard();
  }

  // ---- editor ----

  function openEditor(post) {
    editingSlug = post ? post.slug : null;
    featuredImageUrl = post ? (post.featured_image_url || null) : null;
    editorHeading.textContent = post ? 'Edit post' : 'New post';
    fieldSlug.value = post ? post.slug : '';
    fieldSlug.disabled = Boolean(post);
    fieldTitle.value = post ? post.title : '';
    fieldExcerpt.value = post ? (post.excerpt || '') : '';
    fieldCategory.value = post ? (post.category || '') : '';
    fieldBody.value = post ? post.body_markdown : '';
    editorError.hidden = true;
    if (featuredImageUrl) {
      featuredImagePreview.src = featuredImageUrl;
      featuredImagePreview.hidden = false;
    } else {
      featuredImagePreview.hidden = true;
      featuredImagePreview.removeAttribute('src');
    }
    renderPreview();
    showView('editor');
    fieldTitle.focus();
  }

  newPostBtn.addEventListener('click', () => openEditor(null));
  cancelBtn.addEventListener('click', loadDashboard);

  saveBtn.addEventListener('click', async () => {
    editorError.hidden = true;
    const payload = {
      slug: fieldSlug.value.trim(),
      title: fieldTitle.value.trim(),
      excerpt: fieldExcerpt.value.trim(),
      category: fieldCategory.value.trim(),
      body_markdown: fieldBody.value,
      featured_image_url: featuredImageUrl,
    };
    try {
      if (editingSlug) {
        delete payload.slug; // slug is immutable once set, via the disabled field above
        await api(`/api/blog/posts/${encodeURIComponent(editingSlug)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await api('/api/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      loadDashboard();
    } catch (err) {
      editorError.textContent = err.message;
      editorError.hidden = false;
    }
  });

  // ---- live preview ----

  let previewTimer = null;
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 400);
  }
  async function renderPreview() {
    if (!fieldBody.value.trim()) { previewPane.innerHTML = ''; return; }
    try {
      const json = await api('/api/blog/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_markdown: fieldBody.value }),
      });
      previewPane.innerHTML = json.html;
    } catch {
      // leave the previous preview showing rather than clearing it on a transient error
    }
  }
  fieldBody.addEventListener('input', schedulePreview);

  // ---- markdown toolbar ----

  function wrapSelection(before, after) {
    const ta = fieldBody;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    ta.setRangeText(before + selected + after, start, end, 'select');
    ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    ta.focus();
    schedulePreview();
  }

  function prefixLines(prefix) {
    const ta = fieldBody;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const value = ta.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;
    const block = value.slice(lineStart, lineEnd);
    const prefixed = block.split('\n').map(l => prefix + l).join('\n');
    ta.setRangeText(prefixed, lineStart, lineEnd, 'end');
    ta.focus();
    schedulePreview();
  }

  function insertLink() {
    const ta = fieldBody;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.slice(start, end) || 'link text';
    const url = prompt('Link URL:', 'https://');
    if (!url) return;
    ta.setRangeText(`[${selected}](${url})`, start, end, 'end');
    ta.focus();
    schedulePreview();
  }

  const MD_ACTIONS = {
    bold: () => wrapSelection('**', '**'),
    italic: () => wrapSelection('*', '*'),
    h2: () => prefixLines('## '),
    h3: () => prefixLines('### '),
    quote: () => prefixLines('> '),
    code: () => wrapSelection('`', '`'),
    list: () => prefixLines('- '),
    link: insertLink,
  };

  mdToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-md]');
    if (!btn) return;
    const action = MD_ACTIONS[btn.dataset.md];
    if (action) action();
  });

  // ---- image uploads ----

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/blog/upload-image', { method: 'POST', credentials: 'include', body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || 'Upload failed');
    return json.url;
  }

  featuredImageBtn.addEventListener('click', () => featuredImageInput.click());
  featuredImageInput.addEventListener('change', async () => {
    const file = featuredImageInput.files[0];
    if (!file) return;
    try {
      featuredImageUrl = await uploadImage(file);
      featuredImagePreview.src = featuredImageUrl;
      featuredImagePreview.hidden = false;
    } catch (err) {
      editorError.textContent = err.message;
      editorError.hidden = false;
    }
    featuredImageInput.value = '';
  });

  inlineImageBtn.addEventListener('click', () => inlineImageInput.click());
  inlineImageInput.addEventListener('change', async () => {
    const file = inlineImageInput.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      const ta = fieldBody;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const alt = ta.value.slice(start, end) || 'image';
      ta.setRangeText(`![${alt}](${url})`, start, end, 'end');
      ta.focus();
      schedulePreview();
    } catch (err) {
      editorError.textContent = err.message;
      editorError.hidden = false;
    }
    inlineImageInput.value = '';
  });

  // ---- auth ----

  loginBtn.addEventListener('click', async () => {
    loginError.hidden = true;
    try {
      await api('/api/blog/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.value.trim() }),
      });
      tokenInput.value = '';
      loadDashboard();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });
  tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

  logoutBtn.addEventListener('click', async () => {
    await api('/api/blog/logout', { method: 'POST' });
    showView('login');
  });

  // On load: if the login cookie from a previous session is still valid,
  // /api/blog/posts reports it via `authenticated` and already returns
  // drafts too — skip straight to the dashboard instead of asking again.
  api('/api/blog/posts').then(json => {
    if (json.authenticated) {
      renderPosts(json.posts);
      showView('dashboard');
    } else {
      showView('login');
    }
  }).catch(() => showView('login'));
})();
