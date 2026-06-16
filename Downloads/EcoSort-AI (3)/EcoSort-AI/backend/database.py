import os
import sqlite3
import pymysql
from datetime import datetime

DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "",
    "database": "ecosort_ai",
    "port": 3306
}

def get_db_connection():
    """
    Attempts to connect to MySQL database. If it fails, falls back to a local
    SQLite database.
    """
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn, "mysql"
    except Exception as mysql_err:
        # Fallback to SQLite
        try:
            sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ecosort_ai.db")
            conn = sqlite3.connect(sqlite_path)
            return conn, "sqlite"
        except Exception as sqlite_err:
            print("[DATABASE] SQLite fallback connection failed:", sqlite_err)
            raise sqlite_err

def execute_query(query, params=None, fetch="all"):
    """
    Thread-safe helper that opens a database connection, converts placeholders
    for SQLite, executes the query, commits the transaction, and closes the connection.
    """
    conn = None
    try:
        conn, db_type = get_db_connection()
        cursor = conn.cursor()
        
        # SQLite uses '?' placeholder instead of '?'
        if db_type == "sqlite":
            query = query.replace("?", "?")
            
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
            
        if fetch == "all":
            result = cursor.fetchall()
        elif fetch == "one":
            result = cursor.fetchone()
        else:
            result = None
            
        conn.commit()
        return result
    except Exception as e:
        print("[DATABASE] Query execution failed:", e)
        raise e
    finally:
        if conn:
            conn.close()

def init_db():
    """
    Initializes the 10 tables required by the Smart Waste Management System.
    Handles SQLite and MySQL schemas independently.
    """
    conn, db_type = get_db_connection()
    cursor = conn.cursor()
    print(f"[DATABASE] Initializing schema for: {db_type}")
    
    if db_type == "sqlite":
        # Enable Foreign Keys
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 2. Admins table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            permissions TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        
        # 3. Bins table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bins (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'Normal',
            fill_level REAL DEFAULT 0.0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 4. Waste Predictions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            bin_id TEXT NULL,
            filename TEXT,
            prediction TEXT,
            confidence REAL,
            source TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY(bin_id) REFERENCES bins(id) ON DELETE SET NULL
        )
        """)
        
        # 5. Collection Requests table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS collection_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bin_id TEXT,
            status TEXT DEFAULT 'Pending',
            assigned_worker TEXT,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_date TIMESTAMP,
            FOREIGN KEY(bin_id) REFERENCES bins(id) ON DELETE CASCADE
        )
        """)
        
        # 6. Notifications table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bin_id TEXT NULL,
            message TEXT,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(bin_id) REFERENCES bins(id) ON DELETE SET NULL
        )
        """)
        
        # 7. Achievements table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            points_required INTEGER,
            badge_icon TEXT
        )
        """)
        
        # 8. User Points table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            points INTEGER,
            action_type TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        
        # 9. Recycling Tips table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recycling_tips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            category TEXT,
            created_by INTEGER NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
        )
        """)
        
        # 10. Reports table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT,
            user_id INTEGER NULL,
            file_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        )
        """)
        
    else:
        # MySQL schema initialization
        # 1. Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            points INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        """)
        
        # 2. Admins
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE,
            permissions TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """)
        
        # 3. Bins
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bins (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            latitude DOUBLE,
            longitude DOUBLE,
            status VARCHAR(50) DEFAULT 'Normal',
            fill_level DOUBLE DEFAULT 0.0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        """)
        
        # 4. Waste Predictions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS waste_predictions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            bin_id VARCHAR(100) NULL,
            filename VARCHAR(255),
            prediction VARCHAR(50),
            confidence DOUBLE,
            source VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """)
        
        # 5. Collection Requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS collection_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bin_id VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Pending',
            assigned_worker VARCHAR(255) NULL,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_date TIMESTAMP NULL,
            FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """)
        
        # 6. Notifications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bin_id VARCHAR(100) NULL,
            message TEXT,
            type VARCHAR(50) DEFAULT 'info',
            is_read INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """)
        
        # 7. Achievements
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            points_required INT,
            badge_icon VARCHAR(255)
        ) ENGINE=InnoDB;
        """)
        
        # 8. User Points
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_points (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            points INT,
            action_type VARCHAR(100),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
        """)
        
        # 9. Recycling Tips
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recycling_tips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            category VARCHAR(100),
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """)
        
        # 10. Reports
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_type VARCHAR(100),
            user_id INT NULL,
            file_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """)

    # Seed initial data (e.g. achievements, sample recycling tips, default bins)
    # Check if achievements are already seeded
    cursor.execute("SELECT COUNT(*) FROM achievements;")
    count = cursor.fetchone()[0]
    if count == 0:
        achievements_data = [
            ("beginner", "Beginner Recycler", "Classify your first waste item", 10, "🌱"),
            ("warrior", "Green Warrior", "Accumulate 100 points", 100, "⚡"),
            ("champion", "Eco Champion", "Accumulate 500 points", 500, "🏆")
        ]
        for aid, name, desc, pts, icon in achievements_data:
            cursor.execute(
                "INSERT INTO achievements (id, name, description, points_required, badge_icon) VALUES (?, ?, ?, ?, ?)",
                (aid, name, desc, pts, icon)
            )
            
    # Seed default bins if empty
    cursor.execute("SELECT COUNT(*) FROM bins;")
    bin_count = cursor.fetchone()[0]
    if bin_count == 0:
        default_bins = [
            ("bin_1", "City Mall Main Gate", "City Mall - Ground Floor", 12.9716, 77.5946, "Normal", 25.0),
            ("bin_2", "Railway Station Platform 1", "Central Railway Station", 12.9725, 77.5930, "Normal", 55.0),
            ("bin_3", "Greenwood College Library", "College Campus", 12.9690, 77.6010, "Normal", 85.0), # Will trigger email alert/collection on launch
        ]
        for bid, name, loc, lat, lon, status, fill in default_bins:
            # We'll calculate initial status based on fill level
            stat = "Normal"
            if fill > 80:
                stat = "Full"
            elif fill > 50:
                stat = "Warning"
            cursor.execute(
                "INSERT INTO bins (id, name, location, latitude, longitude, status, fill_level) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (bid, name, loc, lat, lon, stat, fill)
            )
            
    # Seed default recycling tips if empty
    cursor.execute("SELECT COUNT(*) FROM recycling_tips;")
    tip_count = cursor.fetchone()[0]
    if tip_count == 0:
        default_tips = [
            ("Wash before you recycle", "Make sure to clean food scraps out of plastic containers before placing them in the recycling bin.", "Plastic"),
            ("Paper and cardboard rules", "Keep cardboard boxes dry and flat to conserve space in the recycling system.", "Paper"),
            ("Electronics disposal", "Never throw electronic waste (phones, batteries) in standard bins. Seek specialized recovery locations.", "E-Waste"),
        ]
        for title, content, category in default_tips:
            cursor.execute(
                "INSERT INTO recycling_tips (title, content, category) VALUES (?, ?, ?)",
                (title, content, category)
            )

    conn.commit()
    conn.close()
    print("[DATABASE] Database successfully initialized and seeded.")
