/**
 * Dữ liệu mẫu tiếng Việt để demo (`pnpm db:seed`).
 * Chạy lại được nhiều lần: xoá hết board và nhãn của user rồi tạo lại.
 * Ngày tháng tính tương đối so với lúc chạy nên dữ liệu luôn "tươi".
 */
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { loadEnv } from "../env.js";
import { nowIso } from "../http.js";
import { listDisplayName } from "../services/access.js";
import { upsertUser } from "../services/users.js";
import { createDb, prepareDb, type Db } from "./client.js";
import { activities, boards, cardLabels, cards, checklistItems, comments, labels, lists } from "./schema.js";

const DEFAULT_EMAIL = "dev@dailydesk.local";

/** Hạn chót cách hôm nay `days` ngày, vào giờ `hour` (giờ địa phương). */
function at(days: number, hour = 17, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

type Priority = "high" | "medium" | "low";

type CardSeed = {
  name: string;
  description?: string;
  due?: string | null;
  start?: string | null;
  priority?: Priority;
  labels?: string[];
  items?: [string, boolean][];
  comments?: string[];
};

type ListSeed = { name: string; cards: CardSeed[] };
type BoardSeed = { name: string; color: string; isDefault?: boolean; lists: ListSeed[] };

const LABELS: { name: string; color: string }[] = [
  { name: "Gấp", color: "#e2483d" },
  { name: "Cá nhân", color: "#1f845a" },
  { name: "Học", color: "#8f7ee7" },
  { name: "Công việc", color: "#0c66e4" },
  { name: "Chờ phản hồi", color: "#e2b203" },
];

/** Các list tên "Done"/"Đã xong" được coi là đã hoàn thành (statusFromList). */
const PLAN: BoardSeed[] = [
  {
    name: "Việc của tôi",
    color: "#0c66e4",
    isDefault: true,
    lists: [
      {
        name: "Todo",
        cards: [
          {
            name: "Gửi báo cáo tuần cho quản lý",
            description: "Tổng hợp tiến độ 3 đầu việc chính, gửi trước giờ họp.",
            due: at(-2, 9),
            priority: "high",
            labels: ["Gấp", "Công việc"],
            items: [
              ["Lấy số liệu từ bảng theo dõi", true],
              ["Viết phần nhận xét", false],
              ["Gửi email kèm tệp", false],
            ],
            comments: ["Quá hạn 2 ngày rồi, làm ngay sáng mai."],
          },
          {
            name: "Đặt lịch khám sức khoẻ định kỳ",
            due: at(-1, 8, 30),
            priority: "medium",
            labels: ["Cá nhân"],
          },
          {
            name: "Họp nhóm KITS",
            description: "Phòng 302, mang theo bản in tài liệu thiết kế.",
            due: at(0, 15),
            priority: "high",
            labels: ["Công việc"],
            items: [
              ["Chuẩn bị câu hỏi cho anh Nam", false],
              ["In tài liệu thiết kế", false],
            ],
          },
          { name: "Trả sách thư viện", due: at(0, 20), priority: "low", labels: ["Cá nhân"] },
          {
            name: "Chuẩn bị slide demo sản phẩm",
            description: "10 slide: vấn đề, giải pháp, demo, kế hoạch.",
            due: at(2, 14),
            start: at(0, 9),
            priority: "high",
            labels: ["Công việc"],
            items: [
              ["Dàn ý nội dung", true],
              ["Chọn ảnh minh hoạ", true],
              ["Dựng slide", false],
              ["Tập nói 2 lượt", false],
            ],
            comments: ["Nhớ để phần demo ở giữa cho đỡ khô.", "Đã xin được bản thiết kế mới nhất."],
          },
          { name: "Mua quà sinh nhật mẹ", due: at(6, 18), priority: "medium", labels: ["Cá nhân"] },
          { name: "Dọn hộp thư đến về 0", priority: "low" },
          {
            name: "Lên kế hoạch tháng sau",
            description: "Chia 4 tuần, mỗi tuần một mục tiêu chính.",
            priority: "medium",
          },
        ],
      },
      {
        name: "Doing",
        cards: [
          {
            name: "Viết tài liệu API cho backend",
            description: "Mô tả từng endpoint kèm ví dụ request/response.",
            due: at(3, 17),
            priority: "medium",
            labels: ["Công việc"],
            items: [
              ["Nhóm board/list/card", true],
              ["Nhóm nhãn và bình luận", false],
              ["Nhóm tìm kiếm", false],
            ],
            comments: ["Viết tới phần nhãn rồi."],
          },
          { name: "Ôn tập tiếng Anh 20 phút mỗi ngày", due: at(7, 21), priority: "low", labels: ["Học"] },
          {
            name: "Sửa lỗi đăng nhập trên Safari",
            description: "Token không lưu được khi chặn cookie của bên thứ ba.",
            due: at(0, 22),
            priority: "high",
            labels: ["Gấp", "Công việc"],
          },
        ],
      },
      {
        name: "Done",
        cards: [
          { name: "Nộp học phí học kỳ này", due: at(-5, 11), priority: "medium", labels: ["Cá nhân"] },
          { name: "Cập nhật CV và ảnh đại diện", priority: "low", labels: ["Cá nhân"] },
          { name: "Sao lưu dữ liệu máy tính", due: at(-3, 20), priority: "low" },
        ],
      },
    ],
  },
  {
    name: "Học tập",
    color: "#8f7ee7",
    lists: [
      {
        name: "Chờ học",
        cards: [
          { name: "Đọc chương 4 Giải tích", due: at(4, 20), priority: "medium", labels: ["Học"] },
          {
            name: "Làm bài tập Xác suất thống kê",
            due: at(-1, 23),
            priority: "high",
            labels: ["Gấp", "Học"],
            items: [
              ["Bài 1 đến 5", true],
              ["Bài 6 đến 10", false],
            ],
          },
        ],
      },
      {
        name: "Đang làm",
        cards: [
          {
            name: "Học TypeScript nâng cao",
            description: "Generics, type guard, utility type.",
            due: at(10, 21),
            priority: "medium",
            labels: ["Học"],
            items: [
              ["Xem khoá học phần 1", true],
              ["Làm bài tập phần 1", false],
              ["Viết lại ghi chú", false],
            ],
          },
        ],
      },
      { name: "Đã xong", cards: [{ name: "Thi giữa kỳ Toán", due: at(-8, 7, 30), priority: "high", labels: ["Học"] }] },
    ],
  },
  {
    name: "Dự án KITS",
    color: "#1f845a",
    lists: [
      {
        name: "Todo",
        cards: [
          { name: "Thiết kế lại trang chủ", due: at(8, 17), priority: "medium", labels: ["Công việc"] },
          {
            name: "Viết test cho module thanh toán",
            due: at(5, 17),
            priority: "high",
            labels: ["Gấp", "Công việc"],
            items: [
              ["Trường hợp thành công", false],
              ["Trường hợp thẻ bị từ chối", false],
              ["Trường hợp hết thời gian chờ", false],
            ],
          },
          { name: "Hỏi khách về yêu cầu xuất báo cáo", priority: "low", labels: ["Chờ phản hồi"] },
        ],
      },
      {
        name: "Doing",
        cards: [
          {
            name: "Tích hợp CI/CD",
            description: "GitHub Actions: kiểm kiểu, test, rồi deploy.",
            due: at(1, 17),
            priority: "high",
            labels: ["Công việc"],
            comments: ["Bước deploy còn thiếu biến môi trường."],
          },
          { name: "Chuẩn hoá README", priority: "low" },
        ],
      },
      { name: "Done", cards: [{ name: "Khởi tạo repo và cấu trúc thư mục", due: at(-6, 10), priority: "medium" }] },
    ],
  },
];

const DONE_LISTS = ["done", "xong", "đã xong", "hoàn thành"];

export type SeedSummary = {
  email: string;
  userId: string;
  boards: number;
  lists: number;
  cards: number;
  labels: number;
  checklistItems: number;
  comments: number;
  activities: number;
};

/** Tạo lại toàn bộ dữ liệu mẫu cho một email. Trả về bản tóm tắt để in ra hoặc kiểm thử. */
export async function seed(db: Db, email = DEFAULT_EMAIL): Promise<SeedSummary> {
  const user = await upsertUser(db, {
    googleSub: `dev|${email.toLowerCase()}`,
    email,
    name: email.split("@")[0]!,
    avatarUrl: null,
  });

  // Dọn dữ liệu cũ của chính user này; khoá ngoại cascade xoá list, card, checklist, bình luận.
  await db.delete(boards).where(eq(boards.userId, user.id));
  await db.delete(labels).where(eq(labels.userId, user.id));

  const now = nowIso();
  const labelId = new Map<string, string>();
  for (const l of LABELS) {
    const id = uuidv7();
    labelId.set(l.name, id);
    await db.insert(labels).values({ id, userId: user.id, name: l.name, color: l.color, createdAt: now, updatedAt: now });
  }

  const count = { boards: 0, lists: 0, cards: 0, checklistItems: 0, comments: 0, activities: 0 };

  for (const b of PLAN) {
    const boardId = uuidv7();
    await db.insert(boards).values({
      id: boardId,
      userId: user.id,
      name: b.name,
      backgroundColor: b.color,
      isDefault: b.isDefault ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
    count.boards++;

    for (const [listOrder, l] of b.lists.entries()) {
      const listId = uuidv7();
      await db
        .insert(lists)
        .values({ id: listId, boardId, name: l.name, order: listOrder, createdAt: now, updatedAt: now });
      count.lists++;

      const done = DONE_LISTS.includes(l.name.trim().toLowerCase());
      for (const [cardOrder, card] of l.cards.entries()) {
        const cardId = uuidv7();
        await db.insert(cards).values({
          id: cardId,
          listId,
          name: card.name,
          description: card.description ?? null,
          dueAt: card.due ?? null,
          startDate: card.start ?? null,
          priority: card.priority ?? "medium",
          completed: done ? 1 : 0,
          dueComplete: done ? 1 : 0,
          order: cardOrder,
          createdAt: now,
          updatedAt: now,
        });
        count.cards++;

        for (const name of card.labels ?? []) {
          const id = labelId.get(name);
          if (id) await db.insert(cardLabels).values({ cardId, labelId: id });
        }
        for (const [itemOrder, [name, checked]] of (card.items ?? []).entries()) {
          await db.insert(checklistItems).values({
            id: uuidv7(),
            cardId,
            name,
            completed: checked ? 1 : 0,
            order: itemOrder,
            createdAt: now,
            updatedAt: now,
          });
          count.checklistItems++;
        }
        for (const content of card.comments ?? []) {
          await db
            .insert(comments)
            .values({ id: uuidv7(), cardId, userId: user.id, content, createdAt: now, updatedAt: now });
          count.comments++;
        }
        await db.insert(activities).values({
          id: uuidv7(),
          cardId,
          userId: user.id,
          actionType: "card.created",
          description: `đã tạo task trong ${listDisplayName(l.name)}`,
          metadata: null,
          createdAt: now,
        });
        count.activities++;
      }
    }
  }

  return { email, userId: user.id, labels: LABELS.length, ...count };
}

/** Chạy trực tiếp: `pnpm db:seed` (đặt SEED_EMAIL để chọn tài khoản). */
async function main() {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // Không có .env: dùng biến môi trường của hệ thống.
  }
  const env = loadEnv({ SESSION_SECRET: "seed-only-secret-seed-only-secret", ...process.env });
  if (env.DATABASE_URL.startsWith("file:")) mkdirSync("./data", { recursive: true });

  const db = createDb(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
  await prepareDb(db);
  const s = await seed(db, process.env.SEED_EMAIL || DEFAULT_EMAIL);

  console.log("Đã tạo dữ liệu mẫu cho DailyDesk:");
  console.log(`  tài khoản      ${s.email} (${s.userId})`);
  console.log(`  cơ sở dữ liệu  ${env.DATABASE_URL}`);
  console.log(`  board          ${s.boards}`);
  console.log(`  danh sách      ${s.lists}`);
  console.log(`  task           ${s.cards}`);
  console.log(`  nhãn           ${s.labels}`);
  console.log(`  việc cần làm   ${s.checklistItems}`);
  console.log(`  bình luận      ${s.comments}`);
  console.log(`  hoạt động      ${s.activities}`);
  console.log(`Đăng nhập thử: POST /auth/dev { "email": "${s.email}" } (cần AUTH_DEV_LOGIN=true).`);
}

// Chỉ chạy khi gọi trực tiếp bằng tsx/node, không chạy khi được import trong test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
