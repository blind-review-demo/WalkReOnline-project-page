const samplesRoot = document.querySelector("#samples");
const colorbarImage = document.querySelector("#colorbarImage");
const colorbarCaption = document.querySelector("#colorbarCaption");

function fmtScore(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function trackNode(track) {
  const item = document.createElement("div");
  item.className = "track";
  const status =
    typeof track.correct === "boolean"
      ? `<span class="track__status ${track.correct ? "is-correct" : "is-wrong"}">${
          track.correct ? "Correct (Status)" : "Wrong (Status)"
        }</span>`
      : "";
  const predictionClass = track.prediction_class
    ? `<span class="track__prediction">Category (Prediction): ${track.prediction_class}</span>`
    : "";
  const predictionStatus = (track.prediction_status || track.prediction)
    ? `<span class="track__prediction">Status (Prediction): ${track.prediction_status || track.prediction}</span>`
    : "";
  const scores =
    typeof track.cap_score === "number" || typeof track.saj_score === "number"
      ? `<span class="track__score">CLAP Score↑: ${fmtScore(track.cap_score)} | SAJ Score↑: ${fmtScore(track.saj_score)}</span>`
      : "";
  item.innerHTML = `
    <img class="spectrogram" src="${track.spectrogram}" alt="${track.label} spectrogram" loading="lazy" />
    <div class="track__head">
      <span class="track__label">${track.label}</span>
      ${status}
    </div>
    ${predictionClass}
    ${predictionStatus}
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
        <span class="pill">Category (Ground Truth): ${sample.class}</span>
        <span class="pill">Status (Ground Truth): ${sample.ground_truth}</span>
      </div>
    </header>
    <h3>References</h3>
  `;
  section.append(refGrid);
  section.insertAdjacentHTML("beforeend", "<h3>Methods</h3>");
  section.append(methodGrid);
  return section;
}

fetch("assets/data/demo-data.json")
  .then(response => response.json())
  .then(data => {
    colorbarImage.src = data.spectrogram.colorbar;
    colorbarCaption.textContent = `${data.spectrogram.db_min} to ${data.spectrogram.db_max} dBFS`;
    samplesRoot.replaceChildren(...data.samples.map(sampleNode));
  });
