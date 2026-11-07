/** Màu avatar thành viên, như bản gốc. */
const AVATAR_TINTS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-cyan-500",
] as const;

/** Màu của một người, ổn định theo tên để lần nào mở cũng ra đúng màu đó. */
export function avatarTint(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

export { AVATAR_TINTS };
