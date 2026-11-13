"""Convert UUID IDs and references to generated integers, preserving legacy IDs.

Revision ID: 0003
Revises: 0002

This demo-scale migration rebuilds the application tables in one transaction on
PostgreSQL. Stop API writers first. It deliberately does not import live models.
"""

from uuid import UUID, uuid4

import sqlalchemy as sa
from alembic import context, op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

MAP_TABLE = "_uuid_integer_map"
ID_TABLES = (
    "destinations",
    "itineraries",
    "itinerary_items",
    "quizzes",
    "quiz_questions",
    "quiz_options",
    "quiz_attempts",
    "quiz_attempt_answers",
    "reward_grants",
    "point_transactions",
    "voucher_offers",
    "voucher_claims",
)
TABLES = (*ID_TABLES, "users", "wallets", "favorites")


def _mapping_table(metadata):
    return sa.Table(
        MAP_TABLE,
        metadata,
        sa.Column("table_name", sa.String(80), primary_key=True),
        sa.Column("legacy_uuid", sa.String(36), primary_key=True),
        sa.Column("integer_id", sa.Integer(), nullable=False),
        sa.UniqueConstraint("table_name", "integer_id", name="uq_uuid_integer_map_id"),
    )


def _convert(*, reverse=False):
    if context.is_offline_mode():
        raise RuntimeError("0003 needs a live connection to map existing IDs; do not use --sql.")
    bind = op.get_bind()
    if bind.dialect.name not in {"postgresql", "sqlite"}:
        raise RuntimeError("0003 supports PostgreSQL and SQLite only.")
    if bind.dialect.name == "postgresql":
        # Block concurrent inserts/updates before taking a consistent snapshot.
        names = ", ".join(bind.dialect.identifier_preparer.quote(name) for name in TABLES)
        bind.exec_driver_sql(f"LOCK TABLE {names} IN ACCESS EXCLUSIVE MODE")

    metadata = sa.MetaData()
    tables = {name: sa.Table(name, metadata, autoload_with=bind) for name in TABLES}
    columns = {}
    for name, table in tables.items():
        columns[name] = {}
        if name in ID_TABLES:
            columns[name]["id"] = name
        for fk in table.foreign_keys:
            if fk.column.table.name in ID_TABLES and fk.column.name == "id":
                columns[name][fk.parent.name] = fk.column.table.name
    columns["point_transactions"]["source_id"] = "_source"
    # SQLite reflects UUID as CHAR; restore UUID result processors for old data.
    if not reverse:
        for name, fields in columns.items():
            for field in fields:
                tables[name].c[field].type = sa.Uuid()
    rows = {
        name: [dict(row) for row in bind.execute(sa.select(table)).mappings()]
        for name, table in tables.items()
    }
    mapping = _mapping_table(sa.MetaData())
    forward = {name: {} for name in (*ID_TABLES, "_source")}
    if reverse:
        for row in bind.execute(sa.select(mapping)).mappings():
            forward[row["table_name"]][row["integer_id"]] = UUID(row["legacy_uuid"])
        for name in ID_TABLES:
            for row in rows[name]:
                forward[name].setdefault(row["id"], uuid4())
    else:
        for name in ID_TABLES:
            for number, row in enumerate(sorted(rows[name], key=lambda row: str(row["id"])), 1):
                forward[name][row["id"]] = number
        # source_id is polymorphic and has no FK/type discriminator. Refuse to
        # guess when it is missing or points to multiple possible entities.
        for row in rows["point_transactions"]:
            source = row["source_id"]
            if source is None:
                continue
            matches = [
                ids[source] for name, ids in forward.items() if name != "_source" and source in ids
            ]
            if len(matches) != 1:
                raise RuntimeError(
                    "Cannot map point_transactions.source_id unambiguously; "
                    "resolve the source reference before running 0003."
                )
            forward["_source"][source] = matches[0]
        # A reverse lookup must also be unambiguous across source entity types.
        if len(set(forward["_source"].values())) != len(forward["_source"]):
            raise RuntimeError("Ambiguous integer source IDs; resolve point transaction sources.")

    for name, fields in columns.items():
        for row in rows[name]:
            for field, target in fields.items():
                value = row[field]
                if value is not None:
                    if value not in forward[target]:
                        raise RuntimeError(f"Cannot map {name}.{field}; no matching source ID.")
                    row[field] = forward[target][value]
        for field in fields:
            tables[name].c[field].type = sa.Uuid() if reverse else sa.Integer()
        if name in ID_TABLES:
            tables[name].c.id.autoincrement = not reverse
            # A reflected PostgreSQL SERIAL default refers to the old owned
            # sequence, which disappears when its table is dropped. Let CREATE
            # generate a fresh sequence for integers; UUIDs have no DB default.
            tables[name].c.id.server_default = None

    # All application FKs form an acyclic graph, so children drop before parents.
    ordered = metadata.sorted_tables
    for table in reversed(ordered):
        table.drop(bind)
    for table in ordered:
        table.create(bind)
        if rows[table.name]:
            bind.execute(table.insert(), rows[table.name])
    if bind.dialect.name == "postgresql" and not reverse:
        for name in ID_TABLES:
            bind.execute(
                sa.text(
                    "SELECT setval(pg_get_serial_sequence(:table_name, 'id'), "
                    f"COALESCE((SELECT max(id) FROM {name}), 1), "
                    f"EXISTS (SELECT 1 FROM {name}))"
                ),
                {"table_name": name},
            )
    if reverse:
        mapping.drop(bind)
    else:
        mapping.create(bind)
        records = [
            {"table_name": name, "legacy_uuid": str(old), "integer_id": new}
            for name, ids in forward.items()
            for old, new in ids.items()
        ]
        if records:
            bind.execute(mapping.insert(), records)


def upgrade():
    _convert()


def downgrade():
    _convert(reverse=True)
