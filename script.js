const samplesRoot = document.querySelector("#samples");
const colorbarImage = document.querySelector("#colorbarImage");
const colorbarCaption = document.querySelector("#colorbarCaption");
const attributionRows = document.querySelector("#attributionRows");
const evaluationTables = document.querySelector("#evaluationTables");
const dataUrl = "assets/data/project-data.json?v=20260616-overall-eval";

function fmtScore(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function fmtPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "N/A";
}

function fmtInt(value) {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "N/A";
}

function trackNode(track) {
  const item = document.createElement("div");
  item.className = "track";
  const status =
    typeof track.correct === "boolean"
      ? `<span class="track__status ${track.correct ? "is-correct" : "is-wrong"}">${
          track.correct ? "Correct" : "Wrong"
        }</span>`
      : "";
  const prediction = track.prediction
    ? `<span class="track__prediction">Prediction: ${track.prediction}</span>`
    : "";
  const scores =
    typeof track.cap_score === "number" || typeof track.saj_score === "number"
      ? `<span class="track__score">CLAP Score: ${fmtScore(track.cap_score)} | SAJ Score: ${fmtScore(track.saj_score)}</span>`
      : "";
  item.innerHTML = `
    <img class="spectrogram" src="${track.spectrogram}" alt="${track.label} spectrogram" loading="lazy" />
    <div class="track__head">
      <span class="track__label">${track.label}</span>
      ${status}
    </div>
    ${prediction}
    ${scores}
    <audio controls preload="none" src="${track.audio}"></audio>
  `;
  return item;
}

function sampleNode(sample, index) {
  const section = document.createElement("article");
  section.className = "sample";

  const refs = sample.reference_tracks.map(trackNode);
  const methods = sample.method_tracks.map(trackNode);

  const refGrid = document.createElement("div");
  refGrid.className = "tracks tracks--references";
  refGrid.replaceChildren(...refs);

  const methodGrid = document.createElement("div");
  methodGrid.className = "tracks tracks--methods";
  methodGrid.replaceChildren(...methods);

  section.innerHTML = `
    <header class="sample__head">
      <h2>${String(index + 1).padStart(2, "0")}. ${sample.class}</h2>
      <div class="sample__meta">
        <span class="pill">Robot: ${sample.robot}</span>
        <span class="pill">SNR: ${sample.snr_db} dB</span>
        <span class="pill">Ground Truth: ${sample.ground_truth || sample.class}</span>
      </div>
    </header>
    <h3>References</h3>
  `;
  section.append(refGrid);
  section.insertAdjacentHTML("beforeend", "<h3>Methods</h3>");
  section.append(methodGrid);
  return section;
}

function projectPageSectionNode(section) {
  const wrapper = document.createElement("section");
  wrapper.className = "project-page-section";
  if (section.title) {
    const title = document.createElement("h3");
    title.textContent = section.title;
    wrapper.append(title);
  }
  wrapper.append(...section.samples.map(sampleNode));
  return wrapper;
}

function demoGroupNode(title, sections) {
  const wrapper = document.createElement("section");
  wrapper.className = "demo-group";
  const heading = document.createElement("h2");
  heading.textContent = title;
  wrapper.append(heading, ...sections.map(projectPageSectionNode));
  return wrapper;
}

function demoSectionsNode(sections) {
  const separationTitles = new Set(["Speech Separation", "Music Separation"]);
  const separationSections = sections.filter(section => separationTitles.has(section.title));
  const classificationSections = sections.filter(section => !separationTitles.has(section.title));
  const groups = [];
  if (separationSections.length) {
    groups.push(demoGroupNode("Demo: Ego-Noise Separation", separationSections));
  }
  if (classificationSections.length) {
    groups.push(demoGroupNode("Demo: Anomalous Sound Classification After Ego-Noise Separation", classificationSections));
  }
  return groups;
}

function metricValueNode(metric) {
  if (typeof metric.value !== "number") {
    return `<span class="metric-value is-empty">N/A</span>`;
  }
  const value = fmtScore(metric.value);
  const content = metric.best ? `<strong>${value}</strong>` : value;
  return `<span class="metric-value"><span>${metric.label}:</span> ${content}</span>`;
}

function summaryTableNode(table) {
  const section = document.createElement("section");
  section.className = "summary-table";
  const metricNames = table.metrics.map(metric => metric.label).join(" / ");
  const rows = (table.rows || []).slice().sort((a, b) => {
    if (a.method === "no_preprocessing" && b.method !== "no_preprocessing") return -1;
    if (a.method !== "no_preprocessing" && b.method === "no_preprocessing") return 1;
    if (a.label === "Ours" && b.label !== "Ours") return 1;
    if (a.label !== "Ours" && b.label === "Ours") return -1;
    return 0;
  });
  const metricDescription =
    table.kind === "separation"
      ? `<p class="summary-table__description">
          CLAP Score is the cosine similarity between sounds embedded by a general-purpose audio encoder,
          indicating similarity between the target sounds. SAJ Score is the quality of noise reduction
          predicted by a model trained with human subjective evaluations.
        </p>`
      : "";
  section.innerHTML = `
    <h3>${table.title}</h3>
    ${metricDescription}
    <div class="summary-table__wrap">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            ${(table.columns || []).map(column => `<th>${column.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(row => `
              <tr>
                <th>${row.label}</th>
                ${row.cells
                  .map(cell => `<td>${cell.metrics.map(metricValueNode).join("")}</td>`)
                  .join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="summary-table__note">${table.note || `Values show mean ${metricNames} over samples in each robot-SNR condition.`}</p>
  `;
  return section;
}

function attributionNode(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.sample}</td>
    <td>${item.category}</td>
    <td>${item.dataset}</td>
    <td>${item.license}</td>
  `;
  return row;
}

fetch(dataUrl)
  .then(response => response.json())
  .then(data => {
    colorbarImage.src = data.spectrogram.colorbar;
    colorbarCaption.textContent = `${data.spectrogram.db_min} to ${data.spectrogram.db_max} dBFS`;
    const sections = data.sections || [{ title: "Audio Examples", samples: data.samples || [] }];
    evaluationTables.replaceChildren(...(data.summary_tables || []).map(summaryTableNode));
    samplesRoot.replaceChildren(...demoSectionsNode(sections));
    attributionRows.replaceChildren(...(data.attributions || []).map(attributionNode));
  });
