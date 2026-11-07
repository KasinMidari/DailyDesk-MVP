/**
 * Màu avatar người dùng.
 *
 * Đây là *danh tính*, không phải dữ liệu: nó chỉ để nhận ra ai là ai, nên phải
 * nhạt và đứng ngoài mọi thứ đang mang nghĩa (trạng thái, hạn, ưu tiên). Bảng
 * mặc định của Tailwind (các thang 500) bão hoà ngang với
 * màu cảnh báo, nên vài cái avatar đủ để át hết tín hiệu thật trên màn.
 *
 * Các sắc cách nhau ít nhất 60° để hai người đứng cạnh nhau không lẫn.
 */
const AVATAR_TINTS = [
  "bg-[#e7e2f2] text-[#40336b]", // tím
  "bg-[#f5e2df] text-[#7a332c]", // đỏ
  "bg-[#dfe8f1] text-[#2c4a68]", // xanh
  "bg-[#e0ece3] text-[#2d5240]", // lá
  "bg-[#f2eada] text-[#6b5118]", // vàng đất
  "bg-[#efe0e8] text-[#6b3b51]", // mận
  "bg-[#dceaea] text-[#27585c]", // lam
  "bg-[#eee6dd] text-[#6b4a28]", // nâu
] as const;

/** Màu của một người, ổn định theo tên để lần nào mở cũng ra đúng màu đó. */
export function avatarTint(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

export { AVATAR_TINTS };
