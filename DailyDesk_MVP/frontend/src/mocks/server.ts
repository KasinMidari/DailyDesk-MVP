/**
 * Backend giả chạy ngay trong trình duyệt.
 * Chặn mọi request tới địa chỉ backend (mặc định http://localhost:3000)
 * và trả về dữ liệu từ ./db.ts theo đúng hình dạng API cũ.
 * Khi có backend thật: đặt VITE_USE_MOCK=false trong .env.
 */
import { uuidv7 } from "uuidv7";
import { DIRECTORY, db, emptyCard, persist, type Row } from "./db";
import { DEMO_USER, subFromToken } from "@/lib/auth";

type Ctx = {
  method: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
  sub: string | undefined;
};
type Result = { status: number; body: unknown };
type Handler = (ctx: Ctx) => Result | Promise<Result>;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const ok = (body: unknown, status = 200): Result => ({ status, body });
const nowIso = () => new Date().toISOString();

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

function need(sub: string | undefined) {
  if (!sub) throw new HttpError(401, "Bạn cần đăng nhập");
  return sub;
}

function profile(sub: string) {
  const person = DIRECTORY.find((u) => u.user_id === sub);
  const name = person?.name ?? DEMO_USER.name;
  return {
    id: sub,
    name,
    email: person?.email ?? DEMO_USER.email,
    avatar: undefined as string | undefined,
    initials: initials(name),
  };
}

// ---------- quyền truy cập ----------
function roleOn(boardId: string, sub: string) {
  const board = db.boards.find((b) => b.id === boardId);
  if (!board) return undefined;
  if (board.userId === sub) return "owner";
  return db.members.find((m) => m.boardId === boardId && m.userId === sub)?.role as
    | string
    | undefined;
}

function boardFor(boardId: string, sub: string) {
  const board = db.boards.find((b) => b.id === boardId);
  if (!board || !roleOn(boardId, sub)) throw new HttpError(404, "Không tìm thấy board");
  return board;
}

function cardIn(boardId: string, cardId: string) {
  const card = db.cards.find((c) => c.id === cardId);
  const list = card && db.lists.find((l) => l.id === card.listId);
  if (!card || !list || list.boardId !== boardId) throw new HttpError(404, "Không tìm thấy thẻ");
  return card;
}

// ---------- dựng dữ liệu trả về ----------
function cardMember(memberId: string) {
  const m = db.members.find((x) => x.id === memberId);
  if (!m) return undefined;
  return { id: m.id, name: m.name, email: m.email, avatar: m.avatar ?? null, initials: initials(m.name) };
}

function enrichCard(card: Row): Row {
  return {
    ...card,
    labels: db.cardLabels
      .filter((cl) => cl.cardId === card.id)
      .map((cl) => db.labels.find((l) => l.id === cl.labelId))
      .filter(Boolean)
      .map((l) => ({ id: l!.id, name: l!.name, color: l!.color })),
    members: db.cardMembers
      .filter((cm) => cm.cardId === card.id)
      .map((cm) => cardMember(cm.memberId))
      .filter(Boolean),
    attachments: db.attachments.filter((a) => a.cardId === card.id),
  };
}

function listsWithCards(boardId: string): Row[] {
  return db.lists
    .filter((l) => l.boardId === boardId)
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      ...l,
      cards: db.cards
        .filter((c) => c.listId === l.id)
        .sort((a, b) => a.order - b.order)
        .map(enrichCard),
    }));
}

function fullBoard(board: Row) {
  return { ...board, lists: listsWithCards(board.id) };
}

function logActivity(cardId: string, sub: string, actionType: string, description: string) {
  db.activities.push({
    id: uuidv7(),
    cardId,
    userId: sub,
    actionType,
    activityType: actionType.split(".")[0],
    action: actionType,
    description,
    metadata: null,
    createdAt: nowIso(),
  });
}

function setCardRelations(cardId: string, body: Row) {
  if (body.labels !== undefined) {
    db.cardLabels = db.cardLabels.filter((cl) => cl.cardId !== cardId);
    (body.labels ?? []).forEach((l: Row) => db.cardLabels.push({ cardId, labelId: l.id }));
  }
  if (body.members !== undefined) {
    db.cardMembers = db.cardMembers.filter((cm) => cm.cardId !== cardId);
    (body.members ?? []).forEach((m: Row) => db.cardMembers.push({ cardId, memberId: m.id }));
  }
}

const CARD_FIELDS = Object.keys(emptyCard()).concat(["name", "order", "listId"]);

function pick(body: Row, keys: string[]) {
  const out: Row = {};
  keys.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });
  return out;
}

function removeCard(cardId: string) {
  db.cards = db.cards.filter((c) => c.id !== cardId);
  db.cardLabels = db.cardLabels.filter((x) => x.cardId !== cardId);
  db.cardMembers = db.cardMembers.filter((x) => x.cardId !== cardId);
  const itemIds = db.checklist.filter((i) => i.cardId === cardId).map((i) => i.id);
  db.checklist = db.checklist.filter((i) => i.cardId !== cardId);
  db.checklistMembers = db.checklistMembers.filter((x) => !itemIds.includes(x.itemId));
  db.attachments = db.attachments.filter((a) => a.cardId !== cardId);
  db.comments = db.comments.filter((c) => c.cardId !== cardId);
  db.activities = db.activities.filter((a) => a.cardId !== cardId);
}

function removeList(listId: string) {
  db.cards.filter((c) => c.listId === listId).forEach((c) => removeCard(c.id));
  db.lists = db.lists.filter((l) => l.id !== listId);
}

function checklistOut(item: Row) {
  return {
    ...item,
    members: db.checklistMembers
      .filter((x) => x.itemId === item.id)
      .map((x) => cardMember(x.memberId))
      .filter(Boolean),
  };
}

function commentOut(c: Row): Row {
  return { ...c, text: c.content, user: profile(c.userId) };
}

function boardFromTemplate(tpl: Row, sub: string, name: string, includeCards: boolean) {
  const board = createBoardRow(sub, { id: uuidv7(), name, backgroundColor: tpl.backgroundColor });
  (tpl.lists ?? []).forEach((tl: Row) => {
    const listId = uuidv7();
    db.lists.push({ id: listId, name: tl.name, order: tl.order, boardId: board.id });
    if (includeCards) {
      (tl.cards ?? []).forEach((tc: Row) =>
        db.cards.push({
          ...emptyCard(),
          id: uuidv7(),
          name: tc.name,
          description: tc.description ?? null,
          order: tc.order,
          listId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      );
    }
  });
  return board;
}

function createBoardRow(sub: string, body: Row) {
  const board = {
    id: body.id ?? uuidv7(),
    name: body.name,
    userId: sub,
    backgroundColor: body.backgroundColor ?? null,
    backgroundUrl: body.backgroundUrl || null,
    backgroundPublicId: null,
  };
  db.boards.push(board);
  const me = profile(sub);
  db.members.push({
    id: uuidv7(),
    boardId: board.id,
    userId: sub,
    name: me.name,
    email: me.email,
    avatar: null,
    timezone: null,
    role: "admin",
    addedAt: nowIso(),
  });
  return board;
}

function requireName(value: unknown, what: string) {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${what} không được để trống`);
  return value.trim();
}

// ---------- bảng định tuyến ----------
const routes: [string, string, Handler][] = [
  // Boards
  ["GET", "/boards", ({ sub }) => {
    const me = need(sub);
    const ownedBoards = db.boards.filter((b) => b.userId === me).map(fullBoard);
    const invitedBoards = db.members
      .filter((m) => m.userId === me)
      .map((m) => {
        const b = db.boards.find((x) => x.id === m.boardId);
        return b && b.userId !== me ? { ...fullBoard(b), role: m.role } : undefined;
      })
      .filter(Boolean);
    return ok({ ownedBoards, invitedBoards });
  }],
  ["POST", "/boards", ({ sub, body }) => {
    const me = need(sub);
    requireName(body?.name, "Tên board");
    return ok(createBoardRow(me, body), 201);
  }],
  ["GET", "/boards/cards/all", ({ sub }) => {
    const me = need(sub);
    const out: Row[] = [];
    db.boards
      .filter((b) => roleOn(b.id, me))
      .forEach((b) =>
        listsWithCards(b.id).forEach((l) =>
          l.cards.forEach((c: Row) => out.push({ ...c, listName: l.name, boardId: b.id, boardName: b.name })),
        ),
      );
    return ok(out);
  }],
  ["GET", "/boards/:id", ({ sub, params }) => ok(fullBoard(boardFor(params.id, need(sub))))],
  ["PUT", "/boards/:id", ({ sub, params, body }) => {
    const board = boardFor(params.id, need(sub));
    if (body.name !== undefined) board.name = requireName(body.name, "Tên board");
    if (body.backgroundColor !== undefined) board.backgroundColor = body.backgroundColor;
    if (body.backgroundUrl !== undefined) board.backgroundUrl = body.backgroundUrl;
    return ok(board);
  }],
  ["DELETE", "/boards/:id", ({ sub, params }) => {
    const me = need(sub);
    const board = boardFor(params.id, me);
    if (board.userId !== me) throw new HttpError(403, "Chỉ chủ board mới xoá được");
    db.lists.filter((l) => l.boardId === board.id).forEach((l) => removeList(l.id));
    db.members = db.members.filter((m) => m.boardId !== board.id);
    db.boards = db.boards.filter((b) => b.id !== board.id);
    return ok({ message: "Đã xoá board" });
  }],
  ["GET", "/boards/:id/lists", ({ sub, params }) => {
    boardFor(params.id, need(sub));
    return ok(db.lists.filter((l) => l.boardId === params.id).sort((a, b) => a.order - b.order));
  }],
  ["GET", "/boards/:id/cards", ({ sub, params }) => {
    boardFor(params.id, need(sub));
    return ok(listsWithCards(params.id).flatMap((l) => l.cards as Row[]));
  }],

  // Lists
  ["POST", "/boards/:boardId/lists", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    const list = {
      id: body.id ?? uuidv7(),
      name: requireName(body.name, "Tên danh sách"),
      order: body.order ?? db.lists.filter((l) => l.boardId === params.boardId).length,
      boardId: params.boardId,
    };
    db.lists.push(list);
    return ok(list, 201);
  }],
  ["GET", "/boards/:boardId/lists/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    const list = db.lists.find((l) => l.id === params.id && l.boardId === params.boardId);
    if (!list) throw new HttpError(404, "Không tìm thấy danh sách");
    return ok(list);
  }],
  ["PUT", "/boards/:boardId/lists/:id", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    const list = db.lists.find((l) => l.id === params.id && l.boardId === params.boardId);
    if (!list) throw new HttpError(404, "Không tìm thấy danh sách");
    if (body.name !== undefined) list.name = requireName(body.name, "Tên danh sách");
    if (body.order !== undefined) list.order = body.order;
    return ok(list);
  }],
  ["DELETE", "/boards/:boardId/lists/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    removeList(params.id);
    return ok({ message: "Đã xoá danh sách" });
  }],

  // Cards
  ["POST", "/boards/:boardId/cards", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const list = db.lists.find((l) => l.id === body.listId && l.boardId === params.boardId);
    if (!list) throw new HttpError(400, "Danh sách không hợp lệ");
    const card = {
      ...emptyCard(),
      ...pick(body, CARD_FIELDS),
      id: body.id ?? uuidv7(),
      name: requireName(body.name, "Tên thẻ"),
      deadline: body.deadline ?? body.dueAt ?? null,
      dueAt: body.dueAt ?? body.deadline ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.cards.push(card);
    setCardRelations(card.id, body);
    logActivity(card.id, me, "card.created", `đã tạo thẻ trong danh sách ${list.name}`);
    return ok(enrichCard(card), 201);
  }],
  ["POST", "/boards/:boardId/cards/from-template", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const source = db.cards.find((c) => c.id === body.templateCardId);
    if (!source) throw new HttpError(404, "Không tìm thấy thẻ mẫu");
    const card = {
      ...source,
      id: uuidv7(),
      listId: body.listId,
      order: body.order ?? 0,
      isTemplate: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.cards.push(card);
    db.cardLabels
      .filter((cl) => cl.cardId === source.id)
      .forEach((cl) => db.cardLabels.push({ cardId: card.id, labelId: cl.labelId }));
    db.checklist
      .filter((i) => i.cardId === source.id)
      .forEach((i) => db.checklist.push({ ...i, id: uuidv7(), cardId: card.id, completed: false }));
    return ok(enrichCard(card), 201);
  }],
  ["GET", "/boards/:boardId/cards/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    return ok(enrichCard(cardIn(params.boardId, params.id)));
  }],
  ["PUT", "/boards/:boardId/cards/:id", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const card = cardIn(params.boardId, params.id);
    if (body.name !== undefined) requireName(body.name, "Tên thẻ");
    if (body.listId !== undefined && body.listId !== card.listId) {
      const target = db.lists.find((l) => l.id === body.listId && l.boardId === params.boardId);
      if (!target) throw new HttpError(400, "Danh sách không hợp lệ");
      logActivity(card.id, me, "card.moved", `đã chuyển thẻ sang ${target.name}`);
    }
    if (body.name !== undefined && body.name !== card.name) {
      logActivity(card.id, me, "card.renamed", `đã đổi tên thẻ thành "${body.name}"`);
    }
    Object.assign(card, pick(body, CARD_FIELDS), { updatedAt: nowIso() });
    if (body.deadline !== undefined && body.dueAt === undefined) card.dueAt = body.deadline;
    if (body.coverUrl === "") card.coverUrl = null;
    setCardRelations(card.id, body);
    return ok(enrichCard(card));
  }],
  ["DELETE", "/boards/:boardId/cards/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    cardIn(params.boardId, params.id);
    removeCard(params.id);
    return ok({ message: "Đã xoá thẻ" });
  }],

  // Hạn hoàn thành
  ["PATCH", "/boards/:boardId/cards/:cardId/due", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const card = cardIn(params.boardId, params.cardId);
    ["startDate", "dueAt", "dueComplete", "repeatFrequency", "repeatInterval"].forEach((k) => {
      if (body[k] !== undefined) card[k] = body[k];
    });
    if (body.reminderMinutes !== undefined) {
      card.reminderMinutes = body.reminderMinutes === null ? null : Number(body.reminderMinutes);
    }
    if (body.dueAt !== undefined) card.deadline = body.dueAt;
    if (body.dueComplete !== undefined) card.completed = body.dueComplete;
    logActivity(card.id, me, "card.due.updated", "đã cập nhật hạn hoàn thành");
    return ok({
      startDate: card.startDate,
      dueAt: card.dueAt,
      dueComplete: !!card.dueComplete,
      reminderMinutes: card.reminderMinutes,
      repeatFrequency: card.repeatFrequency,
      repeatInterval: card.repeatInterval,
    });
  }],
  ["DELETE", "/boards/:boardId/cards/:cardId/due", ({ sub, params }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const card = cardIn(params.boardId, params.cardId);
    Object.assign(card, {
      startDate: null,
      dueAt: null,
      deadline: null,
      dueComplete: false,
      reminderMinutes: null,
      repeatFrequency: null,
      repeatInterval: null,
    });
    logActivity(card.id, me, "card.due.removed", "đã xoá hạn hoàn thành");
    return ok({ message: "Đã xoá hạn" });
  }],

  // Checklist
  ["GET", "/boards/:boardId/cards/:cardId/checklist-items", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    cardIn(params.boardId, params.cardId);
    return ok(
      db.checklist
        .filter((i) => i.cardId === params.cardId)
        .sort((a, b) => a.order - b.order)
        .map(checklistOut),
    );
  }],
  ["POST", "/boards/:boardId/cards/:cardId/checklist-items", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    cardIn(params.boardId, params.cardId);
    const item = {
      id: body.id ?? uuidv7(),
      name: requireName(body.name, "Nội dung việc cần làm"),
      completed: !!body.completed,
      order: body.order ?? 0,
      cardId: params.cardId,
    };
    db.checklist.push(item);
    (body.members ?? []).forEach((m: Row) => db.checklistMembers.push({ itemId: item.id, memberId: m.id }));
    return ok(checklistOut(item), 201);
  }],
  ["GET", "/boards/:boardId/cards/:cardId/checklist-items/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    const item = db.checklist.find((i) => i.id === params.id && i.cardId === params.cardId);
    if (!item) throw new HttpError(404, "Không tìm thấy mục");
    return ok(checklistOut(item));
  }],
  ["PUT", "/boards/:boardId/cards/:cardId/checklist-items/:id", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    const item = db.checklist.find((i) => i.id === params.id && i.cardId === params.cardId);
    if (!item) throw new HttpError(404, "Không tìm thấy mục");
    if (body.name !== undefined) item.name = requireName(body.name, "Nội dung việc cần làm");
    if (body.completed !== undefined) item.completed = body.completed;
    if (body.order !== undefined) item.order = body.order;
    if (body.members !== undefined) {
      db.checklistMembers = db.checklistMembers.filter((x) => x.itemId !== item.id);
      body.members.forEach((m: Row) => db.checklistMembers.push({ itemId: item.id, memberId: m.id }));
    }
    return ok(checklistOut(item));
  }],
  ["DELETE", "/boards/:boardId/cards/:cardId/checklist-items/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    db.checklist = db.checklist.filter((i) => i.id !== params.id);
    db.checklistMembers = db.checklistMembers.filter((x) => x.itemId !== params.id);
    return ok({ message: "Đã xoá mục" });
  }],

  // Nhãn (theo người dùng)
  ["GET", "/users/:userId/labels", ({ sub }) => ok(db.labels.filter((l) => l.userId === need(sub)))],
  ["POST", "/users/:userId/labels", ({ sub, body }) => {
    const label = { id: body.id ?? uuidv7(), name: body.name ?? "", color: body.color, userId: need(sub) };
    db.labels.push(label);
    return ok(label, 201);
  }],
  ["PUT", "/users/:userId/labels/:id", ({ sub, params, body }) => {
    const label = db.labels.find((l) => l.id === params.id && l.userId === need(sub));
    if (!label) throw new HttpError(404, "Không tìm thấy nhãn");
    if (body.name !== undefined) label.name = body.name;
    if (body.color !== undefined) label.color = body.color;
    return ok(label);
  }],
  ["DELETE", "/users/:userId/labels/:id", ({ sub, params }) => {
    need(sub);
    db.labels = db.labels.filter((l) => l.id !== params.id);
    db.cardLabels = db.cardLabels.filter((cl) => cl.labelId !== params.id);
    return ok({ message: "Đã xoá nhãn" });
  }],

  // Thành viên board
  ["GET", "/boards/:boardId/members", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    return ok(db.members.filter((m) => m.boardId === params.boardId));
  }],
  ["POST", "/boards/:boardId/members", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    if (db.members.some((m) => m.boardId === params.boardId && m.userId === body.userId)) {
      throw new HttpError(409, "Người này đã là thành viên");
    }
    const member = {
      id: body.id ?? uuidv7(),
      boardId: params.boardId,
      userId: body.userId,
      name: body.name,
      email: body.email,
      avatar: body.avatar ?? null,
      timezone: null,
      role: body.role ?? "member",
      addedAt: nowIso(),
    };
    db.members.push(member);
    return ok(member, 201);
  }],
  ["POST", "/boards/:boardId/members/by-user-id", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    const person = DIRECTORY.find((u) => u.user_id === body.userId);
    if (!person) throw new HttpError(404, "Không tìm thấy người dùng");
    const member = {
      id: uuidv7(),
      boardId: params.boardId,
      userId: person.user_id,
      name: person.name,
      email: person.email,
      avatar: null,
      timezone: null,
      role: body.role ?? "member",
      addedAt: nowIso(),
    };
    db.members.push(member);
    return ok(member, 201);
  }],
  ["PUT", "/boards/:boardId/members/:id", ({ sub, params, body }) => {
    boardFor(params.boardId, need(sub));
    const member = db.members.find((m) => m.id === params.id && m.boardId === params.boardId);
    if (!member) throw new HttpError(404, "Không tìm thấy thành viên");
    if (body.role) member.role = body.role;
    return ok(member);
  }],
  ["DELETE", "/boards/:boardId/members/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    db.members = db.members.filter((m) => m.id !== params.id);
    db.cardMembers = db.cardMembers.filter((cm) => cm.memberId !== params.id);
    return ok({ message: "Đã xoá thành viên" });
  }],
  ["GET", "/members/search", ({ sub, query }) => {
    need(sub);
    const q = (query.get("q") ?? "").toLowerCase();
    return ok(DIRECTORY.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q)));
  }],

  // Tệp đính kèm
  ["GET", "/boards/:boardId/cards/:cardId/attachments", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    return ok(db.attachments.filter((a) => a.cardId === params.cardId));
  }],
  ["POST", "/boards/:boardId/cards/:cardId/attachments", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    cardIn(params.boardId, params.cardId);
    const attachment = {
      id: uuidv7(),
      name: body.name,
      url: body.url,
      publicId: body.publicId ?? null,
      type: body.type,
      size: body.size,
      uploadedAt: nowIso(),
      uploadedBy: me,
      cardId: params.cardId,
    };
    db.attachments.push(attachment);
    logActivity(params.cardId, me, "attachment.added", `đã đính kèm ${body.name}`);
    return ok(attachment, 201);
  }],
  ["DELETE", "/boards/:boardId/cards/:cardId/attachments/:id", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    db.attachments = db.attachments.filter((a) => a.id !== params.id);
    return ok({ message: "Đã xoá tệp" });
  }],

  // Bình luận và hoạt động
  ["GET", "/boards/:boardId/cards/:cardId/comments", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    return ok(db.comments.filter((c) => c.cardId === params.cardId).map(commentOut));
  }],
  ["POST", "/boards/:boardId/cards/:cardId/comments", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    cardIn(params.boardId, params.cardId);
    const content = requireName(body.content, "Bình luận");
    if (content.length > 5000) throw new HttpError(400, "Bình luận tối đa 5000 ký tự");
    const comment = { id: uuidv7(), cardId: params.cardId, userId: me, content, createdAt: nowIso() };
    db.comments.push(comment);
    return ok(commentOut(comment), 201);
  }],
  ["PUT", "/boards/:boardId/cards/:cardId/comments/:commentId", ({ sub, params, body }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    const comment = db.comments.find((c) => c.id === params.commentId);
    if (!comment) throw new HttpError(404, "Không tìm thấy bình luận");
    if (comment.userId !== me) throw new HttpError(403, "Bạn chỉ sửa được bình luận của mình");
    comment.content = requireName(body.content, "Bình luận");
    comment.updatedAt = nowIso();
    return ok(commentOut(comment));
  }],
  ["DELETE", "/boards/:boardId/cards/:cardId/comments/:commentId", ({ sub, params }) => {
    const me = need(sub);
    boardFor(params.boardId, me);
    db.comments = db.comments.filter((c) => !(c.id === params.commentId && c.userId === me));
    return ok({ message: "Đã xoá bình luận" });
  }],
  ["GET", "/boards/:boardId/cards/:cardId/activities", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    return ok(
      db.activities
        .filter((a) => a.cardId === params.cardId)
        .map((a) => ({ ...a, user: profile(a.userId) })),
    );
  }],
  ["GET", "/boards/:boardId/cards/:cardId/timeline", ({ sub, params }) => {
    boardFor(params.boardId, need(sub));
    const items: Row[] = [
      ...db.comments.filter((c) => c.cardId === params.cardId).map((c) => ({ ...commentOut(c), type: "comment" })),
      ...db.activities
        .filter((a) => a.cardId === params.cardId)
        .map((a) => ({ ...a, user: profile(a.userId), type: "activity" })),
    ];
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return ok(items);
  }],

  // Ảnh nền board / ảnh bìa thẻ
  ["POST", "/media/image/:type/:id", ({ sub, params, body }) => {
    const me = need(sub);
    if (params.type === "board") {
      const board = boardFor(params.id, me);
      board.backgroundUrl = body.secure_url;
      board.backgroundPublicId = body.public_id;
    } else if (params.type === "card") {
      const card = db.cards.find((c) => c.id === params.id);
      if (!card) throw new HttpError(404, "Không tìm thấy thẻ");
      card.coverUrl = body.secure_url;
      card.coverPublicId = body.public_id;
    }
    return ok({ secure_url: body.secure_url, public_id: body.public_id });
  }],
  ["DELETE", "/media/image/:type/:id", ({ sub, params }) => {
    need(sub);
    if (params.type === "board") {
      const board = db.boards.find((b) => b.id === params.id);
      if (board) Object.assign(board, { backgroundUrl: null, backgroundPublicId: null });
    } else if (params.type === "card") {
      const card = db.cards.find((c) => c.id === params.id);
      if (card) Object.assign(card, { coverUrl: null, coverPublicId: null });
    }
    return ok({});
  }],

  // Mẫu board
  ["GET", "/templates", ({ sub, query }) => {
    const me = need(sub);
    const category = query.get("category");
    return ok(
      db.templates.filter(
        (t) => (t.isPublic || t.userId === me) && (!category || t.category === category),
      ),
    );
  }],
  ["POST", "/templates", ({ sub, body }) => {
    const me = need(sub);
    const id = uuidv7();
    const tpl = {
      id,
      name: requireName(body.name, "Tên mẫu"),
      description: body.description,
      category: body.category,
      userId: me,
      isPublic: !!body.isPublic,
      backgroundColor: body.backgroundColor,
      backgroundUrl: body.backgroundUrl,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lists: (body.lists ?? []).map((l: Row) => {
        const listId = uuidv7();
        return {
          id: listId,
          name: l.name,
          order: l.order,
          templateId: id,
          cards: (l.cards ?? []).map((c: Row) => ({ ...c, id: uuidv7(), templateListId: listId })),
        };
      }),
      labels: (body.labels ?? []).map((l: Row) => ({ ...l, id: uuidv7(), templateId: id })),
    };
    db.templates.push(tpl);
    return ok(tpl, 201);
  }],
  ["POST", "/templates/from-board/:boardId", ({ sub, params, body }) => {
    const me = need(sub);
    const board = boardFor(params.boardId, me);
    const id = uuidv7();
    const tpl = {
      id,
      name: body.templateName || board.name,
      description: body.templateDescription,
      category: body.category,
      userId: me,
      isPublic: !!body.isPublic,
      backgroundColor: board.backgroundColor,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lists: listsWithCards(board.id).map((l) => {
        const listId = uuidv7();
        return {
          id: listId,
          name: l.name,
          order: l.order,
          templateId: id,
          cards: l.cards.map((c: Row) => ({
            id: uuidv7(),
            name: c.name,
            description: c.description ?? undefined,
            order: c.order,
            templateListId: listId,
          })),
        };
      }),
      labels: [],
    };
    db.templates.push(tpl);
    return ok(tpl, 201);
  }],
  ["GET", "/templates/:id", ({ sub, params }) => {
    need(sub);
    const tpl = db.templates.find((t) => t.id === params.id);
    if (!tpl) throw new HttpError(404, "Không tìm thấy mẫu");
    return ok(tpl);
  }],
  ["PATCH", "/templates/:id", ({ sub, params, body }) => {
    const me = need(sub);
    const tpl = db.templates.find((t) => t.id === params.id && t.userId === me);
    if (!tpl) throw new HttpError(404, "Không tìm thấy mẫu");
    Object.assign(tpl, body, { updatedAt: nowIso() });
    return ok(tpl);
  }],
  ["DELETE", "/templates/:id", ({ sub, params }) => {
    const me = need(sub);
    const tpl = db.templates.find((t) => t.id === params.id);
    if (!tpl) throw new HttpError(404, "Không tìm thấy mẫu");
    if (tpl.userId !== me) throw new HttpError(403, "Không thể xoá mẫu có sẵn");
    db.templates = db.templates.filter((t) => t.id !== params.id);
    return ok({ message: "Đã xoá mẫu" });
  }],
  ["POST", "/templates/:id/create-board", ({ sub, params, body }) => {
    const me = need(sub);
    const tpl = db.templates.find((t) => t.id === params.id);
    if (!tpl) throw new HttpError(404, "Không tìm thấy mẫu");
    const board = boardFromTemplate(tpl, me, requireName(body.boardName, "Tên board"), body.includeCards !== false);
    return ok(fullBoard(board), 201);
  }],

  // Tìm kiếm
  ["GET", "/search", ({ sub, query }) => {
    const me = need(sub);
    const q = (query.get("q") ?? "").trim().toLowerCase();
    const types = query.getAll("types");
    const want = (t: string) => types.length === 0 || types.includes(t);
    const limit = Number(query.get("limit") ?? 20);
    const onlyBoard = query.get("boardId");
    const boards = db.boards.filter((b) => roleOn(b.id, me) && (!onlyBoard || b.id === onlyBoard));
    const has = (s: unknown) => typeof s === "string" && s.toLowerCase().includes(q);
    const results: Row[] = [];
    if (q) {
      if (want("board")) {
        boards.filter((b) => has(b.name)).slice(0, limit).forEach((b) =>
          results.push({
            type: "board",
            id: b.id,
            name: b.name,
            description: null,
            isFavorite: false,
            background: b.backgroundUrl ?? b.backgroundColor ?? null,
            createdAt: nowIso(),
          }),
        );
      }
      boards.forEach((b) => {
        listsWithCards(b.id).forEach((l) => {
          if (want("list") && has(l.name)) {
            results.push({ type: "list", id: l.id, name: l.name, boardId: b.id, boardName: b.name, position: l.order, cardCount: l.cards.length });
          }
          if (want("card")) {
            l.cards.filter((c: Row) => has(c.name) || has(c.description)).forEach((c: Row) =>
              results.push({
                type: "card",
                id: c.id,
                title: c.name,
                description: c.description,
                boardId: b.id,
                boardName: b.name,
                listId: l.id,
                listName: l.name,
                position: c.order,
                dueDate: c.dueAt,
                isCompleted: !!c.completed,
                labels: c.labels,
              }),
            );
          }
        });
      });
    }
    return ok({ results: results.slice(0, limit * 6), total: results.length, query: q });
  }],
];

// ---------- khớp đường dẫn ----------
const compiled = routes.map(([method, pattern, handler]) => {
  const keys: string[] = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:([a-zA-Z]+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "/?$",
  );
  return { method, regex, keys, handler };
});

export async function handleMockRequest(
  method: string,
  url: URL,
  body: unknown,
  authHeader: string | null,
): Promise<Result> {
  const path = url.pathname;
  const sub = subFromToken(authHeader?.replace(/^Bearer\s+/i, ""));
  for (const route of compiled) {
    if (route.method !== method) continue;
    const match = route.regex.exec(path);
    if (!match) continue;
    const params: Record<string, string> = {};
    route.keys.forEach((k, i) => (params[k] = decodeURIComponent(match[i + 1]!)));
    try {
      const result = await route.handler({ method, params, query: url.searchParams, body: body ?? {}, sub });
      if (method !== "GET") persist();
      return result;
    } catch (err) {
      if (err instanceof HttpError) return { status: err.status, body: { message: err.message } };
      console.error("[mock] lỗi xử lý", method, path, err);
      return { status: 500, body: { message: "Có lỗi xảy ra, vui lòng thử lại" } };
    }
  }
  return { status: 404, body: { message: `Không có API ${method} ${path}` } };
}
