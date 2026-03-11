export function hashColor(str: string): string {
  let h1 = 0x5a;
  let h2 = 0x3c;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = (ch * 51 + (h1 << 5) - h1) ^ 0x3c;
    h2 = (ch * 31 + (h2 << 3) - h2) ^ 0x15;
  }
  const h = (h1 % 360);
  const s = 55 + ((h1 ^ h2) % 21);
  const l = 50 + (h2 % 23);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(".");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}
