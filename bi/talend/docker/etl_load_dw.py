#!/usr/bin/env python3
"""
ETL Find-Me — runtime Docker aligné sur le job Talend « FindMe_Load_DW ».
Alimentation automatique de findme_dw (schéma en étoile) depuis les 5 bases OLTP.
Exécution : docker compose run --rm talend-etl
"""
from __future__ import annotations

import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pymysql

MYSQL_HOST = os.environ.get("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_ETL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_ETL_PASSWORD", "root")

DW = "findme_dw"
ETL_BUILD = "talend-findme-2026"  # runtime Docker (job Talend documenté dans bi/talend/studio/)
UNKNOWN_DATE_KEY = 19000101
SCHEMA_SQL = os.environ.get("DW_SCHEMA_SQL", "/ddl/schema.sql")
PATCH_SQL = os.environ.get("DW_PATCH_SQL", "/ddl/migrations/001_patch_etl_log_scd2.sql")

REQUIRED_DW_TABLES = (
    "dim_date",
    "dim_user",
    "dim_user_scd2",
    "dim_mission",
    "dim_skill",
    "fact_candidature",
    "etl_run_log",
)


def connect(db: str | None = None):
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=db,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def _col(row: dict | None, *names: str, default=0):
    """Accès insensible à la casse (MySQL peut renvoyer C, N, TOTAL_ROWS…)."""
    if not row:
        return default
    lower = {str(k).lower(): v for k, v in row.items()}
    for name in names:
        key = name.lower()
        if key in lower:
            return lower[key]
    return default


def wait_for_mysql(max_wait_sec: int = 90) -> None:
    """Au compose up, MySQL peut être healthy avant d'accepter les connexions."""
    deadline = time.time() + max_wait_sec
    last_err: Exception | None = None
    while time.time() < deadline:
        try:
            conn = connect()
            conn.close()
            print(f"MySQL prêt ({MYSQL_HOST}:{MYSQL_PORT})")
            return
        except pymysql.err.OperationalError as exc:
            last_err = exc
            print(f"En attente MySQL… ({exc})", flush=True)
            time.sleep(2)
    raise RuntimeError(f"MySQL indisponible après {max_wait_sec}s : {last_err}")


def date_key_from_date(d: date | None) -> int:
    if d is None:
        return UNKNOWN_DATE_KEY
    return d.year * 10000 + d.month * 100 + d.day


def populate_dim_date(cur) -> None:
    cur.execute(
        """
        INSERT IGNORE INTO dim_date
          (date_key, full_date, year_num, month_num, quarter_num, month_name, day_of_week, week_of_year, is_weekend)
        VALUES (19000101, '1900-01-01', 1900, 1, 1, 'Inconnu', 1, 1, 0)
        """
    )
    cur.execute("SELECT COUNT(*) AS c FROM dim_date WHERE date_key > 19000101")
    if _col(cur.fetchone(), "c") > 0:
        print("dim_date : déjà peuplée")
        return
    start = date(2020, 1, 1)
    end = date(2035, 12, 31)
    rows = []
    d = start
    while d <= end:
        dk = date_key_from_date(d)
        q = (d.month - 1) // 3 + 1
        rows.append(
            (
                dk,
                d,
                d.year,
                d.month,
                q,
                d.strftime("%B"),
                d.isoweekday(),
                d.isocalendar()[1],
                1 if d.isoweekday() >= 6 else 0,
            )
        )
        d += timedelta(days=1)
    cur.executemany(
        """
        INSERT INTO dim_date
          (date_key, full_date, year_num, month_num, quarter_num, month_name, day_of_week, week_of_year, is_weekend)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        rows,
    )
    print(f"dim_date : {len(rows)} dates insérées")


def ensure_unknown_user(cur) -> int:
    cur.execute(
        """
        INSERT IGNORE INTO dim_user (user_key, user_id, role_name, status_name, country, sexe)
        VALUES (0, -1, 'INCONNU', 'INCONNU', 'Non renseigné', 'Non renseigné')
        """
    )
    return 0


def _clear_user_dimension(cur) -> None:
    """Supprime les faits liés à dim_user avant rechargement SCD1."""
    for table in ("fact_codingame", "fact_quiz", "fact_cv", "fact_user"):
        cur.execute(f"DELETE FROM {table}")
    cur.execute("DELETE FROM dim_user WHERE user_key > 0")


def ensure_powerbi_readonly_grants(root_conn) -> None:
    """Compte lecture seule pour Power BI (findme_bi) sur findme_dw."""
    with root_conn.cursor() as cur:
        cur.execute("GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%'")
        cur.execute("FLUSH PRIVILEGES")
    root_conn.commit()
    print("findme_bi : SELECT sur findme_dw accordé")


def load_dim_user(cur, src) -> dict[int, int]:
    """Retourne mapping user_id -> user_key."""
    _clear_user_dimension(cur)
    src.execute(
        """
        SELECT u.user_id, COALESCE(r.role, 'INCONNU') AS role_name,
               COALESCE(CAST(u.status AS CHAR), 'INCONNU') AS status_name,
               COALESCE(NULLIF(TRIM(u.country), ''), 'Non renseigné') AS country,
               COALESCE(NULLIF(TRIM(u.sexe), ''), 'Non renseigné') AS sexe
        FROM user_bd.users u
        LEFT JOIN user_bd.roles r ON r.role_id = u.role_id
        """
    )
    mapping: dict[int, int] = {}
    for row in src.fetchall():
        cur.execute(
            """
            INSERT INTO dim_user (user_id, role_name, status_name, country, sexe)
            VALUES (%s,%s,%s,%s,%s)
            """,
            (
                row["user_id"],
                row["role_name"],
                row["status_name"],
                row["country"],
                row["sexe"],
            ),
        )
        mapping[int(row["user_id"])] = cur.lastrowid
        cur.execute(
            "INSERT INTO fact_user (user_key, user_count) VALUES (%s, 1)",
            (cur.lastrowid,),
        )
    print(f"dim_user / fact_user : {len(mapping)} utilisateurs")
    return mapping


def load_dim_user_scd2(cur, src) -> None:
    """SCD Type 2 : conserve l'historique des changements rôle / statut / pays."""
    src.execute(
        """
        SELECT u.user_id, COALESCE(r.role, 'INCONNU') AS role_name,
               COALESCE(CAST(u.status AS CHAR), 'INCONNU') AS status_name,
               COALESCE(NULLIF(TRIM(u.country), ''), 'Non renseigné') AS country
        FROM user_bd.users u
        LEFT JOIN user_bd.roles r ON r.role_id = u.role_id
        """
    )
    today = date.today()
    changes = 0
    for row in src.fetchall():
        uid = int(row["user_id"])
        cur.execute(
            """
            SELECT user_scd_key, role_name, status_name, country
            FROM dim_user_scd2
            WHERE user_id = %s AND is_current = 1
            LIMIT 1
            """,
            (uid,),
        )
        current = cur.fetchone()
        new_vals = (row["role_name"], row["status_name"], row["country"])
        if not current:
            cur.execute(
                """
                INSERT INTO dim_user_scd2
                  (user_id, role_name, status_name, country, valid_from, valid_to, is_current)
                VALUES (%s,%s,%s,%s,%s,NULL,1)
                """,
                (uid, *new_vals, today),
            )
            continue
        old_vals = (current["role_name"], current["status_name"], current["country"])
        if old_vals == new_vals:
            continue
        cur.execute(
            """
            UPDATE dim_user_scd2
            SET valid_to = %s, is_current = 0
            WHERE user_scd_key = %s
            """,
            (today, current["user_scd_key"]),
        )
        cur.execute(
            """
            INSERT INTO dim_user_scd2
              (user_id, role_name, status_name, country, valid_from, valid_to, is_current)
            VALUES (%s,%s,%s,%s,%s,NULL,1)
            """,
            (uid, *new_vals, today),
        )
        changes += 1
    print(f"dim_user_scd2 : {changes} changement(s) de version")


def load_dim_mission(cur, src) -> dict[int, int]:
    cur.execute("DELETE FROM fact_mission")
    cur.execute("DELETE FROM fact_mission_favori")
    cur.execute("DELETE FROM fact_candidature")
    cur.execute("DELETE FROM dim_mission")
    src.execute(
        """
        SELECT m.id_mission AS mission_id,
               COALESCE(m.status_mission, 'INCONNU') AS status_mission,
               COALESCE(CAST(d.type_contrat AS CHAR), 'Non renseigné') AS type_contrat,
               CASE WHEN d.is_remote = 1 THEN 1 ELSE 0 END AS is_remote,
               COALESCE(v.nomdeville, 'Non renseigné') AS ville,
               COALESCE(p.nom, 'Non renseigné') AS pays,
               COALESCE(d.mission_name, '') AS mission_name,
               COALESCE(m.reference_code, '') AS reference_code,
               m.created_at,
               m.user_id AS publisher_user_id
        FROM mission_bd.mission m
        LEFT JOIN mission_bd.descrip_mission d ON d.id_mission = m.id_mission
        LEFT JOIN mission_bd.ville v ON v.id_ville = m.ville_id
        LEFT JOIN mission_bd.pays p ON p.id = m.pays_id
        """
    )
    mapping: dict[int, int] = {}
    for row in src.fetchall():
        cur.execute(
            """
            INSERT INTO dim_mission
              (mission_id, status_mission, type_contrat, is_remote, ville, pays, mission_name, reference_code)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                row["mission_id"],
                row["status_mission"],
                row["type_contrat"],
                row["is_remote"],
                row["ville"],
                row["pays"],
                row["mission_name"],
                row["reference_code"],
            ),
        )
        mk = cur.lastrowid
        mapping[int(row["mission_id"])] = mk
        created = row["created_at"]
        dk = UNKNOWN_DATE_KEY
        if created:
            dk = date_key_from_date(created.date() if hasattr(created, "date") else created)
        cur.execute(
            """
            INSERT INTO fact_mission (mission_key, date_key, publisher_user_id, mission_count)
            VALUES (%s,%s,%s,1)
            """,
            (mk, dk, row["publisher_user_id"]),
        )
    print(f"dim_mission / fact_mission : {len(mapping)} missions")
    return mapping


def load_dim_skill(cur, src) -> None:
    cur.execute("DELETE FROM dim_skill")
    src.execute(
        """
        SELECT skill_label, skill_category, COUNT(*) AS usage_count
        FROM (
          SELECT TRIM(c.language_programmation) AS skill_label, 'Langage' AS skill_category
          FROM cv_bd.competence c
          INNER JOIN cv_bd.cv_competence cc ON cc.competence_id = c.id_competence
          WHERE c.language_programmation IS NOT NULL AND TRIM(c.language_programmation) <> ''
          UNION ALL
          SELECT TRIM(c.framework), 'Framework'
          FROM cv_bd.competence c
          INNER JOIN cv_bd.cv_competence cc ON cc.competence_id = c.id_competence
          WHERE c.framework IS NOT NULL AND TRIM(c.framework) <> ''
          UNION ALL
          SELECT TRIM(c.db), 'Base de données'
          FROM cv_bd.competence c
          INNER JOIN cv_bd.cv_competence cc ON cc.competence_id = c.id_competence
          WHERE c.db IS NOT NULL AND TRIM(c.db) <> ''
          UNION ALL
          SELECT TRIM(c.outils), 'Outils'
          FROM cv_bd.competence c
          INNER JOIN cv_bd.cv_competence cc ON cc.competence_id = c.id_competence
          WHERE c.outils IS NOT NULL AND TRIM(c.outils) <> ''
        ) s
        GROUP BY skill_label, skill_category
        """
    )
    n = 0
    for row in src.fetchall():
        cur.execute(
            """
            INSERT INTO dim_skill (skill_label, skill_category, usage_count)
            VALUES (%s,%s,%s)
            """,
            (row["skill_label"], row["skill_category"], row["usage_count"]),
        )
        n += 1
    print(f"dim_skill : {n} compétences")


def load_fact_candidature(cur, src, mission_map: dict[int, int]) -> None:
    src.execute(
        """
        SELECT c.id_candidature, c.candidat_id, c.statut_candidature, c.date_postulation, c.mission_id
        FROM mission_bd.candidature c
        WHERE c.mission_id IS NOT NULL
        """
    )
    n = 0
    for row in src.fetchall():
        mid = int(row["mission_id"])
        if mid not in mission_map:
            continue
        statut = row["statut_candidature"] or "ENCOURS"
        dp = row["date_postulation"]
        dk = UNKNOWN_DATE_KEY
        if dp:
            dk = date_key_from_date(dp.date() if hasattr(dp, "date") else dp)
        cur.execute(
            """
            INSERT INTO fact_candidature
              (date_key, mission_key, candidat_user_id, statut_candidature, candidature_count,
               is_accepted, is_refused, is_en_cours)
            VALUES (%s,%s,%s,%s,1,%s,%s,%s)
            """,
            (
                dk,
                mission_map[mid],
                row["candidat_id"],
                statut,
                1 if statut == "ACCEPTER" else 0,
                1 if statut == "REFUSER" else 0,
                1 if statut == "ENCOURS" else 0,
            ),
        )
        n += 1
    print(f"fact_candidature : {n} lignes")


def load_fact_favori(cur, src, mission_map: dict[int, int]) -> None:
    try:
        src.execute(
            """
            SELECT mf.mission_id AS mission_id, mf.user_type
            FROM mission_bd.mission_favoris mf
            """
        )
    except pymysql.err.ProgrammingError:
        print("fact_mission_favori : table absente (skip)")
        return
    n = 0
    for row in src.fetchall():
        mid = int(row["mission_id"])
        if mid not in mission_map:
            continue
        cur.execute(
            """
            INSERT INTO fact_mission_favori (date_key, mission_key, user_type, favori_count)
            VALUES (%s,%s,%s,1)
            """,
            (UNKNOWN_DATE_KEY, mission_map[mid], row["user_type"] or "INCONNU"),
        )
        n += 1
    print(f"fact_mission_favori : {n} lignes")


def load_fact_notification(cur, src) -> None:
    cur.execute("DELETE FROM fact_notification")
    try:
        src.execute(
            """
            SELECT n.timestamp, n.user_id, n.is_read
            FROM user_bd.notification n
            WHERE n.timestamp IS NOT NULL
            """
        )
    except pymysql.err.ProgrammingError:
        print("fact_notification : table absente (skip)")
        return
    n = 0
    for row in src.fetchall():
        ts = row["timestamp"]
        dk = date_key_from_date(ts.date() if hasattr(ts, "date") else ts)
        cur.execute(
            """
            INSERT INTO fact_notification (date_key, user_id_degen, is_read, notification_count)
            VALUES (%s,%s,%s,1)
            """,
            (dk, str(row["user_id"] or ""), 1 if row["is_read"] else 0),
        )
        n += 1
    print(f"fact_notification : {n} lignes")


def load_fact_cv(cur, src, user_map: dict[int, int]) -> None:
    cur.execute("DELETE FROM fact_cv")
    src.execute(
        """
        SELECT c.id_cv, c.user_id, c.created_at,
               (SELECT COUNT(*) FROM cv_bd.cv_completed_steps s WHERE s.cv_id = c.id_cv) AS steps_completed
        FROM cv_bd.cv c
        """
    )
    n = 0
    for row in src.fetchall():
        uid = row["user_id"]
        if uid is None:
            continue
        uk = user_map.get(int(uid), 0)
        if uk == 0:
            continue
        ca = row["created_at"]
        dk = UNKNOWN_DATE_KEY
        if ca:
            dk = date_key_from_date(ca.date() if hasattr(ca, "date") else ca)
        cur.execute(
            """
            INSERT INTO fact_cv (date_key, user_key, cv_count, steps_completed)
            VALUES (%s,%s,1,%s)
            """,
            (dk, uk, row["steps_completed"] or 0),
        )
        n += 1
    print(f"fact_cv : {n} lignes")


def load_fact_quiz(cur, src, user_map: dict[int, int]) -> None:
    cur.execute("DELETE FROM fact_quiz")
    src.execute("SELECT user_id, score, passed FROM quiz_bd.user_quiz_results")
    n = 0
    for row in src.fetchall():
        uk = user_map.get(int(row["user_id"]), 0)
        if uk == 0:
            continue
        cur.execute(
            """
            INSERT INTO fact_quiz (date_key, user_key, score, passed, attempt_count)
            VALUES (%s,%s,%s,%s,1)
            """,
            (UNKNOWN_DATE_KEY, uk, row["score"] or 0, 1 if row["passed"] else 0),
        )
        n += 1
    print(f"fact_quiz : {n} lignes")


def load_fact_codingame(cur, src, user_map: dict[int, int]) -> None:
    cur.execute("DELETE FROM fact_codingame")
    sql_with_results = """
        SELECT es.user_id, es.start_time, es.total_score,
               COALESCE(f.name, 'Sans framework') AS framework_name,
               COALESCE(er.score, es.total_score) AS score
        FROM codingame_bd.evaluation_session es
        LEFT JOIN codingame_bd.evaluation_result er ON er.session_id = es.id
        LEFT JOIN codingame_bd.framework f ON f.id = er.framework_id
    """
    sql_sessions_only = """
        SELECT es.user_id, es.start_time, es.total_score,
               'Sans framework' AS framework_name,
               es.total_score AS score
        FROM codingame_bd.evaluation_session es
    """
    try:
        src.execute(sql_with_results)
    except pymysql.err.ProgrammingError:
        print("fact_codingame : repli sessions seules (schéma evaluation_result différent)")
        src.execute(sql_sessions_only)
    n = 0
    for row in src.fetchall():
        uk = user_map.get(int(row["user_id"]), 0)
        if uk == 0:
            continue
        st = row["start_time"]
        dk = UNKNOWN_DATE_KEY
        if st:
            dk = date_key_from_date(st.date() if hasattr(st, "date") else st)
        cur.execute(
            """
            INSERT INTO fact_codingame
              (date_key, user_key, framework_name, score, total_score, session_count)
            VALUES (%s,%s,%s,%s,%s,1)
            """,
            (
                dk,
                uk,
                row["framework_name"],
                float(row["score"] or 0),
                float(row["total_score"]) if row["total_score"] is not None else None,
            ),
        )
        n += 1
    print(f"fact_codingame : {n} lignes")


def _row_value(row: dict) -> str:
    """DictCursor : clé variable selon MySQL (table_name, TABLE_NAME, Tables_in_findme_dw)."""
    return str(next(iter(row.values()))).lower()


def _existing_dw_tables() -> set[str]:
    """Liste les tables de findme_dw (SHOW TABLES, plus fiable que information_schema multi-connexion)."""
    try:
        dw_conn = connect(DW)
    except pymysql.err.OperationalError as exc:
        if exc.args and exc.args[0] == 1049:
            return set()
        raise
    try:
        with dw_conn.cursor() as cur:
            cur.execute("SHOW TABLES")
            return {_row_value(row) for row in cur.fetchall()}
    finally:
        dw_conn.close()


def _strip_sql_comments(sql: str) -> str:
    """Retire les lignes -- (sinon un bloc « -- … CREATE TABLE » est ignoré en entier)."""
    return "\n".join(
        line for line in sql.splitlines() if not line.strip().startswith("--")
    )


def _prepare_schema_sql(raw: str) -> str:
    """Retire CREATE DATABASE / USE (connexion déjà sur findme_dw)."""
    sql = _strip_sql_comments(raw)
    sql = re.sub(
        r"CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+`?findme_dw`?\s*;?",
        "",
        sql,
        flags=re.IGNORECASE,
    )
    sql = re.sub(r"USE\s+`?findme_dw`?\s*;?", "", sql, flags=re.IGNORECASE)
    return sql


def _sql_statements(path: Path) -> list[str]:
    if not path.is_file():
        return []
    prepared = _prepare_schema_sql(path.read_text(encoding="utf-8"))
    return [s.strip() for s in prepared.split(";") if s.strip()]


def _apply_sql_file(path: Path, label: str) -> None:
    if not path.is_file():
        print(f"ATTENTION: fichier SQL introuvable: {path}", file=sys.stderr)
        return
    statements = _sql_statements(path)
    if not statements:
        return
    dw_conn = connect(DW)
    try:
        with dw_conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            for i, stmt in enumerate(statements, 1):
                preview = " ".join(stmt.split()[:4])
                try:
                    cur.execute(stmt)
                except pymysql.err.MySQLError as exc:
                    code = exc.args[0] if exc.args else 0
                    if code in (1050, 1061):
                        continue
                    print(
                        f"ERREUR SQL [{i}/{len(statements)}] {preview}: {exc}",
                        file=sys.stderr,
                    )
                    raise
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
        dw_conn.commit()
        created = _existing_dw_tables()
        print(
            f"Schéma findme_dw : {label} ({path.name}, {len(statements)} requêtes, "
            f"{len(created)} tables/vues)"
        )
    finally:
        dw_conn.close()


def _reset_dw_database(conn) -> None:
    print("findme_dw : réinitialisation (schéma incohérent détecté)")
    with conn.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS `{DW}`")
        cur.execute(f"CREATE DATABASE `{DW}`")
    conn.commit()


def _missing_required_tables() -> list[str]:
    present = _existing_dw_tables()
    return [t for t in REQUIRED_DW_TABLES if t not in present]


def ensure_dw_schema(conn) -> None:
    """Crée ou complète findme_dw (volumes MySQL anciens sans etl_run_log / SCD2)."""
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DW}`")
    conn.commit()

    missing = _missing_required_tables()
    if not missing:
        print("findme_dw : schéma complet")
        return

    print(f"findme_dw : tables manquantes → {', '.join(missing)}")
    present = _existing_dw_tables()
    if "dim_date" not in present:
        _apply_sql_file(Path(SCHEMA_SQL), "DDL complet")
    else:
        _apply_sql_file(Path(PATCH_SQL), "patch")
        if _missing_required_tables():
            print(f"findme_dw : complément DDL pour {_missing_required_tables()}")
            _apply_sql_file(Path(SCHEMA_SQL), "complément")

    still_after_ddl = _missing_required_tables()
    if still_after_ddl:
        # Ne reset que si l'entrepôt est vraiment vide / incohérent (évite DROP à chaque up)
        present = _existing_dw_tables()
        if not present or "dim_date" not in present:
            _reset_dw_database(conn)
            _apply_sql_file(Path(SCHEMA_SQL), "DDL complet (reset)")
        else:
            print(
                f"ATTENTION: tables encore manquantes {still_after_ddl} "
                f"mais {len(present)} objet(s) présents — pas de DROP auto",
                file=sys.stderr,
            )

    still_missing = _missing_required_tables()
    if still_missing:
        present_now = sorted(_existing_dw_tables())
        raise RuntimeError(
            f"Schéma findme_dw incomplet après DDL : {', '.join(still_missing)}. "
            f"Tables présentes : {present_now or '(aucune)'}"
        )
    print("findme_dw : schéma prêt")


def _etl_log_start(cur) -> int:
    cur.execute(
        "INSERT INTO etl_run_log (started_at, status) VALUES (%s, 'RUNNING')",
        (datetime.now(timezone.utc),),
    )
    return cur.lastrowid


def run_dq_checks(cur) -> None:
    """Contrôles qualité post-charge (Bloc 6)."""
    checks = [
        (
            "DQ-C02 candidatures sans mission_key",
            """
            SELECT COUNT(*) AS n FROM fact_candidature fc
            LEFT JOIN dim_mission dm ON dm.mission_key = fc.mission_key
            WHERE dm.mission_key IS NULL
            """,
        ),
        (
            "DQ-V01 statuts candidature invalides",
            """
            SELECT COUNT(*) AS n FROM fact_candidature
            WHERE statut_candidature NOT IN ('ENCOURS','ACCEPTER','REFUSER')
            """,
        ),
        (
            "DQ-C03 utilisateurs sans dim",
            """
            SELECT COUNT(*) AS n FROM fact_cv f
            LEFT JOIN dim_user u ON u.user_key = f.user_key
            WHERE u.user_key IS NULL OR u.user_key = 0
            """,
        ),
    ]
    print("--- Contrôles qualité ---")
    for label, sql in checks:
        cur.execute(sql)
        n = _col(cur.fetchone(), "n")
        status = "OK" if n == 0 else f"ATTENTION ({n})"
        print(f"  {label}: {status}")


def _etl_log_finish(cur, run_id: int, status: str, rows: int | None = None, err: str | None = None) -> None:
    cur.execute(
        """
        UPDATE etl_run_log
        SET finished_at = %s, status = %s, rows_loaded = %s, error_message = %s
        WHERE run_id = %s
        """,
        (datetime.now(timezone.utc), status, rows, err, run_id),
    )


def main() -> None:
    print("Talend ETL (runtime) → findme_dw (schéma en étoile)", flush=True)
    print(f"  build ETL  : {ETL_BUILD}", flush=True)
    print(f"  schema DDL : {SCHEMA_SQL} (exists={Path(SCHEMA_SQL).is_file()})", flush=True)
    wait_for_mysql()
    root = connect()
    ensure_dw_schema(root)
    ensure_powerbi_readonly_grants(root)
    src = connect()
    dw = connect(DW)
    run_id = 0
    try:
        with dw.cursor() as cur, src.cursor() as s:
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            run_id = _etl_log_start(cur)
            ensure_unknown_user(cur)
            populate_dim_date(cur)
            user_map = load_dim_user(cur, s)
            load_dim_user_scd2(cur, s)
            mission_map = load_dim_mission(cur, s)
            load_dim_skill(cur, s)
            load_fact_notification(cur, s)
            load_fact_candidature(cur, s, mission_map)
            load_fact_favori(cur, s, mission_map)
            load_fact_cv(cur, s, user_map)
            load_fact_quiz(cur, s, user_map)
            load_fact_codingame(cur, s, user_map)
            cur.execute(
                """
                SELECT
                  (SELECT COUNT(*) FROM fact_candidature)
                + (SELECT COUNT(*) FROM fact_mission)
                + (SELECT COUNT(*) FROM fact_cv) AS total_rows
                """
            )
            total_rows = _col(cur.fetchone(), "total_rows")
            run_dq_checks(cur)
            _etl_log_finish(cur, run_id, "SUCCESS", total_rows)
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
        dw.commit()
        print("ETL terminé avec succès.")
    except Exception as e:
        dw.rollback()
        try:
            with dw.cursor() as cur:
                if run_id:
                    _etl_log_finish(cur, run_id, "FAILED", err=str(e)[:2000])
            dw.commit()
        except Exception:
            pass
        import traceback

        print(f"ERREUR ETL: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
    finally:
        root.close()
        src.close()
        dw.close()


if __name__ == "__main__":
    main()
