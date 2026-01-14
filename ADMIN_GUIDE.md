# Admin Panel Guide

This guide explains how to use the new admin panel to manage your website content.

## Quick Start

1. **Access the Admin Panel**
   - Navigate to `/admin.html` on your website
   - Enter your admin token (set in `.env` as `ADMIN_TOKEN`)

2. **Initialize the Database** (First time only)
   ```bash
   python backend/database/schema.py
   ```

3. **Migrate Existing Data** (Optional)
   ```bash
   python migrate_data.py
   ```

## Features

### 📊 Dashboard
- View visitor count
- See total podcasts, projects, and images
- Quick overview of your content

### 🎙️ Podcast Episodes
- **Add New Episodes**: Click "+ Add Episode"
  - Enter title, description, YouTube embed URL
  - Set a URL-friendly slug
  - Add optional notes
  - Set order index for sorting
  - Toggle published status
- **Edit Episodes**: Click "Edit" button on any episode
- **Delete Episodes**: Click "Delete" button (requires confirmation)

### 💼 Projects & Internships
- **Add New Projects**: Click "+ Add Project"
  - Choose type (internship or project)
  - Enter company, role, period
  - Add description and details (supports HTML)
  - Add tags (comma-separated)
  - Set contact information
- **Edit/Delete**: Similar to podcast management

### 🖼️ Image Manager
- **Upload Images**: Click "+ Upload Image"
  - Select image file (PNG, JPG, GIF, WebP, SVG)
  - Add optional alt text
  - Images are stored in `/uploads/` directory
- **Copy URLs**: Click "Copy URL" to get the full image URL
- **Delete Images**: Removes both database entry and file

### 📈 Analytics
- View detailed statistics
- Monitor content across all sections

## API Endpoints

### Public Endpoints (No auth required)
- `GET /api/podcast/episodes` - Get all published episodes
- `GET /api/podcast/episodes/:slug` - Get single episode
- `GET /api/projects` - Get all published projects
- `GET /api/projects/:slug` - Get single project

### Admin Endpoints (Require X-Admin-Token header)
#### Podcasts
- `POST /api/admin/podcast/episodes` - Create episode
- `PUT /api/admin/podcast/episodes/:id` - Update episode
- `DELETE /api/admin/podcast/episodes/:id` - Delete episode
- `POST /api/admin/podcast/reorder` - Reorder episodes

#### Projects
- `POST /api/admin/projects` - Create project
- `PUT /api/admin/projects/:id` - Update project
- `DELETE /api/admin/projects/:id` - Delete project

#### Images
- `GET /api/images` - List all images (admin only)
- `POST /api/admin/images/upload` - Upload image
- `DELETE /api/admin/images/:id` - Delete image

#### Analytics
- `GET /api/admin/analytics/overview` - Dashboard stats
- `GET /api/admin/analytics/visitors` - Visitor trends

#### Visitor Counter
- `GET /api/visitors` - Get current count
- `POST /api/visitors` - Increment count
- `POST /api/admin/visitors` - Set count (admin only)

## File Structure

```
PersonalWebsite/
├── backend/
│   ├── database/
│   │   └── schema.py          # Database schema & initialization
│   ├── routes/
│   │   ├── podcast_routes.py  # Podcast API endpoints
│   │   ├── project_routes.py  # Project API endpoints
│   │   ├── image_routes.py    # Image upload endpoints
│   │   └── analytics_routes.py # Analytics endpoints
│   └── utils/
│       └── auth.py             # Authentication decorator
├── js/
│   ├── core/
│   │   └── script.js           # Main frontend script
│   ├── admin/
│   │   └── admin.js            # Admin panel functionality
│   └── utils/
│       └── api.js              # API helper functions
├── uploads/                     # Uploaded images directory
├── admin.html                   # Admin panel UI
├── server.py                    # Main Flask server
└── migrate_data.py             # Data migration script
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
ADMIN_TOKEN=your-secure-admin-token-here
HF_API_URL=your-huggingface-api-url          # For AureliusGPT
HF_API_TOKEN=your-huggingface-token          # For AureliusGPT
OPENAI_API_KEY=your-openai-key               # For Stoic Validator
```

## Tips

1. **Backup Before Migrating**: Always backup your data before running migrations
2. **Test Locally First**: Test admin functionality on localhost before deploying
3. **Secure Your Token**: Use a strong, random admin token
4. **Image Sizes**: Optimize images before uploading (recommended < 2MB)
5. **HTML in Details**: Projects support HTML in the details field for rich formatting

## Troubleshooting

### "Invalid admin token"
- Check your `.env` file has `ADMIN_TOKEN` set
- Restart the server after updating `.env`

### Database errors
- Ensure `DATABASE_URL` is correctly set
- Run `python backend/database/schema.py` to initialize tables

### Images not uploading
- Check `uploads/` directory exists and is writable
- Verify file size is under 10MB
- Check file extension is allowed

### API returns empty data
- Run the migration script: `python migrate_data.py`
- Check database connection

## Security Notes

- Never commit `.env` file to version control
- Use HTTPS in production
- Regularly update your admin token
- Keep your database credentials secure
- The admin panel requires authentication for all operations

## Future Enhancements

The admin panel is designed to be extensible. Future features could include:
- Content blocks editor for home page
- Advanced analytics with charts
- Batch operations
- Image optimization
- Content scheduling
- Multi-user support with roles
