const p = Promise.race([
  fetch('...'),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
]);
