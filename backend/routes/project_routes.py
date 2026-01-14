"""
Project/Internship API routes
"""

from flask import Blueprint, request, jsonify
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.schema import get_db_connection
from utils.auth import require_admin_token

project_bp = Blueprint('project', __name__)


@project_bp.route('/api/projects', methods=['GET'])
def get_all_projects():
    """Get all projects (with optional type and published filters)"""
    try:
        project_type = request.args.get('type')  # 'internship', 'project', etc.
        published_only = request.args.get('published_only', 'true').lower() == 'true'
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                query = 'SELECT id, type, company, role, period, description, details, tags, slug, contact_email, contact_subject, order_index, published FROM projects WHERE 1=1'
                params = []
                
                if published_only:
                    query += ' AND published = TRUE'
                
                if project_type:
                    query += ' AND type = %s'
                    params.append(project_type)
                
                query += ' ORDER BY order_index DESC, created_at DESC'
                
                cur.execute(query, params)
                
                projects = []
                for row in cur.fetchall():
                    projects.append({
                        'id': row[0],
                        'type': row[1],
                        'company': row[2],
                        'role': row[3],
                        'period': row[4],
                        'description': row[5],
                        'details': row[6],
                        'tags': row[7],
                        'slug': row[8],
                        'contact_email': row[9],
                        'contact_subject': row[10],
                        'order_index': row[11],
                        'published': row[12]
                    })
                
                return jsonify({'projects': projects})
    
    except Exception as e:
        print(f"Error getting projects: {e}")
        return jsonify({'error': str(e)}), 500


@project_bp.route('/api/projects/<slug>', methods=['GET'])
def get_project_by_slug(slug):
    """Get a single project by slug"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT id, type, company, role, period, description, details, tags, slug, contact_email, contact_subject, order_index, published
                    FROM projects
                    WHERE slug = %s
                ''', (slug,))
                
                row = cur.fetchone()
                if not row:
                    return jsonify({'error': 'Project not found'}), 404
                
                project = {
                    'id': row[0],
                    'type': row[1],
                    'company': row[2],
                    'role': row[3],
                    'period': row[4],
                    'description': row[5],
                    'details': row[6],
                    'tags': row[7],
                    'slug': row[8],
                    'contact_email': row[9],
                    'contact_subject': row[10],
                    'order_index': row[11],
                    'published': row[12]
                }
                
                return jsonify({'project': project})
    
    except Exception as e:
        print(f"Error getting project: {e}")
        return jsonify({'error': str(e)}), 500


@project_bp.route('/api/admin/projects', methods=['POST'])
@require_admin_token
def create_project():
    """Create a new project"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['type', 'company', 'role', 'period', 'description', 'details', 'slug']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    INSERT INTO projects (type, company, role, period, description, details, tags, slug, contact_email, contact_subject, order_index, published)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, company, slug
                ''', (
                    data['type'],
                    data['company'],
                    data['role'],
                    data['period'],
                    data['description'],
                    data['details'],
                    data.get('tags', []),
                    data['slug'],
                    data.get('contact_email'),
                    data.get('contact_subject'),
                    data.get('order_index', 0),
                    data.get('published', True)
                ))
                
                row = cur.fetchone()
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Project created successfully',
                    'project': {
                        'id': row[0],
                        'company': row[1],
                        'slug': row[2]
                    }
                }), 201
    
    except Exception as e:
        print(f"Error creating project: {e}")
        return jsonify({'error': str(e)}), 500


@project_bp.route('/api/admin/projects/<int:project_id>', methods=['PUT'])
@require_admin_token
def update_project(project_id):
    """Update an existing project"""
    try:
        data = request.json
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                update_fields = []
                values = []
                
                allowed_fields = ['type', 'company', 'role', 'period', 'description', 'details', 'tags', 'slug', 'contact_email', 'contact_subject', 'order_index', 'published']
                for field in allowed_fields:
                    if field in data:
                        update_fields.append(f'{field} = %s')
                        values.append(data[field])
                
                if not update_fields:
                    return jsonify({'error': 'No fields to update'}), 400
                
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                values.append(project_id)
                
                query = f'''
                    UPDATE projects
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, company, slug
                '''
                
                cur.execute(query, values)
                row = cur.fetchone()
                
                if not row:
                    return jsonify({'error': 'Project not found'}), 404
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Project updated successfully',
                    'project': {
                        'id': row[0],
                        'company': row[1],
                        'slug': row[2]
                    }
                })
    
    except Exception as e:
        print(f"Error updating project: {e}")
        return jsonify({'error': str(e)}), 500


@project_bp.route('/api/admin/projects/<int:project_id>', methods=['DELETE'])
@require_admin_token
def delete_project(project_id):
    """Delete a project"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM projects WHERE id = %s RETURNING id', (project_id,))
                row = cur.fetchone()
                
                if not row:
                    return jsonify({'error': 'Project not found'}), 404
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Project deleted successfully'
                })
    
    except Exception as e:
        print(f"Error deleting project: {e}")
        return jsonify({'error': str(e)}), 500
