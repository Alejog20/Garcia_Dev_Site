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
  const fieldBody = document.getElementById('field-body');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const editorError = document.getElementById('editor-error');

  let editingSlug = null; // null => creating a new post

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
      li.innerHTML = `
        <div>
          <div class="title">${escapeHtml(post.title)} <span class="badge ${post.published ? 'published' : ''}">${post.published ? 'Published' : 'Draft'}</span></div>
          <div class="meta">/blog/${escapeHtml(post.slug)} · updated ${formatDate(post.updated_at)}</div>
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

  function openEditor(post) {
    editingSlug = post ? post.slug : null;
    editorHeading.textContent = post ? 'Edit post' : 'New post';
    fieldSlug.value = post ? post.slug : '';
    fieldSlug.disabled = Boolean(post);
    fieldTitle.value = post ? post.title : '';
    fieldExcerpt.value = post ? (post.excerpt || '') : '';
    fieldBody.value = post ? post.body_markdown : '';
    editorError.hidden = true;
    showView('editor');
  }

  newPostBtn.addEventListener('click', () => openEditor(null));
  cancelBtn.addEventListener('click', loadDashboard);

  saveBtn.addEventListener('click', async () => {
    editorError.hidden = true;
    const payload = {
      slug: fieldSlug.value.trim(),
      title: fieldTitle.value.trim(),
      excerpt: fieldExcerpt.value.trim(),
      body_markdown: fieldBody.value,
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
