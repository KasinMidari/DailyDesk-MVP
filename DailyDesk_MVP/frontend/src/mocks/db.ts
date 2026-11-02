/**
 * Dữ liệu giả cho frontend khi chưa có backend.
 * Lưu trong localStorage để tải lại trang vẫn còn dữ liệu.
 * Xoá dữ liệu: localStorage.removeItem("dailydesk-mock-db") rồi tải lại.
 */
import { uuidv7 } from "uuidv7";
import { DEMO_USER } from "@/lib/auth";

export type Row = Record<string, any>;

export type MockDb = {
  boards: Row[];
  lists: Row[];
  cards: Row[];
  labels: Row[];
  cardLabels: { cardId: string; labelId: string }[];
  members: Row[];
  cardMembers: { cardId: string; memberId: string }[];
  checklist: Row[];
  checklistMembers: { itemId: string; memberId: string }[];
  attachments: Row[];
  comments: Row[];
  activities: Row[];
  templates: Row[];
};

const STORAGE_KEY = "dailydesk-mock-db";
const VERSION = 1;

/** Danh bạ người dùng giả để tìm và mời thành viên vào board. */
export const DIRECTORY = [
  { user_id: DEMO_USER.sub, name: DEMO_USER.name, email: DEMO_USER.email, nickname: DEMO_USER.nickname },
  { user_id: "google-oauth2|demo-khoa", name: "Trần Đăng Khoa", email: "dangkhoa.demo@gmail.com", nickname: "dangkhoa" },
  { user_id: "google-oauth2|demo-linh", name: "Phạm Thuỳ Linh", email: "thuylinh.demo@gmail.com", nickname: "thuylinh" },
  { user_id: "google-oauth2|demo-quan", name: "Lê Minh Quân", email: "minhquan.demo@gmail.com", nickname: "minhquan" },
];

const DAY = 24 * 60 * 60 * 1000;

function at(daysFromNow: number, hour = 17) {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function emptyCard(): Row {
  return {
    description: null,
    coverUrl: null,
    coverPublicId: null,
    coverColor: null,
    coverMode: null,
    startDate: null,
    deadline: null,
    dueAt: null,
    dueComplete: false,
    reminderMinutes: null,
    recurrence: null,
    recurrenceDay: null,
    recurrenceWeekday: null,
    repeatFrequency: null,
    repeatInterval: null,
    latitude: null,
    longitude: null,
    completed: false,
    isTemplate: false,
  };
}

function seed(): MockDb {
  const db: MockDb = {
    boards: [],
    lists: [],
    cards: [],
    labels: [],
    cardLabels: [],
    members: [],
    cardMembers: [],
    checklist: [],
    checklistMembers: [],
    attachments: [],
    comments: [],
    activities: [],
    templates: [],
  };
  const userId = DEMO_USER.sub;
  const now = new Date().toISOString();

  const label = (name: string, color: string) => {
    const row = { id: uuidv7(), name, color, userId };
    db.labels.push(row);
    return row;
  };
  const high = label("Ưu tiên cao", "#f87168");
  const mid = label("Ưu tiên vừa", "#f5cd47");
  const low = label("Ưu tiên thấp", "#4bce97");
  const study = label("Học tập", "#579dff");

  const board = (name: string, backgroundColor: string) => {
    const row = { id: uuidv7(), name, userId, backgroundColor, backgroundUrl: null, backgroundPublicId: null };
    db.boards.push(row);
    db.members.push({
      id: uuidv7(),
      boardId: row.id,
      userId,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      avatar: null,
      timezone: null,
      role: "admin",
      addedAt: now,
    });
    return row;
  };
  const list = (boardId: string, name: string, order: number) => {
    const row = { id: uuidv7(), name, order, boardId };
    db.lists.push(row);
    return row;
  };
  const card = (
    listId: string,
    order: number,
    name: string,
    extra: Row = {},
    labels: Row[] = [],
  ) => {
    const row = {
      ...emptyCard(),
      id: uuidv7(),
      name,
      order,
      listId,
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
    db.cards.push(row);
    labels.forEach((l) => db.cardLabels.push({ cardId: row.id, labelId: l.id }));
    return row;
  };

  // Board 1: đồ án môn học
  const project = board("Đồ án SE100", "#0c66e4");
  const todo = list(project.id, "Todo", 0);
  const doing = list(project.id, "Doing", 1);
  const done = list(project.id, "Done", 2);

  const erd = card(todo.id, 0, "Vẽ ERD và sơ đồ Use Case", {
    description: "Hai bảng chính: users và tasks. Xuất ảnh PNG để đưa vào README.",
    dueAt: at(2),
    deadline: at(2),
  }, [high, study]);
  card(todo.id, 1, "Viết danh sách test case thủ công", {
    description: "Thêm / sửa / xoá / lọc / sắp xếp. Ghi kết quả pass/fail.",
    dueAt: at(4),
    deadline: at(4),
  }, [mid, study]);
  card(todo.id, 2, "Quay video demo 1–2 phút", { dueAt: at(6), deadline: at(6) }, [low]);
  const api = card(doing.id, 0, "Dựng giao diện danh sách task", {
    description: "Lọc theo trạng thái, sắp xếp theo deadline, trạng thái trống và lỗi.",
    startDate: at(-1, 8),
    dueAt: at(1),
    deadline: at(1),
    coverColor: "#579dff",
  }, [high]);
  card(doing.id, 1, "Viết nhật ký công việc hằng ngày", { dueAt: at(-1), deadline: at(-1) }, [mid]);
  card(done.id, 0, "Chốt phạm vi MVP", { dueAt: at(-3), deadline: at(-3), dueComplete: true, completed: true }, [high]);
  card(done.id, 1, "Tạo repo GitHub", { dueAt: at(-2), deadline: at(-2), dueComplete: true, completed: true }, [low]);

  [
    ["Bảng users", true],
    ["Bảng tasks", true],
    ["Quan hệ 1-n", false],
  ].forEach(([name, completed], i) =>
    db.checklist.push({ id: uuidv7(), name, completed, order: i, cardId: erd.id }),
  );
  [
    ["Thanh lọc trạng thái", true],
    ["Sắp xếp theo deadline", false],
    ["Trạng thái trống", false],
  ].forEach(([name, completed], i) =>
    db.checklist.push({ id: uuidv7(), name, completed, order: i, cardId: api.id }),
  );
  db.comments.push({
    id: uuidv7(),
    cardId: api.id,
    userId,
    content: "Nhớ để task không có deadline xuống cuối danh sách khi sắp xếp.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  });

  // Board 2: việc cá nhân
  const personal = board("Việc cá nhân", "#1f845a");
  const pTodo = list(personal.id, "Todo", 0);
  const pDoing = list(personal.id, "Doing", 1);
  list(personal.id, "Done", 2);
  card(pTodo.id, 0, "Đóng tiền điện tháng này", { dueAt: at(3, 20), deadline: at(3, 20) }, [mid]);
  card(pTodo.id, 1, "Đặt lịch khám răng", {}, [low]);
  card(pDoing.id, 0, "Ôn tập Cấu trúc dữ liệu", { dueAt: at(5, 9), deadline: at(5, 9) }, [study, high]);

  // Mẫu board
  const tpl = (name: string, description: string, category: string, backgroundColor: string, lists: [string, string[]][]) => {
    const id = uuidv7();
    db.templates.push({
      id,
      name,
      description,
      category,
      userId: undefined,
      isPublic: true,
      backgroundColor,
      createdAt: now,
      updatedAt: now,
      lists: lists.map(([listName, cards], order) => {
        const listId = uuidv7();
        return {
          id: listId,
          name: listName,
          order,
          templateId: id,
          cards: cards.map((cardName, cardOrder) => ({
            id: uuidv7(),
            name: cardName,
            order: cardOrder,
            templateListId: listId,
          })),
        };
      }),
      labels: [],
    });
  };
  tpl("Kanban cơ bản", "Ba cột Todo, Doing, Done cho mọi loại công việc.", "personal", "#0c66e4", [
    ["Todo", ["Việc đầu tiên"]],
    ["Doing", []],
    ["Done", []],
  ]);
  tpl("Kế hoạch học kỳ", "Theo dõi bài tập, đồ án và lịch thi của từng môn.", "education", "#6e5dc6", [
    ["Bài tập", ["Bài tập tuần 1"]],
    ["Đồ án", ["Chọn đề tài"]],
    ["Lịch thi", []],
    ["Đã xong", []],
  ]);

  return db;
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === VERSION) return parsed.data as MockDb;
    }
  } catch {
    // dữ liệu hỏng thì tạo lại từ đầu
  }
  return seed();
}

export const db: MockDb = load();

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, data: db }));
  } catch {
    // Hết dung lượng (thường do ảnh lớn): vẫn giữ trong bộ nhớ cho phiên này.
  }
}

persist();
