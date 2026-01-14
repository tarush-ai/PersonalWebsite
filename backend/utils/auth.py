"""
Authentication utilities for admin endpoints
"""

import os
from functools import wraps
from flask import request, jsonify


def require_admin_token(f):
    """
    Decorator to protect admin endpoints with token authentication
    
    Usage:
        @require_admin_token
        def admin_endpoint():
            # Your code here
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin_token = os.environ.get('ADMIN_TOKEN')
        
        if not admin_token:
            return jsonify({'error': 'Admin endpoint not configured'}), 500
        
        # Check for token in X-Admin-Token header
        provided_token = request.headers.get('X-Admin-Token')
        
        # Also support Authorization: Bearer <token>
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            provided_token = auth_header.replace('Bearer ', '')
        
        if not provided_token or provided_token != admin_token:
            return jsonify({'error': 'Unauthorized'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function
