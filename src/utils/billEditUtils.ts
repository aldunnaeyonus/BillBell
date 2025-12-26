export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function parseScannedDate(dateStr: string): string | null {
  try {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const m = parts[0].padStart(2, "0");
      const d = parts[1].padStart(2, "0");
      let y = parts[2];
      if (y.length === 2) y = "20" + y; 
      return `${y}-${m}-${d}`;
    }
    return null;
  } catch {
    return null;
  }
}