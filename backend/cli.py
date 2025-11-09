"""
CLI commands for managing the application
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def seed_database(force: bool = False):
    """Seed the database with initial data"""
    from app.utils.seed import seed_all
    seed_all(force=force)

def main():
    """Main CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='EnglishWebAI CLI')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Seed command
    parser_seed = subparsers.add_parser('seed', help='Seed database with initial data')
    parser_seed.add_argument('--force', action='store_true', help='Force reseed (delete existing data)')

    args = parser.parse_args()

    if args.command == 'seed':
        seed_database(force=args.force)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
