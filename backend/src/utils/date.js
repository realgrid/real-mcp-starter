function toEpoch(dateStr) {
  return Date.parse(dateStr);
}

function formatDate(epoch) {
  if (epoch == null) return null;
  return new Date(Number(epoch)).toISOString().slice(0, 10);
}

function formatRow(row) {
  const formatted = { ...row };
  for (const key of Object.keys(formatted)) {
    if (key.includes('date') && typeof formatted[key] === 'number') {
      formatted[key] = formatDate(formatted[key]);
    }
  }
  return formatted;
}

module.exports = { toEpoch, formatDate, formatRow };
