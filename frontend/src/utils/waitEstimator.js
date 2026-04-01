export function estimateWait(position, consultationDurations, windowSize = 5) {
  if (!consultationDurations || consultationDurations.length === 0) {
    return position * 300;
  }
  const recent = consultationDurations.slice(-windowSize);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  return position * mean;
}
