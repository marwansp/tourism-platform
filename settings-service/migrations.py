"""
Database migration utilities for Settings Service
"""
from sqlalchemy import text
from database import engine, SessionLocal
from models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables():
    """Create all tables defined in models"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Successfully created all tables")
        return True
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        return False


def drop_tables():
    """Drop all tables (use with caution)"""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Successfully dropped all tables")
        return True
    except Exception as e:
        logger.error(f"Failed to drop tables: {e}")
        return False


def run_init_sql():
    """Run the initialization SQL script"""
    try:
        with open('init.sql', 'r') as file:
            sql_commands = file.read()
        
        db = SessionLocal()
        try:
            # Split by semicolon and execute each command
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
            for command in commands:
                if command:
                    db.execute(text(command))
            db.commit()
            logger.info("Successfully executed init.sql")
            return True
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to execute init.sql: {e}")
        return False


def migrate_database():
    """Run complete database migration"""
    logger.info("Starting database migration...")
    
    # Create tables
    if not create_tables():
        return False
    
    # Run initialization SQL
    if not run_init_sql():
        return False
    
    logger.info("Database migration completed successfully")
    return True


if __name__ == "__main__":
    migrate_database()