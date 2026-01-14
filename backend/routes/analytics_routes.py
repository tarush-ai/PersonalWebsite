"""
Analytics and statistics API routes
"""

from flask import Blueprint, request, jsonify
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.schema import get_db_connection
from utils.auth import require_admin_token

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/api/admin/analytics/overview', methods=['GET'])
@require_admin_token
def get_analytics_overview():
    """Get overview analytics for dashboard"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Get visitor count
                cur.execute('SELECT count FROM visitor_count WHERE id = 1')
                visitor_row = cur.fetchone()
                visitor_count = visitor_row[0] if visitor_row else 0
                
                # Get podcast count
                cur.execute('SELECT COUNT(*) FROM podcast_episodes WHERE published = TRUE')
                podcast_count = cur.fetchone()[0]
                
                # Get total podcast count (including unpublished)
                cur.execute('SELECT COUNT(*) FROM podcast_episodes')
                total_podcast_count = cur.fetchone()[0]
                
                # Get project/internship count
                cur.execute('SELECT COUNT(*) FROM projects WHERE published = TRUE')
                project_count = cur.fetchone()[0]
                
                # Get total project count
                cur.execute('SELECT COUNT(*) FROM projects')
                total_project_count = cur.fetchone()[0]
                
                # Get image count
                cur.execute('SELECT COUNT(*) FROM images')
                image_count = cur.fetchone()[0]
                
                # Get recent podcasts (last 5)
                cur.execute('''
                    SELECT title, created_at
                    FROM podcast_episodes
                    ORDER BY created_at DESC
                    LIMIT 5
                ''')
                recent_podcasts = []
                for row in cur.fetchall():
                    recent_podcasts.append({
                        'title': row[0],
                        'created_at': row[1].isoformat() if row[1] else None
                    })
                
                # Get recent projects (last 5)
                cur.execute('''
                    SELECT company, role, created_at
                    FROM projects
                    ORDER BY created_at DESC
                    LIMIT 5
                ''')
                recent_projects = []
                for row in cur.fetchall():
                    recent_projects.append({
                        'company': row[0],
                        'role': row[1],
                        'created_at': row[2].isoformat() if row[2] else None
                    })
                
                return jsonify({
                    'visitor_count': visitor_count,
                    'podcasts': {
                        'published': podcast_count,
                        'total': total_podcast_count
                    },
                    'projects': {
                        'published': project_count,
                        'total': total_project_count
                    },
                    'images': image_count,
                    'recent_podcasts': recent_podcasts,
                    'recent_projects': recent_projects
                })
    
    except Exception as e:
        print(f"Error getting analytics: {e}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/admin/analytics/visitors', methods=['GET'])
@require_admin_token
def get_visitor_trends():
    """Get visitor count trends (currently just returns current count)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT count FROM visitor_count WHERE id = 1')
                row = cur.fetchone()
                count = row[0] if row else 0
                
                return jsonify({
                    'current_count': count,
                    'message': 'Detailed trends tracking not yet implemented'
                })
    
    except Exception as e:
        print(f"Error getting visitor trends: {e}")
        return jsonify({'error': str(e)}), 500
