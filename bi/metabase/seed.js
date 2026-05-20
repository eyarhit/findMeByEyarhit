const axios = require('axios');

const METABASE_URL = (process.env.METABASE_URL || 'http://metabase:3000').replace(/\/$/, '');
const MYSQL_HOST = process.env.MYSQL_HOST || 'mysql';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'findme_bi';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'findme_bi_readonly';

const METABASE_SETUP_EMAIL = process.env.METABASE_SETUP_EMAIL || 'bi-admin@findme.local';
const METABASE_SETUP_PASSWORD = process.env.METABASE_SETUP_PASSWORD || 'FindMe_BI_Auto_2026!xQ7vM2';
const METABASE_SITE_NAME = process.env.METABASE_SITE_NAME || 'Find-Me BI';
const METABASE_ADMIN_FIRST_NAME = process.env.METABASE_ADMIN_FIRST_NAME || 'FindMe';
const METABASE_ADMIN_LAST_NAME = process.env.METABASE_ADMIN_LAST_NAME || 'BI';

const COLLECTION_NAME = 'Find-Me BI';
const DASHBOARD_NAME = 'Find-Me — BI complet';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: METABASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const dbDefinitions = [
  { key: 'user_bd', name: 'Find-Me Users', dbname: 'user_bd' },
  { key: 'cv_bd', name: 'Find-Me CVs', dbname: 'cv_bd' },
  { key: 'mission_bd', name: 'Find-Me Missions', dbname: 'mission_bd' },
  { key: 'quiz_bd', name: 'Find-Me Quiz', dbname: 'quiz_bd' },
  { key: 'codingame_bd', name: 'Find-Me CodingGame', dbname: 'codingame_bd' },
];

const cards = [
  {
    key: 'card_1',
    name: 'Utilisateurs par role',
    dbKey: 'user_bd',
    display: 'pie',
    sql: `
SELECT
  COALESCE(r.role, 'SANS_ROLE') AS role,
  COUNT(*) AS total
FROM users u
LEFT JOIN roles r ON r.role_id = u.role_id
GROUP BY COALESCE(r.role, 'SANS_ROLE')
ORDER BY total DESC;
`,
  },
  {
    key: 'card_2',
    name: 'Inscriptions par mois',
    dbKey: 'user_bd',
    display: 'line',
    sql: `
SELECT
  DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m') AS mois,
  COUNT(*) AS inscriptions
FROM users u
GROUP BY DATE_FORMAT(COALESCE(u.date_of_birth, CURRENT_DATE), '%Y-%m')
ORDER BY mois ASC;
`,
  },
  {
    key: 'card_3',
    name: 'Top 10 competences CV',
    dbKey: 'cv_bd',
    display: 'bar',
    sql: `
SELECT
  COALESCE(
    NULLIF(TRIM(c.language_programmation), ''),
    NULLIF(TRIM(c.framework), ''),
    NULLIF(TRIM(c.bibliotheque), ''),
    NULLIF(TRIM(c.api), ''),
    NULLIF(TRIM(c.db), ''),
    NULLIF(TRIM(c.system_exploitation), ''),
    NULLIF(TRIM(c.conception), ''),
    NULLIF(TRIM(c.methodologie), ''),
    NULLIF(TRIM(c.design_pattern), ''),
    NULLIF(TRIM(c.architechture), ''),
    NULLIF(TRIM(c.outils), ''),
    CONCAT('COMP_', c.id_competence)
  ) AS skill_name,
  COUNT(*) AS frequency
FROM cv_competence cc
LEFT JOIN competence c ON c.id_competence = cc.competence_id
GROUP BY skill_name
ORDER BY frequency DESC
LIMIT 10;
`,
  },
  {
    key: 'card_4',
    name: 'Missions par statut',
    dbKey: 'mission_bd',
    display: 'pie',
    sql: `
SELECT
  COALESCE(m.status_mission, 'INCONNU') AS statut,
  COUNT(*) AS total
FROM mission m
GROUP BY COALESCE(m.status_mission, 'INCONNU')
ORDER BY total DESC;
`,
  },
  {
    key: 'card_5',
    name: 'Candidatures par mission (Top 10)',
    dbKey: 'mission_bd',
    display: 'bar',
    sql: `
SELECT
  COALESCE(dm.mission_name, CONCAT('Mission #', m.id_mission)) AS titre,
  COUNT(c.id_candidature) AS nb_candidatures
FROM mission m
LEFT JOIN candidature c ON c.mission_id = m.id_mission
LEFT JOIN descrip_mission dm ON dm.id_mission = m.id_mission
GROUP BY m.id_mission, dm.mission_name
ORDER BY nb_candidatures DESC
LIMIT 10;
`,
  },
  {
    key: 'card_6',
    name: 'Taux de conversion candidatures',
    dbKey: 'mission_bd',
    display: 'scalar',
    sql: `
SELECT
  COUNT(*) AS total_candidatures,
  SUM(CASE WHEN COALESCE(statut_candidature, 'ENCOURS') = 'ACCEPTER' THEN 1 ELSE 0 END) AS acceptees,
  ROUND(
    100.0 * SUM(CASE WHEN COALESCE(statut_candidature, 'ENCOURS') = 'ACCEPTER' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS taux_conversion
FROM candidature;
`,
  },
  {
    key: 'card_7',
    name: 'Evolution candidatures par mois',
    dbKey: 'mission_bd',
    display: 'line',
    sql: `
SELECT
  DATE_FORMAT(COALESCE(date_postulation, CURRENT_DATE), '%Y-%m') AS mois,
  COUNT(*) AS total
FROM candidature
GROUP BY DATE_FORMAT(COALESCE(date_postulation, CURRENT_DATE), '%Y-%m')
ORDER BY mois ASC;
`,
  },
  {
    key: 'card_8',
    name: 'Score moyen par quiz',
    dbKey: 'quiz_bd',
    display: 'bar',
    sql: `
SELECT
  'Quiz global' AS titre,
  ROUND(AVG(COALESCE(uqr.score, 0)), 2) AS score_moyen,
  COUNT(uqr.id) AS nb_passages
FROM user_quiz_results uqr;
`,
  },
  {
    key: 'card_9',
    name: 'Taux de reussite quiz',
    dbKey: 'quiz_bd',
    display: 'table',
    sql: `
SELECT
  'Quiz global' AS titre,
  COUNT(uqr.id) AS total_passages,
  SUM(CASE WHEN COALESCE(uqr.passed, 0) = 1 THEN 1 ELSE 0 END) AS reussis,
  ROUND(
    100.0 * SUM(CASE WHEN COALESCE(uqr.passed, 0) = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(uqr.id), 0),
    2
  ) AS taux_reussite
FROM user_quiz_results uqr;
`,
  },
  {
    key: 'card_10',
    name: 'Score moyen CodingGame par defi',
    dbKey: 'codingame_bd',
    display: 'bar',
    sql: `
SELECT
  COALESCE(f.name, CONCAT('Framework #', f.id)) AS title,
  ROUND(AVG(COALESCE(er.score, 0)), 2) AS score_moyen,
  COUNT(er.id) AS nb_tentatives
FROM framework f
LEFT JOIN evaluation_result er ON er.framework_id = f.id
GROUP BY f.id, f.name
ORDER BY score_moyen DESC;
`,
  },
  {
    key: 'card_11',
    name: 'Taux de completion defis CodingGame',
    dbKey: 'codingame_bd',
    display: 'table',
    sql: `
SELECT
  COALESCE(f.name, CONCAT('Framework #', f.id)) AS title,
  COUNT(es.id) AS tentatives,
  SUM(CASE WHEN es.end_time IS NOT NULL THEN 1 ELSE 0 END) AS completes,
  ROUND(
    100.0 * SUM(CASE WHEN es.end_time IS NOT NULL THEN 1 ELSE 0 END) / NULLIF(COUNT(es.id), 0),
    2
  ) AS taux_completion
FROM framework f
LEFT JOIN evaluation_result er ON er.framework_id = f.id
LEFT JOIN evaluation_session es ON es.id = er.session_id
GROUP BY f.id, f.name;
`,
  },
  {
    key: 'card_12',
    name: 'Vue globale KPIs',
    dbKey: 'user_bd',
    display: 'scalar',
    sql: `
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON r.role_id = u.role_id WHERE COALESCE(r.role, '') = 'CANDIDAT') AS candidats,
  (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON r.role_id = u.role_id WHERE COALESCE(r.role, '') IN ('ESN_ADMIN', 'ESN_COMMARCIAL', 'CHARGEDERECRUTEMENT', 'INTERCONTRAT')) AS recruteurs;
`,
  },
];

function logStep(icon, message) {
  console.log(`${icon} ${message}`);
}

function getErrorMessage(error) {
  if (error.response) {
    const body = typeof error.response.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response.data);
    return `HTTP ${error.response.status} - ${body}`;
  }
  return error.message || String(error);
}

async function waitForHealth() {
  logStep('⏳', 'Attente de Metabase (/api/health)...');
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const res = await api.get('/api/health');
      if (res.status === 200 && res.data && res.data.status === 'ok') {
        logStep('✅', 'Metabase est disponible.');
        return;
      }
    } catch (error) {
      logStep('🔄', `Metabase pas encore pret: ${getErrorMessage(error)}`);
    }
    await wait(5000);
  }
  throw new Error('Timeout: Metabase indisponible apres 5 minutes.');
}

async function getSessionProperties() {
  const res = await api.get('/api/session/properties');
  return res.data || {};
}

async function loginAndGetSessionId(email, password) {
  const res = await api.post('/api/session', {
    username: email,
    password,
  });
  return res.data?.id;
}

function sessionHeaders(sessionId) {
  return { 'X-Metabase-Session': sessionId };
}

async function findCollectionId(sessionId, name) {
  const res = await api.get('/api/collection', { headers: sessionHeaders(sessionId) });
  const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
  const match = list.find((c) => c.name === name);
  return match ? match.id : null;
}

async function ensureSetupAndSessionId() {
  const props = await getSessionProperties();
  const hasSetup = props['has-user-setup'] || props.has_user_setup || props['has-users-setup'];
  const setupToken = props['setup-token'] || props.setup_token;

  if (hasSetup) {
    logStep('⏳', 'Instance deja initialisee, connexion admin...');
    const sessionId = await loginAndGetSessionId(METABASE_SETUP_EMAIL, METABASE_SETUP_PASSWORD);
    if (!sessionId) {
      throw new Error('Session admin introuvable apres login.');
    }
    logStep('✅', 'Connexion admin OK.');
    return sessionId;
  }

  if (!setupToken) {
    throw new Error('setup-token introuvable sur une instance non initialisee.');
  }

  logStep('⏳', 'Initialisation Metabase via /api/setup...');
  await api.post('/api/setup', {
    token: setupToken,
    user: {
      first_name: METABASE_ADMIN_FIRST_NAME,
      last_name: METABASE_ADMIN_LAST_NAME,
      email: METABASE_SETUP_EMAIL,
      password: METABASE_SETUP_PASSWORD,
    },
    prefs: {
      site_name: METABASE_SITE_NAME,
      allow_tracking: false,
    },
  });
  logStep('✅', 'Initialisation terminee.');

  const sessionId = await loginAndGetSessionId(METABASE_SETUP_EMAIL, METABASE_SETUP_PASSWORD);
  if (!sessionId) {
    throw new Error('Session admin introuvable apres setup.');
  }
  logStep('✅', 'Connexion admin post-setup OK.');
  return sessionId;
}

async function createDatabase(sessionId, dbDef) {
  const payload = {
    engine: 'mysql',
    name: dbDef.name,
    details: {
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      dbname: dbDef.dbname,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      ssl: false,
      'tunnel-enabled': false,
      'additional-options': 'allowPublicKeyRetrieval=true',
    },
    is_full_sync: false,
    is_on_demand: false,
  };
  const res = await api.post('/api/database', payload, { headers: sessionHeaders(sessionId) });
  return res.data?.id;
}

async function waitForDatabaseSync(sessionId, databaseId) {
  const deadline = Date.now() + 3 * 60 * 1000;
  logStep('⏳', `Synchronisation DB ${databaseId} en cours...`);
  while (Date.now() < deadline) {
    const res = await api.get(`/api/database/${databaseId}`, { headers: sessionHeaders(sessionId) });
    const status = res.data?.initial_sync_status || res.data?.sync?.initial_sync_status || res.data?.sync_status;
    if (status === 'complete') {
      logStep('✅', `DB ${databaseId} synchronisee.`);
      return;
    }
    logStep('🔄', `DB ${databaseId} statut: ${status || 'unknown'}...`);
    await wait(5000);
  }
  throw new Error(`Timeout sync DB ${databaseId} (>3 min).`);
}

async function createCollection(sessionId, name) {
  const res = await api.post(
    '/api/collection',
    { name, color: '#5A3FC9' },
    { headers: sessionHeaders(sessionId) }
  );
  return res.data?.id;
}

async function createCard(sessionId, collectionId, databaseId, cardDef) {
  const payload = {
    name: cardDef.name,
    description: 'Question generee automatiquement pour le pilotage BI Find-Me.',
    collection_id: collectionId,
    display: cardDef.display,
    dataset_query: {
      type: 'native',
      database: databaseId,
      native: {
        query: cardDef.sql.trim(),
        'template-tags': {},
      },
    },
    visualization_settings: {},
  };
  const res = await api.post('/api/card', payload, { headers: sessionHeaders(sessionId) });
  return res.data?.id;
}

async function createDashboard(sessionId, collectionId) {
  const res = await api.post(
    '/api/dashboard',
    {
      name: DASHBOARD_NAME,
      description: 'Dashboard BI global Find-Me (users, CV, missions, quiz, codingame).',
      collection_id: collectionId,
      parameters: [],
    },
    { headers: sessionHeaders(sessionId) }
  );
  return res.data?.id;
}

async function addCardToDashboard(sessionId, dashboardId, cardId, row, col, sizeX, sizeY) {
  await api.post(
    `/api/dashboard/${dashboardId}/cards`,
    {
      cardId,
      row,
      col,
      sizeX,
      sizeY,
    },
    { headers: sessionHeaders(sessionId) }
  );
}

function getCardLayout(cardKey) {
  const fullWidthRows = {
    card_6: { row: 8, col: 0, sizeX: 12, sizeY: 3 },
    card_12: { row: 20, col: 0, sizeX: 12, sizeY: 3 },
  };

  if (fullWidthRows[cardKey]) {
    return fullWidthRows[cardKey];
  }

  const chartOrder = [
    'card_1', 'card_2',
    'card_3', 'card_4',
    'card_5', 'card_7',
    'card_8', 'card_9',
    'card_10', 'card_11',
  ];
  const idx = chartOrder.indexOf(cardKey);
  const pairRow = Math.floor(idx / 2);
  return {
    row: pairRow * 4,
    col: idx % 2 === 0 ? 0 : 6,
    sizeX: 6,
    sizeY: 4,
  };
}

async function run() {
  await waitForHealth();

  const sessionId = await ensureSetupAndSessionId();

  const existingCollectionId = await findCollectionId(sessionId, COLLECTION_NAME);
  if (existingCollectionId) {
    logStep('✅', `Collection "${COLLECTION_NAME}" detectee -> seed deja execute. Sortie 0.`);
    return;
  }

  logStep('⏳', 'Creation des connexions MySQL...');
  const dbIdByKey = {};
  for (const db of dbDefinitions) {
    const dbId = await createDatabase(sessionId, db);
    if (!dbId) {
      throw new Error(`Impossible de creer la DB Metabase: ${db.name}`);
    }
    dbIdByKey[db.key] = dbId;
    logStep('✅', `Connexion creee: ${db.name} (id=${dbId})`);
    await waitForDatabaseSync(sessionId, dbId);
  }

  const collectionId = await createCollection(sessionId, COLLECTION_NAME);
  logStep('✅', `Collection creee: ${COLLECTION_NAME} (id=${collectionId})`);

  logStep('⏳', 'Creation des 12 questions SQL...');
  const cardIdByKey = {};
  for (const card of cards) {
    const cardId = await createCard(sessionId, collectionId, dbIdByKey[card.dbKey], card);
    if (!cardId) {
      throw new Error(`Impossible de creer la carte: ${card.name}`);
    }
    cardIdByKey[card.key] = cardId;
    logStep('✅', `Carte creee: ${card.name} (id=${cardId})`);
  }

  const dashboardId = await createDashboard(sessionId, collectionId);
  if (!dashboardId) {
    throw new Error('Impossible de creer le dashboard.');
  }
  logStep('✅', `Dashboard cree: ${DASHBOARD_NAME} (id=${dashboardId})`);

  logStep('⏳', 'Ajout des cartes au dashboard...');
  for (const card of cards) {
    const layout = getCardLayout(card.key);
    await addCardToDashboard(
      sessionId,
      dashboardId,
      cardIdByKey[card.key],
      layout.row,
      layout.col,
      layout.sizeX,
      layout.sizeY
    );
    logStep('✅', `Carte ajoutee au dashboard: ${card.name}`);
  }

  logStep('✅', 'Seed Metabase termine avec succes.');
}

(async () => {
  try {
    await run();
    process.exit(0);
  } catch (error) {
    logStep('❌', `Echec du seed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
})();
