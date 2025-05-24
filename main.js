let db;
let uid,
  found = {},
  dailyLog = [];

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("btnGoogleLogin");
  const logoutBtn = document.getElementById("btnGoogleLogout");
  const packsInput = document.getElementById("packs");
  const privateEl = document.querySelector(".private-content");

  if (!window.firebase) {
    console.error("Firebase non caricato");
    return;
  }
  if (!firebase.apps.length) {
    // Configurazione Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyC0mhA5PSRQSirk4vuGKUzNs4L0TK7EGNw",
      authDomain: "tcgp-tracker-ab396.firebaseapp.com",
      projectId: "tcgp-tracker-ab396",
      storageBucket: "tcgp-tracker-ab396.appspot.com",
      messagingSenderId: "967621803272",
      appId: "1:967621803272:web:ef81deef2ad0a0d56e40bd",
    };
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore();

  // Monitora lo stato di autenticazione
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      uid = user.uid;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      privateEl.style.display = "block";

      // Carica dati e avvia UI
      db.collection("users")
        .doc(uid)
        .get()
        .then((doc) => {
          const data = doc.data() || {};
          found = data.found || {};
          dailyLog = data.dailyLog || [];
        })
        .catch((err) => console.error("❌ Errore lettura Firestore:", err))
        .finally(() => initApp());
    } else {
      // Utente non autenticato
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      privateEl.style.display = "none";
    }
  });

  // Login con Google (popup)
  loginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .catch((err) => console.error("❌ Google SignIn error:", err));
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .catch((err) => console.error("❌ Logout error:", err));
  });

  // Cambia i packs
  packsInput.addEventListener("change", () => updateUI());
});

function initApp() {
  renderList();
  initCharts();
  updateUI();
}
function saveStateToDB() {
  if (!uid || !db) return;
  db.collection("users")
    .doc(uid)
    .set({ found, dailyLog })
    .catch((err) => console.error("❌ Errore salvataggio Firestore:", err));
}

const cards = [
  ["Solgaleo", "Trevenant", 2],
  ["Solgaleo", "Tapu Bulu", 3],
  ["Solgaleo", "Talonflame", 3],
  ["Solgaleo", "Incineroar ex", 4],
  ["Solgaleo", "Sandlash", 2],
  ["Solgaleo", "Cloyster", 2],
  ["Solgaleo", "Crabominable ex", 4],
  ["Solgaleo", "Oricorio", 3],
  ["Solgaleo", "Tapu Koko", 3],
  ["Solgaleo", "Sandygast", 1],
  ["Solgaleo", "Palossand", 3],
  ["Solgaleo", "Crabrawler", 1],
  ["Solgaleo", "Klefki", 3],
  ["Solgaleo", "Magearna", 3],
  ["Solgaleo", "Drampa", 3],
  ["Solgaleo", "Hawlucha", 2],
  ["Solgaleo", "Komala", 2],
  ["Lunala", "Exeggcute", 1],
  ["Lunala", "Decidueye ex", 4],
  ["Lunala", "Morelull", 1],
  ["Lunala", "Litten", 1],
  ["Lunala", "Sandlash", 2],
  ["Lunala", "Ninetales", 3],
  ["Lunala", "Popplio", 1],
  ["Lunala", "Brionne", 2],
  ["Lunala", "Primarina", 3],
  ["Lunala", "Oricorio-N", 2],
  ["Lunala", "Tapu Lele", 3],
  ["Lunala", "Necrozma", 3],
  ["Lunala", "Conkeldurr", 3],
  ["Lunala", "Lycanroc", 3],
  ["Lunala", "Raticate", 2],
  ["Lunala", "Kommo-o", 3],
  ["Lunala", "Oranguru", 3],
  ["Lunala", "Rete da pesca", 2],
];
const pR = { 1: 0.06664397, 2: 0.04365052, 3: 0.00917221, 4: 0.01661559 };

let percentileChart, dailyTrendChart, rarityChart;

function monteCarlo(sol, lun, packs, sims = 500) {
  const rar = [1, 2, 3, 4],
    pat = ["L", "L", "S"];
  function run() {
    let s = sol,
      l = lun,
      day = 0,
      idx = 0;
    while (s > 0 || l > 0) {
      day++;
      for (let i = 0; i < packs; i++) {
        const set = l > 0 ? pat[idx++ % 3] : "S";
        const r = rar[Math.floor(Math.random() * 4)];
        if (Math.random() < pR[r]) {
          if (set === "L" && l > 0) l--;
          else if (set === "S" && s > 0) s--;
        }
      }
    }
    return day;
  }
  const arr = Array.from({ length: sims }, run).sort((a, b) => a - b);
  return [0.5, 0.75, 0.9, 0.99].map((p) => arr[Math.floor(arr.length * p) - 1]);
}

function logDailyProgress(count) {
  const today = new Date().toISOString().slice(0, 10);
  if (!dailyLog.length || dailyLog[dailyLog.length - 1].date !== today) {
    dailyLog.push({ date: today, count });
  }
}

function renderList() {
  const container = document.getElementById("list");
  let html = "";
  ["Lunala", "Solgaleo"].forEach((set) => {
    html += `<div class="set">${set}</div>`;
    cards
      .filter((c) => c[0] === set)
      .forEach((c, i) => {
        const id = `${set}_${i}`;
        const chk = found[id] ? "checked" : "";
        html += `<div class="card">
                     <input type="checkbox" id="${id}" ${chk}>
                     <label for="${id}">${c[1]} (R${c[2]})</label>
                   </div>`;
      });
  });
  container.innerHTML = html;
  container.querySelectorAll(".card input").forEach((cb) => {
    cb.onchange = () => {
      found[cb.id] = cb.checked;
      saveStateToDB();
      updateUI();
    };
  });
}

function initCharts() {
  const ctx1 = document.getElementById("percentileChart").getContext("2d");
  percentileChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["50%", "75%", "90%", "99%"],
      datasets: [
        {
          label: "Giorni stimati",
          data: [0, 0, 0, 0],
          backgroundColor: "rgba(25,118,210,0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    },
  });
  const ctx2 = document.getElementById("dailyTrendChart").getContext("2d");
  dailyTrendChart = new Chart(ctx2, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Carte trovate",
          data: [],
          fill: false,
          borderColor: "var(–primary)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { x: { display: true }, y: { beginAtZero: true } },
    },
  });
  const ctx3 = document.getElementById("rarityChart").getContext("2d");
  rarityChart = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: ["R1", "R2", "R3", "R4"],
      datasets: [
        {
          label: "Mancanti",
          data: [0, 0, 0, 0],
          backgroundColor: ["#aed581", "#81c784", "#4db6ac", "#4caf50"],
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    },
  });
}

function updateUI() {
  const packs = +document.getElementById("packs").value || 3;
  const total = cards.length;
  const foundCount = Object.values(found).filter((v) => v).length;
  const solMiss = cards.filter(
    (c, i) =>
      c[0] === "Solgaleo" &&
      !found[`${c[0]}_${cards.filter((cc) => cc[0] === c[0]).indexOf(c)}`]
  ).length;
  const lunMiss = cards.filter(
    (c, i) =>
      c[0] === "Lunala" &&
      !found[`${c[0]}_${cards.filter((cc) => cc[0] === c[0]).indexOf(c)}`]
  ).length;

  document.getElementById(
    "counts"
  ).textContent = `Trovate: ${foundCount}/${total} · Mancanti S: ${solMiss} · L: ${lunMiss}`;
  document.getElementById("pattern").textContent =
    lunMiss > 0 ? "Pattern: 2L + 1S" : "Pattern: solo Solgaleo";
  document.getElementById("progressBar").style.width =
    (foundCount / total) * 100 + "%";

  logDailyProgress(foundCount);

  const [m50, m75, m90, m99] = monteCarlo(solMiss, lunMiss, packs);
  percentileChart.data.datasets[0].data = [m50, m75, m90, m99];
  percentileChart.update();

  dailyTrendChart.data.labels = dailyLog.map((e) => e.date);
  dailyTrendChart.data.datasets[0].data = dailyLog.map((e) => e.count);
  dailyTrendChart.update();

  const counts = [0, 0, 0, 0];
  cards.forEach((c, i) => {
    const id = `${c[0]}_${cards.filter((cc) => cc[0] === c[0]).indexOf(c)}`;
    if (!found[id]) counts[c[2] - 1]++;
  });
  rarityChart.data.datasets[0].data = counts;
  rarityChart.update();
}
