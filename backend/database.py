
from peewee import SqliteDatabase

db = SqliteDatabase(
    'gestion_escolar.db',
    pragmas={
        'journal_mode': 'wal',
        'foreign_keys': 1,
    }
)
