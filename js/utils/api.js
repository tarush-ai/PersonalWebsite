/**
 * API Utility Functions
 * Helper functions for making API calls to the backend
 */

class API {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }
    
    async get(endpoint) {
        try {
            const response = await fetch(this.baseURL + endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    }
    
    async post(endpoint, data) {
        try {
            const response = await fetch(this.baseURL + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    }
}

// Create global API instance
window.api = new API();

/**
 * Fetch podcast episodes from API with fallback to hardcoded data
 */
async function fetchPodcastEpisodes(fallbackData) {
    try {
        const data = await window.api.get('/api/podcast/episodes');
        if (data && data.episodes && data.episodes.length > 0) {
            // Convert API format to frontend format
            return data.episodes.map(ep => ({
                title: ep.title,
                desc: ep.description,
                url: ep.youtube_url,
                notes: ep.notes,
                slug: ep.slug
            }));
        }
    } catch (error) {
        console.warn('Failed to fetch episodes from API, using fallback data:', error);
    }
    
    // Return fallback data if API fails
    return fallbackData;
}

/**
 * Fetch projects/internships from API with fallback to hardcoded data
 */
async function fetchProjects(fallbackData) {
    try {
        const data = await window.api.get('/api/projects');
        if (data && data.projects && data.projects.length > 0) {
            // Convert API format to frontend format
            const projectsMap = {};
            data.projects.forEach(proj => {
                projectsMap[proj.slug] = {
                    company: proj.company,
                    role: proj.role,
                    period: proj.period,
                    description: proj.description,
                    details: proj.details,
                    tags: proj.tags || [],
                    contact: {
                        email: proj.contact_email || '',
                        subject: proj.contact_subject || ''
                    }
                };
            });
            return projectsMap;
        }
    } catch (error) {
        console.warn('Failed to fetch projects from API, using fallback data:', error);
    }
    
    // Return fallback data if API fails
    return fallbackData;
}

// Make functions globally available
window.fetchPodcastEpisodes = fetchPodcastEpisodes;
window.fetchProjects = fetchProjects;
