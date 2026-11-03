import { describe, expect, it } from "vitest";
import { makeTestApp } from "./helpers.js";

describe("health & auth guard", () => {
  it("GET /health trả ok", async () => {
    const { call } = await makeTestApp();
    expect(await call("GET", "/health")).toEqual({ status: 200, body: { ok: true } });
  });

  it("route cần đăng nhập trả 401 khi thiếu hoặc sai token (FR-002)", async () => {
    const { call } = await makeTestApp();
    expect((await call("GET", "/boards")).status).toBe(401);
    const bad = await call("GET", "/boards", { token: "abc" });
    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe("Bạn cần đăng nhập");
  });
});
