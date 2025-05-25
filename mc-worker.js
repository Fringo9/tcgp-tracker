/* mc-worker.js – simulazione Monte-Carlo con pattern dinamico */

const pR = { 1: 0.06664397, 2: 0.04365052, 3: 0.00917221, 4: 0.01661559 };
const rarities = [1, 2, 3, 4];

self.onmessage = (e) => {
  const { s: S0, l: L0, pattern, runs } = e.data;
  const packsPerDay = pattern.length;
  const baseL = pattern.filter((x) => x === "L").length;
  const baseS = packsPerDay - baseL;

  // helper per rifare il pattern in funzione delle carte rimaste
  function makePattern(lRem, sRem) {
    if (!lRem) return Array(packsPerDay).fill("S");
    if (!sRem) return Array(packsPerDay).fill("L");

    const ratioL = lRem / (lRem + sRem);
    let L = Math.round(packsPerDay * ratioL);
    if (L === 0) L = 1;
    if (L === packsPerDay) L = packsPerDay - 1;
    return [...Array(L).fill("L"), ...Array(packsPerDay - L).fill("S")];
  }

  const results = [];
  for (let k = 0; k < runs; k++) {
    let s = S0,
      l = L0,
      day = 0,
      idx = 0,
      pat = [...pattern]; // copia iniziale

    while (s > 0 || l > 0) {
      if (idx === 0) pat = makePattern(l, s); // aggiorna all’inizio di ogni giorno
      day++;
      for (let i = 0; i < packsPerDay; i++) {
        const set = pat[i];
        const r = rarities[Math.floor(Math.random() * 4)];
        if (Math.random() < pR[r]) {
          if (set === "L" && l) l--;
          else if (set === "S" && s) s--;
        }
      }
    }
    results.push(day);
  }

  results.sort((a, b) => a - b);
  const out = [0.5, 0.75, 0.9, 0.99].map(
    (p) => results[Math.floor(results.length * p) - 1]
  );
  self.postMessage(out); // [m50, m75, m90, m99]
};
