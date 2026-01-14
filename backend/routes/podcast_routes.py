"""
Podcast episode API routes
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.schema import get_db_connection
from utils.auth import require_admin_token

podcast_bp = Blueprint('podcast', __name__)


@podcast_bp.route('/api/podcast/episodes', methods=['GET'])
def get_all_episodes():
    """Get all podcast episodes (with optional published filter)"""
    try:
        published_only = request.args.get('published_only', 'true').lower() == 'true'
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                if published_only:
                    cur.execute('''
                        SELECT id, title, description, youtube_url, slug, notes, order_index, published, created_at
                        FROM podcast_episodes
                        WHERE published = TRUE
                        ORDER BY order_index DESC, created_at DESC
                    ''')
                else:
                    cur.execute('''
                        SELECT id, title, description, youtube_url, slug, notes, order_index, published, created_at
                        FROM podcast_episodes
                        ORDER BY order_index DESC, created_at DESC
                    ''')
                
                episodes = []
                for row in cur.fetchall():
                    episodes.append({
                        'id': row[0],
                        'title': row[1],
                        'description': row[2],
                        'youtube_url': row[3],
                        'slug': row[4],
                        'notes': row[5],
                        'order_index': row[6],
                        'published': row[7],
                        'created_at': row[8].isoformat() if row[8] else None
                    })
                
                return jsonify({'episodes': episodes})
    
    except Exception as e:
        print(f"Error getting episodes: {e}")
        return jsonify({'error': str(e)}), 500


@podcast_bp.route('/api/podcast/episodes/<slug>', methods=['GET'])
def get_episode_by_slug(slug):
    """Get a single episode by slug"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT id, title, description, youtube_url, slug, notes, order_index, published, created_at
                    FROM podcast_episodes
                    WHERE slug = %s
                ''', (slug,))
                
                row = cur.fetchone()
                if not row:
                    return jsonify({'error': 'Episode not found'}), 404
                
                episode = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'youtube_url': row[3],
                    'slug': row[4],
                    'notes': row[5],
                    'order_index': row[6],
                    'published': row[7],
                    'created_at': row[8].isoformat() if row[8] else None
                }
                
                return jsonify({'episode': episode})
    
    except Exception as e:
        print(f"Error getting episode: {e}")
        return jsonify({'error': str(e)}), 500


@podcast_bp.route('/api/admin/podcast/episodes', methods=['POST'])
@require_admin_token
def create_episode():
    """Create a new podcast episode"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'description', 'youtube_url', 'slug']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    INSERT INTO podcast_episodes (title, description, youtube_url, slug, notes, order_index, published)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, title, slug
                ''', (
                    data['title'],
                    data['description'],
                    data['youtube_url'],
                    data['slug'],
                    data.get('notes', ''),
                    data.get('order_index', 0),
                    data.get('published', True)
                ))
                
                row = cur.fetchone()
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Episode created successfully',
                    'episode': {
                        'id': row[0],
                        'title': row[1],
                        'slug': row[2]
                    }
                }), 201
    
    except Exception as e:
        print(f"Error creating episode: {e}")
        return jsonify({'error': str(e)}), 500


@podcast_bp.route('/api/admin/podcast/episodes/<int:episode_id>', methods=['PUT'])
@require_admin_token
def update_episode(episode_id):
    """Update an existing podcast episode"""
    try:
        data = request.json
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Build dynamic UPDATE query
                update_fields = []
                values = []
                
                allowed_fields = ['title', 'description', 'youtube_url', 'slug', 'notes', 'order_index', 'published']
                for field in allowed_fields:
                    if field in data:
                        update_fields.append(f'{field} = %s')
                        values.append(data[field])
                
                if not update_fields:
                    return jsonify({'error': 'No fields to update'}), 400
                
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                values.append(episode_id)
                
                query = f'''
                    UPDATE podcast_episodes
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, title, slug
                '''
                
                cur.execute(query, values)
                row = cur.fetchone()
                
                if not row:
                    return jsonify({'error': 'Episode not found'}), 404
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Episode updated successfully',
                    'episode': {
                        'id': row[0],
                        'title': row[1],
                        'slug': row[2]
                    }
                })
    
    except Exception as e:
        print(f"Error updating episode: {e}")
        return jsonify({'error': str(e)}), 500


@podcast_bp.route('/api/admin/podcast/episodes/<int:episode_id>', methods=['DELETE'])
@require_admin_token
def delete_episode(episode_id):
    """Delete a podcast episode"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM podcast_episodes WHERE id = %s RETURNING id', (episode_id,))
                row = cur.fetchone()
                
                if not row:
                    return jsonify({'error': 'Episode not found'}), 404
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Episode deleted successfully'
                })
    
    except Exception as e:
        print(f"Error deleting episode: {e}")
        return jsonify({'error': str(e)}), 500


@podcast_bp.route('/api/admin/podcast/reorder', methods=['POST'])
@require_admin_token
def reorder_episodes():
    """Reorder podcast episodes"""
    try:
        data = request.json
        episode_orders = data.get('episodes', [])  # List of {id, order_index}
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                for item in episode_orders:
                    cur.execute(
                        'UPDATE podcast_episodes SET order_index = %s WHERE id = %s',
                        (item['order_index'], item['id'])
                    )
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Episodes reordered successfully'
                })
    
    except Exception as e:
        print(f"Error reordering episodes: {e}")
        return jsonify({'error': str(e)}), 500
