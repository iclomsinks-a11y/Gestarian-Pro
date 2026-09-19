function parseDateStr(str) {
  if (!str) return new Date();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(y, m - 1, d);
  }
  return new Date(str);
}
console.log(parseDateStr('17/09/2026'));
console.log(parseDateStr('2026-09-17'));
