"""
Image upload and management API routes
"""

from flask import Blueprint, request, jsonify, send_from_directory
import sys
import os
import uuid
from werkzeug.utils import secure_filename

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.schema import get_db_connection
from utils.auth import require_admin_token

image_bp = Blueprint('image', __name__)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@image_bp.route('/api/images', methods=['GET'])
@require_admin_token
def get_all_images():
    """Get all uploaded images"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT id, filename, original_name, url, alt_text, uploaded_at
                    FROM images
                    ORDER BY uploaded_at DESC
                ''')
                
                images = []
                for row in cur.fetchall():
                    images.append({
                        'id': row[0],
                        'filename': row[1],
                        'original_name': row[2],
                        'url': row[3],
                        'alt_text': row[4],
                        'uploaded_at': row[5].isoformat() if row[5] else None
                    })
                
                return jsonify({'images': images})
    
    except Exception as e:
        print(f"Error getting images: {e}")
        return jsonify({'error': str(e)}), 500


@image_bp.route('/api/admin/images/upload', methods=['POST'])
@require_admin_token
def upload_image():
    """Upload a new image"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{extension}"
        
        # Save file
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        # Generate URL
        file_url = f"/uploads/{unique_filename}"
        
        # Get alt text from form data
        alt_text = request.form.get('alt_text', '')
        
        # Save to database
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    INSERT INTO images (filename, original_name, url, alt_text)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, filename, url
                ''', (unique_filename, original_filename, file_url, alt_text))
                
                row = cur.fetchone()
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Image uploaded successfully',
                    'image': {
                        'id': row[0],
                        'filename': row[1],
                        'url': row[2]
                    }
                }), 201
    
    except Exception as e:
        print(f"Error uploading image: {e}")
        return jsonify({'error': str(e)}), 500


@image_bp.route('/api/admin/images/<int:image_id>', methods=['DELETE'])
@require_admin_token
def delete_image(image_id):
    """Delete an image"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Get filename before deleting
                cur.execute('SELECT filename FROM images WHERE id = %s', (image_id,))
                row = cur.fetchone()
                
                if not row:
                    return jsonify({'error': 'Image not found'}), 404
                
                filename = row[0]
                
                # Delete from database
                cur.execute('DELETE FROM images WHERE id = %s', (image_id,))
                conn.commit()
                
                # Delete file from filesystem
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                return jsonify({
                    'success': True,
                    'message': 'Image deleted successfully'
                })
    
    except Exception as e:
        print(f"Error deleting image: {e}")
        return jsonify({'error': str(e)}), 500


@image_bp.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    return send_from_directory(UPLOAD_FOLDER, filename)
