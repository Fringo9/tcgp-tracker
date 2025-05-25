self.onmessage = (e) => {
  const { s, l, p, runs } = e.data;
  const res = [0, 0, 0, 0];
  for (let i = 0; i < runs; i++) {
    /* …simulazione una run… */
    // res[0]+= giorniPerFinire; ecc.
  }
  res.forEach((v, i) => (res[i] = Math.round(v / runs)));
  postMessage(res);
};
