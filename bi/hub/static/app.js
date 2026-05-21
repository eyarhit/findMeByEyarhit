(function () {
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "talend";

  const tabs = document.querySelectorAll(".tab");
  const panels = {
    talend: document.getElementById("panel-talend"),
    powerbi: document.getElementById("panel-powerbi"),
    etl: document.getElementById("panel-etl"),
  };

  let stack = {
    talendStudioUrl: "http://localhost:6080",
    powerBiWebUrl: "http://localhost:8077/reports",
  };

  function showTab(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle("active", k === name));
    history.replaceState(null, "", `?tab=${name}`);
  }

  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  showTab(initialTab);

  const statusEl = document.getElementById("globalStatus");
  const logEl = document.getElementById("etlLog");
  const btnRun = document.getElementById("btnRunEtl");
  const btnRefresh = document.getElementById("btnRefreshLog");

  async function api(path, opts) {
    const r = await fetch(path, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  function applyStack(cfg) {
    stack = { ...stack, ...cfg };
    const talend = stack.talendStudioUrl || stack.talendUrl;
    const pbi = stack.powerBiWebUrl || stack.powerBiUrl;
    document.getElementById("iframeTalend").src = talend;
    document.getElementById("iframePowerBi").src = pbi;
    document.getElementById("linkTalend").href = talend;
    document.getElementById("linkPowerBi").href = pbi;
  }

  async function refreshHealth() {
    try {
      const h = await api("/api/health");
      if (h.etlRunning) {
        statusEl.textContent = "ETL en cours…";
        statusEl.className = "status-pill warn";
        btnRun.disabled = true;
      } else if (h.dw) {
        statusEl.textContent = "BI opérationnel (findme_dw)";
        statusEl.className = "status-pill ok";
        btnRun.disabled = false;
      } else {
        statusEl.textContent = "Lancer l’ETL";
        statusEl.className = "status-pill warn";
        btnRun.disabled = false;
      }
    } catch {
      statusEl.textContent = "Services BI indisponibles";
      statusEl.className = "status-pill err";
    }
  }

  async function refreshLog() {
    try {
      const d = await api("/api/etl/log?tail=500");
      logEl.textContent = d.lines.length ? d.lines.join("\n") : "(aucun log)";
      logEl.scrollTop = logEl.scrollHeight;
    } catch {
      logEl.textContent = "Journal indisponible.";
    }
  }

  async function loadStats() {
    const body = document.getElementById("statsBody");
    try {
      const s = await api("/api/dw/stats");
      body.innerHTML = Object.entries(s.tables)
        .map(([t, n]) => `<tr><td>${t}</td><td>${n}</td></tr>`)
        .join("");
    } catch {
      body.innerHTML = "<tr><td colspan='2'>Entrepôt non chargé</td></tr>";
    }
  }

  btnRun.addEventListener("click", async () => {
    btnRun.disabled = true;
    try {
      await api("/api/etl/run", { method: "POST" });
      logEl.textContent = "ETL démarré…";
    } catch (e) {
      alert(e.message || "ETL déjà en cours");
      btnRun.disabled = false;
    }
  });
  btnRefresh.addEventListener("click", refreshLog);

  api("/api/bi/stack")
    .then(applyStack)
    .catch(() => applyStack({}));

  refreshHealth();
  refreshLog();
  loadStats();
  setInterval(refreshHealth, 8000);
  setInterval(refreshLog, 4000);
})();
