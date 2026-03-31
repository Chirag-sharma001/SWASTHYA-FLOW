/**
 * Calculates the estimated wait time for a patient in queue.
 * @param {number} position - Positional scale (1-indexed among pending patients).
 * @param {number[]} consultationDurations - Array of completed consultation durations in seconds.
 * @param {number} windowSize - Number of recent consultations to average (default 5).
 * @returns {number} Estimated wait time in seconds.
 */
function estimateWait(position, consultationDurations, windowSize = 5) {
  if (!consultationDurations || consultationDurations.length === 0) {
    return position * 300; // default 5 minutes per patient
  }
  
  const recentDurs = consultationDurations.slice(-windowSize);
  const sum = recentDurs.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / recentDurs.length;
  
  return position * avg;
}

module.exports = { estimateWait };
