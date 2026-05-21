#!/usr/bin/env python3
"""
ETL Find-Me : charge l'entrepôt findme_dw (schéma en étoile) depuis les bases OLTP.
Exécution : docker compose run --rm bi-etl  (ou service bi-etl au démarrage)
"""
from __future__ import annotations

import os
import sys
from datetime import date, timedelta
from pathlib import Path

import pymysql

MYSQL_HOST = os.environ.get("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_ETL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_ETL_PASSWORD", "root")

DW = "findme_dw"
UNKNOWN_DATE_KEY = 19000101
SCHEMA_SQL = os.environ.get("DW_SCHEMA_SQL", "/ddl/schema.sql")


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
    if cur.fetchone()["c"] > 0:
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


def load_dim_user(cur, src) -> dict[int, int]:
    """Retourne mapping user_id -> user_key."""
    cur.execute("DELETE FROM fact_user")
    cur.execute("DELETE FROM dim_user WHERE user_key > 0")
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
    src.execute(
        """
        SELECT es.user_id, es.start_time, es.total_score,
               COALESCE(f.name, 'Sans framework') AS framework_name,
               er.score
        FROM codingame_bd.evaluation_session es
        LEFT JOIN codingame_bd.evaluation_result er ON er.session_id = es.id
        LEFT JOIN codingame_bd.framework f ON f.id = er.framework_id
        """
    )
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


def ensure_dw_schema(conn) -> None:
    """Crée findme_dw si le volume MySQL existait avant l'ajout du script init."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS c FROM information_schema.tables
            WHERE table_schema = %s AND table_name = 'dim_date'
            """,
            (DW,),
        )
        if cur.fetchone()["c"] > 0:
            return
    path = Path(SCHEMA_SQL)
    if not path.is_file():
        print(f"ATTENTION: schéma DW absent et {path} introuvable", file=sys.stderr)
        return
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        for chunk in sql.split(";"):
            stmt = chunk.strip()
            if stmt and not stmt.startswith("--"):
                cur.execute(stmt)
    conn.commit()
    print(f"Schéma findme_dw appliqué depuis {path}")


def main() -> None:
    print("ETL Find-Me → findme_dw (schéma en étoile)")
    root = connect()
    ensure_dw_schema(root)
    src = connect()
    dw = connect(DW)
    try:
        with dw.cursor() as cur, src.cursor() as s:
            ensure_unknown_user(cur)
            populate_dim_date(cur)
            user_map = load_dim_user(cur, s)
            mission_map = load_dim_mission(cur, s)
            load_dim_skill(cur, s)
            load_fact_notification(cur, s)
            load_fact_candidature(cur, s, mission_map)
            load_fact_favori(cur, s, mission_map)
            load_fact_cv(cur, s, user_map)
            load_fact_quiz(cur, s, user_map)
            load_fact_codingame(cur, s, user_map)
        dw.commit()
        print("ETL terminé avec succès.")
    except Exception as e:
        dw.rollback()
        print(f"ERREUR ETL: {e}", file=sys.stderr)
        raise
    finally:
        root.close()
        src.close()
        dw.close()


if __name__ == "__main__":
    main()
