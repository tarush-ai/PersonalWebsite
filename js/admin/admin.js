/**
 * Admin Panel JavaScript
 * Handles all CRUD operations for podcasts, projects, images, and analytics
 */

let adminToken = '';
let currentEditingPodcast = null;
let currentEditingProject = null;

// API Helper
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
    const options = {
        method,
        headers: {
            'X-Admin-Token': adminToken
        }
    };
    
    if (body && !isFormData) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    } else if (body && isFormData) {
        options.body = body;
    }
    
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }
    
    return data;
}

// Authentication
document.getElementById('authForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tokenInput = document.getElementById('adminToken');
    const token = tokenInput.value.trim();
    const errorEl = document.getElementById('authError');
    
    if (!token) {
        showError(errorEl, 'Please enter an admin token');
        return;
    }
    
    adminToken = token;
    
    try {
        // Test authentication by calling analytics endpoint
        await apiCall('/api/admin/analytics/overview');
        
        // Success - show admin dashboard
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'flex';
        
        // Load initial data
        loadDashboard();
        
    } catch (error) {
        showError(errorEl, 'Invalid admin token');
        adminToken = '';
    }
});

// Navigation
document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        
        // Update active nav item
        document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Update active section
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section)?.classList.add('active');
        
        // Load section data
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'podcasts':
                loadPodcasts();
                break;
            case 'projects':
                loadProjects();
                break;
            case 'images':
                loadImages();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    });
});

// Dashboard
async function loadDashboard() {
    try {
        const data = await apiCall('/api/admin/analytics/overview');
        
        const statsHtml = `
            <div class="stat-card">
                <div class="stat-label">Total Visitors</div>
                <div class="stat-value">${data.visitor_count.toLocaleString()}</div>
                <div class="stat-subtext">All-time citadel visits</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Podcast Episodes</div>
                <div class="stat-value">${data.podcasts.published}</div>
                <div class="stat-subtext">${data.podcasts.total} total</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Projects</div>
                <div class="stat-value">${data.projects.published}</div>
                <div class="stat-subtext">${data.projects.total} total</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Images</div>
                <div class="stat-value">${data.images}</div>
                <div class="stat-subtext">Uploaded files</div>
            </div>
        `;
        
        document.getElementById('statsGrid').innerHTML = statsHtml;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Podcasts
async function loadPodcasts() {
    try {
        const data = await apiCall('/api/podcast/episodes?published_only=false');
        
        if (data.episodes.length === 0) {
            document.getElementById('podcastTableContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎙️</div>
                    <div class="empty-state-text">No podcast episodes yet</div>
                    <button class="btn btn-primary" onclick="openPodcastModal()">Add Your First Episode</button>
                </div>
            `;
            return;
        }
        
        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.episodes.map(ep => `
                        <tr>
                            <td>${ep.title}</td>
                            <td><code>${ep.slug}</code></td>
                            <td>
                                <span class="badge ${ep.published ? 'badge-success' : 'badge-warning'}">
                                    ${ep.published ? 'Published' : 'Draft'}
                                </span>
                            </td>
                            <td>${ep.order_index}</td>
                            <td class="table-actions">
                                <button class="btn btn-secondary btn-small" onclick='editPodcast(${JSON.stringify(ep)})'>
                                    Edit
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deletePodcast(${ep.id}, '${ep.title}')">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('podcastTableContent').innerHTML = tableHtml;
        
    } catch (error) {
        console.error('Error loading podcasts:', error);
        showMessage('podcastMessage', 'Failed to load podcasts', 'error');
    }
}

function openPodcastModal(episode = null) {
    currentEditingPodcast = episode;
    const modal = document.getElementById('podcastModal');
    const form = document.getElementById('podcastForm');
    const title = document.getElementById('podcastModalTitle');
    
    form.reset();
    
    if (episode) {
        title.textContent = 'Edit Podcast Episode';
        form.elements.title.value = episode.title;
        form.elements.description.value = episode.description;
        form.elements.youtube_url.value = episode.youtube_url;
        form.elements.slug.value = episode.slug;
        form.elements.notes.value = episode.notes || '';
        form.elements.order_index.value = episode.order_index;
        form.elements.published.checked = episode.published;
    } else {
        title.textContent = 'Add Podcast Episode';
    }
    
    modal.classList.add('active');
}

function closePodcastModal() {
    document.getElementById('podcastModal').classList.remove('active');
    currentEditingPodcast = null;
}

function editPodcast(episode) {
    openPodcastModal(episode);
}

async function deletePodcast(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }
    
    try {
        await apiCall(`/api/admin/podcast/episodes/${id}`, 'DELETE');
        showMessage('podcastMessage', 'Episode deleted successfully', 'success');
        loadPodcasts();
    } catch (error) {
        showMessage('podcastMessage', 'Failed to delete episode', 'error');
    }
}

document.getElementById('podcastForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        youtube_url: formData.get('youtube_url'),
        slug: formData.get('slug'),
        notes: formData.get('notes'),
        order_index: parseInt(formData.get('order_index')),
        published: formData.get('published') === 'on'
    };
    
    try {
        if (currentEditingPodcast) {
            await apiCall(`/api/admin/podcast/episodes/${currentEditingPodcast.id}`, 'PUT', data);
            showMessage('podcastMessage', 'Episode updated successfully', 'success');
        } else {
            await apiCall('/api/admin/podcast/episodes', 'POST', data);
            showMessage('podcastMessage', 'Episode created successfully', 'success');
        }
        
        closePodcastModal();
        loadPodcasts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Projects
async function loadProjects() {
    try {
        const data = await apiCall('/api/projects?published_only=false');
        
        if (data.projects.length === 0) {
            document.getElementById('projectTableContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💼</div>
                    <div class="empty-state-text">No projects yet</div>
                    <button class="btn btn-primary" onclick="openProjectModal()">Add Your First Project</button>
                </div>
            `;
            return;
        }
        
        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Type</th>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.projects.map(proj => `
                        <tr>
                            <td>${proj.company}</td>
                            <td>${proj.role}</td>
                            <td><code>${proj.type}</code></td>
                            <td>${proj.period}</td>
                            <td>
                                <span class="badge ${proj.published ? 'badge-success' : 'badge-warning'}">
                                    ${proj.published ? 'Published' : 'Draft'}
                                </span>
                            </td>
                            <td class="table-actions">
                                <button class="btn btn-secondary btn-small" onclick='editProject(${JSON.stringify(proj).replace(/'/g, "&#39;")})'>
                                    Edit
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deleteProject(${proj.id}, '${proj.company}')">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('projectTableContent').innerHTML = tableHtml;
        
    } catch (error) {
        console.error('Error loading projects:', error);
        showMessage('projectMessage', 'Failed to load projects', 'error');
    }
}

function openProjectModal(project = null) {
    currentEditingProject = project;
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('projectModalTitle');
    
    form.reset();
    
    if (project) {
        title.textContent = 'Edit Project';
        form.elements.type.value = project.type;
        form.elements.company.value = project.company;
        form.elements.role.value = project.role;
        form.elements.period.value = project.period;
        form.elements.description.value = project.description;
        form.elements.details.value = project.details;
        form.elements.tags.value = project.tags ? project.tags.join(', ') : '';
        form.elements.slug.value = project.slug;
        form.elements.contact_email.value = project.contact_email || '';
        form.elements.contact_subject.value = project.contact_subject || '';
        form.elements.published.checked = project.published;
    } else {
        title.textContent = 'Add Project';
    }
    
    modal.classList.add('active');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    currentEditingProject = null;
}

function editProject(project) {
    openProjectModal(project);
}

async function deleteProject(id, company) {
    if (!confirm(`Are you sure you want to delete "${company}"?`)) {
        return;
    }
    
    try {
        await apiCall(`/api/admin/projects/${id}`, 'DELETE');
        showMessage('projectMessage', 'Project deleted successfully', 'success');
        loadProjects();
    } catch (error) {
        showMessage('projectMessage', 'Failed to delete project', 'error');
    }
}

document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const data = {
        type: formData.get('type'),
        company: formData.get('company'),
        role: formData.get('role'),
        period: formData.get('period'),
        description: formData.get('description'),
        details: formData.get('details'),
        tags: tags,
        slug: formData.get('slug'),
        contact_email: formData.get('contact_email'),
        contact_subject: formData.get('contact_subject'),
        published: formData.get('published') === 'on'
    };
    
    try {
        if (currentEditingProject) {
            await apiCall(`/api/admin/projects/${currentEditingProject.id}`, 'PUT', data);
            showMessage('projectMessage', 'Project updated successfully', 'success');
        } else {
            await apiCall('/api/admin/projects', 'POST', data);
            showMessage('projectMessage', 'Project created successfully', 'success');
        }
        
        closeProjectModal();
        loadProjects();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Images
async function loadImages() {
    try {
        const data = await apiCall('/api/images');
        
        if (data.images.length === 0) {
            document.getElementById('imageTableContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🖼️</div>
                    <div class="empty-state-text">No images uploaded yet</div>
                    <button class="btn btn-primary" onclick="openImageUpload()">Upload Your First Image</button>
                </div>
            `;
            return;
        }
        
        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Preview</th>
                        <th>Filename</th>
                        <th>URL</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.images.map(img => `
                        <tr>
                            <td><img src="${img.url}" alt="${img.alt_text || ''}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                            <td>${img.original_name}</td>
                            <td><code>${img.url}</code></td>
                            <td>${new Date(img.uploaded_at).toLocaleDateString()}</td>
                            <td class="table-actions">
                                <button class="btn btn-secondary btn-small" onclick="copyImageUrl('${img.url}')">
                                    Copy URL
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deleteImage(${img.id}, '${img.original_name}')">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('imageTableContent').innerHTML = tableHtml;
        
    } catch (error) {
        console.error('Error loading images:', error);
        showMessage('imageMessage', 'Failed to load images', 'error');
    }
}

function openImageUpload() {
    document.getElementById('imageModal').classList.add('active');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    document.getElementById('imageForm').reset();
}

function copyImageUrl(url) {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    showMessage('imageMessage', 'URL copied to clipboard!', 'success');
}

async function deleteImage(id, filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        await apiCall(`/api/admin/images/${id}`, 'DELETE');
        showMessage('imageMessage', 'Image deleted successfully', 'success');
        loadImages();
    } catch (error) {
        showMessage('imageMessage', 'Failed to delete image', 'error');
    }
}

document.getElementById('imageForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        await apiCall('/api/admin/images/upload', 'POST', formData, true);
        showMessage('imageMessage', 'Image uploaded successfully', 'success');
        closeImageModal();
        loadImages();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Analytics
async function loadAnalytics() {
    try {
        const data = await apiCall('/api/admin/analytics/overview');
        
        const statsHtml = `
            <div class="stat-card">
                <div class="stat-label">Total Visitors</div>
                <div class="stat-value">${data.visitor_count.toLocaleString()}</div>
                <div class="stat-subtext">All-time citadel visits</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Published Episodes</div>
                <div class="stat-value">${data.podcasts.published}</div>
                <div class="stat-subtext">${data.podcasts.total - data.podcasts.published} drafts</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Published Projects</div>
                <div class="stat-value">${data.projects.published}</div>
                <div class="stat-subtext">${data.projects.total - data.projects.published} drafts</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Images</div>
                <div class="stat-value">${data.images}</div>
                <div class="stat-subtext">Uploaded files</div>
            </div>
        `;
        
        document.getElementById('analyticsStats').innerHTML = statsHtml;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Utility Functions
function showMessage(elementId, message, type = 'success') {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `message message-${type} show`;
    
    setTimeout(() => {
        el.classList.remove('show');
    }, 5000);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Make functions global
window.openPodcastModal = openPodcastModal;
window.closePodcastModal = closePodcastModal;
window.editPodcast = editPodcast;
window.deletePodcast = deletePodcast;
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.openImageUpload = openImageUpload;
window.closeImageModal = closeImageModal;
window.copyImageUrl = copyImageUrl;
window.deleteImage = deleteImage;
