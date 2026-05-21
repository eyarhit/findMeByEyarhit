(function () {
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "talend";

  const tabs = document.querySelectorAll(".tab");
  const panels = {
    talend: document.getElementById("panel-talend"),
    powerbi: document.getElementById("panel-powerbi"),
    dw: document.getElementById("panel-dw"),
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
  let chart;

  async function api(path, opts) {
    const r = await fetch(path, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function refreshHealth() {
    try {
      const h = await api("/api/health");
      if (h.etlRunning) {
        statusEl.textContent = "ETL en cours…";
        statusEl.className = "status-pill warn";
        btnRun.disabled = true;
      } else if (h.dw) {
        statusEl.textContent = "findme_dw prêt";
        statusEl.className = "status-pill ok";
        btnRun.disabled = false;
      } else if (h.mysql) {
        statusEl.textContent = "MySQL OK — lancer ETL";
        statusEl.className = "status-pill warn";
        btnRun.disabled = false;
      } else {
        statusEl.textContent = "MySQL indisponible";
        statusEl.className = "status-pill err";
      }
      return h;
    } catch (e) {
      statusEl.textContent = "Hub BI injoignable";
      statusEl.className = "status-pill err";
    }
  }

  async function refreshLog() {
    try {
      const d = await api("/api/etl/log?tail=500");
      logEl.textContent = d.lines.length ? d.lines.join("\n") : "(aucun log — lancer l’ETL)";
      logEl.scrollTop = logEl.scrollHeight;
    } catch {
      logEl.textContent = "Impossible de charger le journal.";
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

  async function loadKpis() {
    const kpiRow = document.getElementById("kpiRow");
    try {
      const k = await api("/api/kpis/executive");
      const labels = {
        total_utilisateurs: "Utilisateurs",
        total_missions: "Missions",
        total_candidatures: "Candidatures",
        total_cv: "CV",
      };
      kpiRow.innerHTML = Object.entries(labels)
        .map(
          ([key, label]) =>
            `<div class="kpi"><strong>${k[key] ?? 0}</strong><span>${label}</span></div>`
        )
        .join("");
      const series = await api("/api/kpis/candidatures_par_mois");
      const ctx = document.getElementById("chartCandidatures");
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: series.map((s) => s.label),
          datasets: [
            {
              label: "Candidatures / mois",
              data: series.map((s) => s.value),
              borderColor: "#38bdf8",
              tension: 0.25,
            },
          ],
        },
        options: {
          plugins: { legend: { labels: { color: "#94a3b8" } } },
          scales: {
            x: { ticks: { color: "#94a3b8" } },
            y: { ticks: { color: "#94a3b8" } },
          },
        },
      });
    } catch {
      kpiRow.innerHTML = "<p class='hint'>Lancez l’ETL Talend pour alimenter findme_dw.</p>";
    }
  }

  async function loadConnection() {
    const c = await api("/api/powerbi/connection");
    document.getElementById("connDl").innerHTML = `
      <dt>Serveur</dt><dd>${c.server}:${c.port}</dd>
      <dt>Base</dt><dd>${c.database}</dd>
      <dt>Utilisateur</dt><dd>${c.user}</dd>
      <dt>Mot de passe</dt><dd>${c.password}</dd>`;
    document.getElementById("btnCopyConn").onclick = () => {
      navigator.clipboard.writeText(c.connectionString);
      alert("Chaîne copiée — collez-la dans Power BI (MySQL).");
    };
  }

  async function loadReports() {
    const ul = document.getElementById("reportList");
    const r = await api("/api/powerbi/reports");
    if (!r.reports.length) {
      ul.innerHTML =
        "<li class='hint'>Aucun .pbix dans <code>bi/powerbi/reports/</code> — créez-les dans Power BI Desktop ou utilisez l’aperçu ci-contre.</li>";
      return;
    }
    ul.innerHTML = r.reports
      .map((x) => `<li><a href="${x.url}" download>${x.name}</a></li>`)
      .join("");
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

  async function tick() {
    const h = await refreshHealth();
    await refreshLog();
    if (h && h.dw) {
      loadKpis();
      loadStats();
    }
    if (h && h.etlRunning) {
      setTimeout(tick, 2000);
    }
  }

  loadConnection();
  loadReports();
  tick();
  setInterval(refreshHealth, 8000);
  setInterval(refreshLog, 4000);
})();
