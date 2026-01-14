#!/usr/bin/env python3
"""
Database schema initialization for PersonalWebsite
Creates tables for podcasts, projects, images, and content blocks
"""

import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)


def get_db_connection():
    """Get database connection"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg.connect(DATABASE_URL)


def init_database():
    """Initialize all database tables"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Create podcast_episodes table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS podcast_episodes (
                        id SERIAL PRIMARY KEY,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        youtube_url TEXT NOT NULL,
                        slug TEXT UNIQUE NOT NULL,
                        notes TEXT,
                        order_index INTEGER NOT NULL DEFAULT 0,
                        published BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create projects table (for internships and projects)
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS projects (
                        id SERIAL PRIMARY KEY,
                        type TEXT NOT NULL,
                        company TEXT NOT NULL,
                        role TEXT NOT NULL,
                        period TEXT NOT NULL,
                        description TEXT NOT NULL,
                        details TEXT NOT NULL,
                        tags TEXT[],
                        slug TEXT UNIQUE NOT NULL,
                        contact_email TEXT,
                        contact_subject TEXT,
                        order_index INTEGER NOT NULL DEFAULT 0,
                        published BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create images table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS images (
                        id SERIAL PRIMARY KEY,
                        filename TEXT NOT NULL,
                        original_name TEXT NOT NULL,
                        url TEXT NOT NULL,
                        alt_text TEXT,
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create content_blocks table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS content_blocks (
                        id SERIAL PRIMARY KEY,
                        page TEXT NOT NULL,
                        section TEXT NOT NULL,
                        content TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(page, section)
                    )
                ''')
                
                # Keep existing visitor_count table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS visitor_count (
                        id INTEGER PRIMARY KEY DEFAULT 1,
                        count INTEGER NOT NULL DEFAULT 0,
                        CONSTRAINT single_row CHECK (id = 1)
                    )
                ''')
                
                # Insert initial visitor count row if doesn't exist
                cur.execute('''
                    INSERT INTO visitor_count (id, count)
                    VALUES (1, 0)
                    ON CONFLICT (id) DO NOTHING
                ''')
                
                conn.commit()
                print("✓ Database schema initialized successfully")
                
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise


def drop_tables():
    """Drop all tables (use with caution!)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('DROP TABLE IF EXISTS podcast_episodes CASCADE')
                cur.execute('DROP TABLE IF EXISTS projects CASCADE')
                cur.execute('DROP TABLE IF EXISTS images CASCADE')
                cur.execute('DROP TABLE IF EXISTS content_blocks CASCADE')
                conn.commit()
                print("✓ Tables dropped successfully")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        raise


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--drop':
        print("Dropping all tables...")
        drop_tables()
    
    print("Initializing database schema...")
    init_database()
