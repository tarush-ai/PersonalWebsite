#!/usr/bin/env python3
"""
Data Migration Script
Migrates hardcoded podcast episodes and internships from script.js to database
"""

import os
import sys
import re
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

load_dotenv()

from backend.database.schema import get_db_connection


# Podcast data from script.js
PODCAST_EPISODES = [
    {
        "title": "Gemini 3 Pro: The Next Sea Change in LLM Models",
        "desc": "An analysis of Google's Gemini 3 Pro and what it signals about the future of foundation models.",
        "url": "https://www.youtube.com/embed/ZkO8OKDhTuM",
        "notes": "An analysis of Google's Gemini 3 Pro and what it signals about the future of foundation models.",
        "slug": "gemini+3+pro:+the+next+sea+change+in+llm+models"
    },
    {
        "title": "Monetization in AI: The Future of LLMs and Profitability",
        "desc": "An exploration of how large language models transition from research breakthroughs to viable businesses.",
        "url": "https://www.youtube.com/embed/Rp5HDpas2r8",
        "notes": "An exploration of how large language models transition from research breakthroughs to viable businesses.",
        "slug": "monetization+in+ai:+the+future+of+llms+and+profitability"
    },
    {
        "title": "3 AI Trends That Will Change Everything in 2025",
        "desc": "An overview of the most important technical and economic shifts shaping AI's near future.",
        "url": "https://www.youtube.com/embed/9uHFm48cDrI",
        "notes": "An overview of the most important technical and economic shifts shaping AI's near future.",
        "slug": "3+ai+trends+that+will+change+everything+in+2025"
    },
    {
        "title": "Intelligence, In Motion: The Next Leap for AI and Robotics (Mahesh Krishnamurthi)",
        "desc": "A discussion with Mahesh Krishnamurthi, cofounder and CEO of Vayu Robotics, on embodied intelligence, robotics, and AI in physical systems.",
        "url": "https://www.youtube.com/embed/IUuQySu6wPs",
        "notes": "A discussion with Mahesh Krishnamurthi, cofounder and CEO of Vayu Robotics, on embodied intelligence, robotics, and AI in physical systems.",
        "slug": "intelligence,+in+motion:+the+next+leap+for+ai+and+robotics+(mahesh+krishnamurthi)"
    },
    {
        "title": "Are We Living in Sci-Fi Already? Analyzing the Progress of AI Superintelligence",
        "desc": "A grounded look at how close current AI systems are to science-fiction-level intelligence.",
        "url": "https://www.youtube.com/embed/Q1rRuLJfy9M",
        "notes": "A grounded look at how close current AI systems are to science-fiction-level intelligence.",
        "slug": "are+we+living+in+sci-fi+already?+analyzing+the+progress+of+ai+superintelligence"
    },
    {
        "title": "This Week in AI: June 2nd to June 8th, 2025",
        "desc": "A roundup of the most important AI news and research updates from the week.",
        "url": "https://www.youtube.com/embed/C6f_KVbVZx8",
        "notes": "A roundup of the most important AI news and research updates from the week.",
        "slug": "this+week+in+ai:+june+2nd+to+june+8th,+2025"
    },
    {
        "title": "Crypto/GenAI: Your Next ID Card (Kirthiga Reddy)",
        "desc": "A conversation with Kirthiga Reddy, Facebook India's first employee and cofounder and CEO of Verix, on decentralized identity, cryptography, and AI-powered verification systems.",
        "url": "https://www.youtube.com/embed/psZzUWlR85o",
        "notes": "A conversation with Kirthiga Reddy, Facebook India's first employee and cofounder and CEO of Verix, on decentralized identity, cryptography, and AI-powered verification systems.",
        "slug": "crypto/genai:+your+next+id+card+(kirthiga+reddy)"
    },
    {
        "title": "Prompt Engineering 101: Knowing Your Topic",
        "desc": "A foundational guide on how intent, structure, and context shape prompt effectiveness.",
        "url": "https://www.youtube.com/embed/onVrd6PEJXE",
        "notes": "A foundational guide on how intent, structure, and context shape prompt effectiveness.",
        "slug": "prompt+engineering+101:+knowing+your+topic"
    },
    {
        "title": "MCP is crazy",
        "desc": "A deep dive into Model Context Protocols and why they change how AI systems interact with tools.",
        "url": "https://www.youtube.com/embed/vFnC0M960xM",
        "notes": "A deep dive into Model Context Protocols and why they change how AI systems interact with tools.",
        "slug": "mcp+is+crazy"
    },
    {
        "title": "Will AI Take Our Jobs?",
        "desc": "An analysis of automation, labor displacement, and how AI reshapes employment.",
        "url": "https://www.youtube.com/embed/s_yQIp66s_0",
        "notes": "An analysis of automation, labor displacement, and how AI reshapes employment.",
        "slug": "will+ai+take+our+jobs?"
    },
    {
        "title": "Five HOTTEST AI Startups! 🔥",
        "desc": "A breakdown of emerging AI startups, including Manus, Composio, Turing, Loveable, and Sesame, and why they matter in the current ecosystem.",
        "url": "https://www.youtube.com/embed/pJ3sovgTbbY",
        "notes": "A breakdown of emerging AI startups, including Manus, Composio, Turing, Loveable, and Sesame, and why they matter in the current ecosystem.",
        "slug": "five+hottest+ai+startups!+🔥"
    },
    {
        "title": "FOR BEGINNERS: EVERYTHING in AI over 6 weeks in 15 minutes",
        "desc": "A fast, structured overview of modern AI concepts for complete beginners.",
        "url": "https://www.youtube.com/embed/bCI0KQAvlUw",
        "notes": "A fast, structured overview of modern AI concepts for complete beginners.",
        "slug": "for+beginners:+everything+in+ai+over+6+weeks+in+15+minutes"
    },
    {
        "title": "How AI Can Slash the Defense Budget (Yogesh Kumar)",
        "desc": "A discussion with Yogesh Kumar, the ex Director of HAL and man behind India's first light combat aircraft, on how AI systems can reduce inefficiencies and costs in large-scale defense operations.",
        "url": "https://www.youtube.com/embed/7EnsPFIgvX4",
        "notes": "A discussion with Yogesh Kumar, the ex Director of HAL and man behind India's first light combat aircraft, on how AI systems can reduce inefficiencies and costs in large-scale defense operations.",
        "slug": "how+ai+can+slash+the+defense+budget+(yogesh+kumar)"
    },
    {
        "title": "How to 1000x Your Sales Insights Through Short Form Content (Gaurav Mishra)",
        "desc": "A conversation with Gaurav Mishra, founder and CEO of ProShort, on using short-form content and AI to dramatically improve sales intelligence and distribution.",
        "url": "https://www.youtube.com/embed/0BihMbhJNcM",
        "notes": "A conversation with Gaurav Mishra, founder and CEO of ProShort, on using short-form content and AI to dramatically improve sales intelligence and distribution.",
        "slug": "how+to+1000x+your+sales+insights+through+short+form+content+(gaurav+mishra)"
    },
    {
        "title": "Welcome to Neural Bridge!",
        "desc": "An introduction to Neural Bridge and its mission to connect cutting-edge AI research with real-world impact.",
        "url": "https://www.youtube.com/embed/Wd5EESuc_cg",
        "notes": "An introduction to Neural Bridge and its mission to connect cutting-edge AI research with real-world impact.",
        "slug": "welcome+to+neural+bridge!"
    }
]

# Internship data from script.js
INTERNSHIPS = {
    'turing': {
        'company': 'Turing',
        'role': 'AI Training & Evaluation',
        'period': '2025',
        'description': 'Built datasourcing and post training workflows for a frontier lab on their SOTA AI model.',
        'details': '''<ul>
            <li>Built datasourcing and post training workflows for a frontier lab on their SOTA AI model.</li>
            <li>Proposed and executed product and engineering features for a client project.</li>
            <li>Built automation infrastructure for the executive team.</li>
            <li>Reported to CEO.</li>
        </ul>''',
        'tags': ['AI', 'Machine Learning', 'NLP'],
        'contact': {
            'email': 'tarushgs@gmail.com',
            'cc': 'tarush.gupta@turing.com',
            'subject': 'Turing: '
        }
    },
    'humanx': {
        'company': 'HumanX',
        'role': 'Engineering Intern',
        'period': '2024',
        'description': 'HumanX is a venture-backed cross-vertical gathering of the most influential people in AI.',
        'details': '''<ul>
            <li>HumanX is a venture-backed cross-vertical gathering of the most influential people in AI, in March of 2025.</li>
            <li>Building a comprehensive competitive strategy by conducting analysis and coordinating speaker logistics.</li>
            <li>Reporting to Marketing, Speaker Outreach, and the CEO.</li>
        </ul>''',
        'tags': ['AI', 'Product', 'Engineering'],
        'contact': {
            'email': 'tarushgs@gmail.com',
            'subject': 'HumanX: '
        }
    },
    'ema': {
        'company': 'Ema Unlimited',
        'role': 'Software Engineering',
        'period': '2024',
        'description': 'Ema is an AI "employee" which turns intricate workflows into a chat, boosting company-wide productivity.',
        'details': '''<ul>
            <li>Ema is an AI "employee" which turns intricate workflows into a chat, boosting company-wide productivity.</li>
            <li>Deeply analyzed a specific vertical and identified pain points requiring AI innovation.</li>
            <li>Reporting directly to the CEO.</li>
        </ul>''',
        'tags': ['AI', 'Enterprise', 'Automation'],
        'contact': {
            'email': 'tarushgs@gmail.com',
            'subject': 'Ema: '
        }
    },
    'proshort': {
        'company': 'Proshort',
        'role': 'Engineering Intern',
        'period': '2023',
        'description': 'Proshort is a short-form video generation platform for enterprises.',
        'details': '''<ul>
            <li>Proshort is a short-form video generation platform for enterprises.</li>
            <li>Created competitive strategy, market positioning and feature roadmap, working for the head of product.</li>
            <li>Earned special recommendation from the CEO, who is currently executing the proposed roadmap.</li>
        </ul>''',
        'tags': ['Video', 'Content', 'Tech'],
        'contact': {
            'email': 'tarushgs@gmail.com',
            'subject': 'Proshort: '
        }
    }
}


def migrate_podcasts():
    """Migrate podcast episodes to database"""
    print("\n🎙️  Migrating podcast episodes...")
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                migrated = 0
                skipped = 0
                
                for idx, episode in enumerate(PODCAST_EPISODES):
                    # Check if episode already exists
                    cur.execute('SELECT id FROM podcast_episodes WHERE slug = %s', (episode['slug'],))
                    if cur.fetchone():
                        print(f"  ⏭️  Skipped (exists): {episode['title']}")
                        skipped += 1
                        continue
                    
                    # Insert episode
                    cur.execute('''
                        INSERT INTO podcast_episodes (title, description, youtube_url, slug, notes, order_index, published)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        episode['title'],
                        episode['desc'],
                        episode['url'],
                        episode['slug'],
                        episode['notes'],
                        len(PODCAST_EPISODES) - idx,  # Reverse order for newest first
                        True
                    ))
                    
                    print(f"  ✓ Migrated: {episode['title']}")
                    migrated += 1
                
                conn.commit()
                print(f"\n✓ Podcast migration complete: {migrated} migrated, {skipped} skipped")
                
    except Exception as e:
        print(f"\n✗ Error migrating podcasts: {e}")
        raise


def migrate_internships():
    """Migrate internships/projects to database"""
    print("\n💼 Migrating internships...")
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                migrated = 0
                skipped = 0
                
                for slug, data in INTERNSHIPS.items():
                    # Check if project already exists
                    cur.execute('SELECT id FROM projects WHERE slug = %s', (slug,))
                    if cur.fetchone():
                        print(f"  ⏭️  Skipped (exists): {data['company']}")
                        skipped += 1
                        continue
                    
                    # Insert project
                    cur.execute('''
                        INSERT INTO projects (type, company, role, period, description, details, tags, slug, contact_email, contact_subject, published)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        'internship',
                        data['company'],
                        data['role'],
                        data['period'],
                        data['description'],
                        data['details'],
                        data['tags'],
                        slug,
                        data['contact']['email'],
                        data['contact']['subject'],
                        True
                    ))
                    
                    print(f"  ✓ Migrated: {data['company']}")
                    migrated += 1
                
                conn.commit()
                print(f"\n✓ Internship migration complete: {migrated} migrated, {skipped} skipped")
                
    except Exception as e:
        print(f"\n✗ Error migrating internships: {e}")
        raise


def main():
    """Run all migrations"""
    print("=" * 60)
    print("🚀 Data Migration Script")
    print("=" * 60)
    
    # Check if DATABASE_URL is set
    if not os.environ.get('DATABASE_URL'):
        print("\n✗ ERROR: DATABASE_URL environment variable not set")
        print("   Please set DATABASE_URL in your .env file")
        return 1
    
    try:
        # Run migrations
        migrate_podcasts()
        migrate_internships()
        
        print("\n" + "=" * 60)
        print("✓ All migrations completed successfully!")
        print("=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
