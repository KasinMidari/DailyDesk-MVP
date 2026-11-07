# UI AUDIT — vòng 2 (đo thật)

> **KHÔNG CÒN ĐÚNG VỚI CODE (07/11/2026).**
> Giao diện đã được đưa về bản gốc của repo `DailyDesk/` theo yêu cầu:
> theme shadcn trung tính, nền board là ảnh/màu phủ kín, thanh công cụ kính mờ,
> card board kiểu bìa hồ sơ. Mọi thứ viết ở dưới về "sổ kế hoạch giấy",
> mực tím, bút dạ quang hay con dấu XONG không còn trong code nữa.
> Giữ lại làm hồ sơ quá trình.

Ngày: 2026-11-07 · Skill: `design-taste-frontend`, bộ quy tắc **app screens**
Căn cứ: `references/app-screens.md` (chưng cất từ 23 màn sản phẩm thật), `references/critique.md`, `references/tells.md`
Mốc tham chiếu: hai style skill chia cho brief này — `achromatic-ledger` và `editorial-greeting` (seed 1796905216)

**Khác vòng 1 ở chỗ nào.** [`UI_AUDIT_TASTE.md`](UI_AUDIT_TASTE.md) soi bằng mắt trên 7 ảnh cũ, tự khai là không chạy browser và không chạy `inspect.mjs`. Vòng này chạy thật: build production (`pnpm build`), `vite preview`, rồi `inspect.mjs --app` ở 1440/768/390 trên 5 màn, cộng `lint.mjs --app` trên toàn bộ `src/`. Mọi con số dưới đây lấy từ `.taste-skill/before/*/report.json`, không ước lượng.

Cách dựng để đo: một proxy tạm ở cổng 5173 chèn session đăng nhập vào `localStorage` trước khi app chạy, upstream là bản preview ở 4173. Không sửa gì trong project. Phải giữ đúng cổng 5173 vì `CORS_ORIGIN` của backend chỉ cho cổng đó.

---

## 1. Vòng 1 nói sai hai chỗ — đã được sửa từ trước

Trước khi liệt kê lỗi mới, phải đính chính: **hai phát hiện nặng nhất của vòng 1 không còn đúng.**

| Vòng 1 nói | Thực tế đo hôm nay |
|---|---|
| "Sidebar tối/đậm trên màn sáng, `--sidebar: oklch(0.31 0.095 292)`" | `index.css:174` giờ là `oklch(0.962 0.012 85)` — kem, cách nền đúng một bậc. Đạt luật §9.2 (0/17 màn thật có sidebar tối). |
| "Dark mode nhuộm tím cả nền, `--paper: oklch(0.22 0.015 290)`" | `index.css:205` giờ là `oklch(0.17 0 0)`, card `0.21 0 0`, sidebar `0.15 0 0` — chroma 0, trung tính thật. Đạt §9.3 "no navy and no slate". |

Bìa sổ tím chiếm ~14–15% pixel mà vòng 1 gọi là sai lệch nặng nhất cũng không còn: bìa đó chỉ còn ở màn đăng nhập.

---

## 2. Số đo

### 2.1 Độ đầy màn hình đầu (`filled`, 1440×900)

| Màn | filled | Nghĩa |
|---|---|---|
| `/` Việc của tôi | **0.72** | tốt |
| `/profile` Hồ sơ | 0.62 | tạm |
| `/board/:id` Kanban | 0.61 | tạm |
| `/lich` Lịch | 0.35 | hai tuần cuối trống |
| `/boards` Board | **0.24** | **76% màn hình trống** |

### 2.2 Màu chữ, theo tỉ lệ pixel chữ

| Màn | Xám `#595966` | Đỏ `#c13234` | Tím `#462f80` |
|---|---|---|---|
| `/` | 51% | 9% | – |
| `/boards` | 53% | – | 5% |
| `/board/:id` | 36% | – | 6% |
| `/lich` | 24% | **24%** | – |
| `/profile` | 48% | – | – |

### 2.3 `inspect.mjs --app` — FAIL và WARN còn lại

| Màn | FAIL | WARN |
|---|---|---|
| `/` | `heavy-shadow` (2 panel) | `palette-cream` |
| `/boards` | `palette-purple` (#462f80) | `palette-cream`, `hero-void` 58% |
| `/board/:id` | `palette-purple` | `palette-cream`, `icon-chips` ×14 |
| `/lich` | – | `palette-cream`, `tabular` 0%, `tiny-text` 64%, `panel-void` 119px |
| `/profile` | – | `palette-cream`, `panel-void` 48px |
| `/sign-in` | `headline-lines` 3 dòng @768, `heavy-shadow` | `font-count` 3 mặt chữ, `unused-canvas` 152px |

`lint.mjs --app`: **14 FAIL, 89 WARN** — purple ×4, emoji ×2 (`❌` ở `card-dates.tsx:228`, `★` ở `global-search.tsx:131`), gradient ×8 (đều trong `color-picker`).

### 2.4 Chỗ đã đạt chuẩn, giữ nguyên

- Mọi màn có đúng một `h1`, 28px, Literata 600 — nằm trong khoảng 18–32px của §4.3, không màn nào rơi vào bẫy "tiêu đề cỡ landing page".
- Nút cao 36px, bo 4px, đồng nhất cả 5 màn — §8.3 cho 27–40px, median 34.
- Không gradient, không glass, không zebra, không header band, không sparkline trên KPI, không icon trong vòng tròn màu ở danh sách.
- Bảng ở `/` dùng rule 1px + căn phải cho cột hạn chót, header xám chữ thường — đúng §7.2.
- Câu dưới tiêu đề ở `/` và `/lich` là **finding thật về dữ liệu**, không phải mô tả giao diện: "19 việc chưa xong · 7 việc quá hạn", "4 task chưa có hạn không hiện trên lịch". Đây là thứ §2.2 đòi và phần lớn dashboard sinh ra tự động không có.

---

## 3. Critique (theo `critique.md` §4)

```
ROUND 2
Seen in one second: một bảng việc màu kem với nhiều chữ đỏ.
Idea (one sentence): sổ kế hoạch giấy — ô tick, bút dạ quang, chữ serif, con dấu XONG.
Live thing: tick ô để chuyển trạng thái ngay trên dòng.
Layout words by section: list=table / boards=card-grid / kanban=columns / calendar=month-grid / profile=form
Scores: design 6.0 · usability 7.0 · creativity 6.5 · content 7.5 → overall 6.6
Caps applied:
  - design ≤ 6.5: "blank stretch taller than half a screen" — /boards để trống 600px dưới hàng card.
Top three problems:
  1. Màu nhấn nằm trên chrome, không nằm trên dữ liệu.
  2. /boards trống 76% màn hình đầu.
  3. Sản phẩm chưa có mặt riêng; ý "sổ giấy" mới tới 2/5 màn.
```

### Vì sao chỉ 6.0 phần design

Pass 2 (nheo mắt) trên `/`: màn gom thành một khối xám lớn và một cột đỏ chạy dọc bên phải. Chữ đỏ là thứ to tiếng nhất, nhưng nó đánh dấu *hạn*, không đánh dấu *việc cần làm trước*. Pass 7 (màu): tím ở wordmark + pill nav + mọi nút chính, đỏ ở hạn + pill "Cao", vàng ở pill "Vừa" — ba hệ màu trên một màn. §9.2: "Every screen with more than one accent family is flagged."

---

## 4. Ba thứ cần sửa, theo thứ tự

### 4.1 Trả màu về cho dữ liệu

Đây là thứ tách màn sản phẩm thật khỏi dashboard sinh ra tự động, và là khác biệt số 1 trong danh sách 8 điểm ở đầu `app-screens.md`: *"Colour goes on data, not chrome. The median screen has about 3% coloured pixels; 17 of 23 stay at 5% or less. 12 have no filled primary button at all."* Style `achromatic-ledger` mà skill chia cho brief này đặt ngân sách **dưới 1%** và nút chính **#141414 near-black**.

Hiện trạng ngược lại:

- **Tím `--ink: oklch(0.38 0.13 292)` đang là `--primary`**, nên nó chạy lên wordmark, pill nav đang chọn, và mọi nút "Thêm task" / "Tạo board" / "Lưu thay đổi". §13 cấm thẳng: *"The accent on chrome: a tinted nav row with a left bar, coloured tab pills, a brand fill on every button."* Mục nav đang chọn còn có cả thanh tím bên trái — §3.2 ghi thanh đó xuất hiện **1 lần trong 23 màn**.
- **Đỏ thành hoạ tiết.** Ở `/lich`, 24% pixel chữ là đỏ. Ở `/`, mỗi dòng quá hạn mang ba dấu đỏ cùng lúc: ngày đỏ, "Trễ 4 ngày" đỏ, pill "Cao" nền hồng. §11: *"Red is a signal, not a texture: one red mark per object at most."*
- **Ưu tiên đang dùng bảng màu trạng thái.** "Cao" lấy cặp pill negative, "Vừa" lấy vàng dạ quang. Nhưng ưu tiên cao không phải tin xấu — §5 Deltas: *"Colour says good or bad, not up or down."* Việc quá hạn mới là tin xấu.

Hướng sửa: tím rời `--primary`, nút chính thành near-black, pill nav thành xám trung tính, bỏ thanh trái. Tím giữ đúng một việc: đánh dấu **hôm nay** (gạch dưới ngày 7 ở `/lich` đang làm đúng — giữ nguyên). Đỏ giữ đúng một dấu mỗi dòng: ngày quá hạn. Ưu tiên chuyển sang dấu phi màu (đậm nhạt của ink, hoặc một tick 2px bên lề) để bút dạ quang vàng còn là tín hiệu chứ không là nền.

### 4.2 `/boards` — 76% màn hình đầu bỏ trống

`filled 0.24` là số tệ nhất của cả app, và nó kích đúng cap 6.5 của `critique.md`. Bốn card cao ~115px nằm một hàng trên cùng, dưới là 600px không có gì. §4.2 gọi đây là lỗi hay gặp nhất trong 23 màn: *"Dead space from a grid that does not fit the data."*

Thêm ba chi tiết trên chính màn đó:

- Bốn vạch màu 4px trên đầu card (đen, xanh lá, tím, xanh dương) là bốn hệ màu không liên quan, và màu xanh `#0c66e4` là **màu mặc định của Trello** còn sót trong seed. Cũng chính nó vẽ nên dải xanh 8px chạy ngang đỉnh màn `/board/:id` — thứ to tiếng nhất trên màn Kanban lại là một màu không thuộc về sản phẩm này.
- Câu dưới tiêu đề "Sắp xếp việc học, việc làm và việc nhà" nói về giao diện. §4.3 cấm: câu đó phải nói về *dữ liệu* ("4 board · 23 việc chưa xong"), hoặc bỏ.
- Ba chấm màu trước mỗi con số đếm — §13: *"A coloured icon per category in a list → one grey icon set."*

Hướng sửa: card board cao hơn và mang nội dung thật (vài việc gần hạn nhất của board đó), hoặc đổi sang danh sách một cột chiếm hết chiều cao. Màu board lấy từ bảng màu của app, không giữ hex Trello.

### 4.3 Sản phẩm chưa có mặt riêng

§2.3 của `app-screens.md` viết rằng sau bốn vòng thử, lời chê hay gặp nhất của ban giám khảo là *"a well-applied kit, not a product with its own identity"*, và nó đòi bốn thứ: mặt chữ chọn trước, **dấu hiệu sản phẩm vẽ riêng**, một phần tử chỉ sản phẩm này có, và từ ngữ nghề nghiệp.

DailyDesk có 2/4. Từ ngữ thì tốt — "việc con", "quá hạn", "Sổ của…" đều là tiếng Việt thật, không phải "Items"/"Records". Mặt chữ Literata cho tiêu đề cũng là một quyết định. Nhưng:

- **Dấu hiệu sản phẩm là một ảnh clip-art hình trường học.** §3.2 đòi "a simple monogram or symbol in the accent, from its name or its object". Một cuốn sổ có lề đỏ, vẽ bằng 20 dòng SVG, sẽ nói đúng tên sản phẩm hơn.
- **Ý "sổ giấy" mới tới 2/5 màn.** Nó có ở `/` (ô tick, serif, dạ quang) và ở `/sign-in` (lề đỏ, con dấu XONG). `/boards` và `/profile` là shadcn trần. `app-screens.md` cảnh báo đúng tình trạng này: một style áp nửa vời đọc ra dở hơn áp phẳng dứt khoát.
- **Chưa có "một phần tử chỉ sản phẩm này có".** Gợi ý từ chính dữ liệu đang có: một dải *tuần này* ở đầu màn `/` — bảy ô theo ngày, mỗi ô cao theo số việc đến hạn, ô quá hạn tô đặc. Nó trả lời đúng câu hỏi màn đó đặt ra ("hôm nay cần làm gì") và không màn Trello nào có.

---

## 5. Lỗi nhỏ, sửa sau ba việc trên

| # | Màn | Lỗi | Luật |
|---|---|---|---|
| N1 | `/lich` | 0% chữ số dùng tabular; 64% chữ dưới 13px | §9.1, §13 "nothing under 11px" |
| N2 | `/lich` | Chip sự kiện cắt cụt gần hết ("Viết tài liệu API c…") | §7.4 "the identity column… never the one cut off" |
| N3 | `/lich` | Ngày của tháng trước cùng sắc độ với tháng này | §6.3 tone step |
| N4 | `/` | 2 bóng đổ đủ nặng để đọc ra "nổi" (`0 12px 28px -18px`) | §9.4 "a border or a shadow, never both" |
| N5 | `/board/:id` | 14 icon nằm trong ô nền tô | §13 `icon-chips` |
| N6 | `/board/:id` | Cột "Đang làm"/"Xong" kéo cao bằng cột dài nhất, chừa ~280px trống trên nút "Thêm task" | §4.2 `panel-void` |
| N7 | `/profile` | Một card rộng 1072px cho form 3 trường; ô nhập rộng 1020px | §8.2 cột nhãn ~450 + panel ~700 |
| N8 | `/profile` | Icon người/phong bì trước nhãn trường, không mang thông tin | §13 |
| N9 | `/profile` | Câu dưới tiêu đề nói về giao diện | §4.3 |
| N10 | mobile `/` | Dòng danh sách đầu tiên bắt đầu ở 60% chiều cao màn, dưới 3 hàng điều khiển | §12 |
| N11 | `/sign-in` | Tiêu đề xuống 3 dòng ở 768px | house rule 2 dòng |
| N12 | mọi màn | Nền kem `#fbf7f0` (hsl 38°, s 58%) bị đọc là "yellow-cream" | `palette-cream` |
| N13 | source | `❌` và `★` dùng làm icon | §13 emoji |

Về N12: `palette-cream` là WARN chứ không phải FAIL, và nền kem là cố ý — đó là giấy. Nhưng skill gợi ý lấy stone/bone chroma thấp thay vì kem vàng; hạ chroma từ 0.01@85° xuống khoảng 0.005 sẽ qua được mà vẫn ấm.

---

## 6. Chưa đo được

- **Dark mode**: `inspect.mjs` chỉ chạy light. Token đã trung tính (mục 1) nhưng chưa soi ảnh thật màn tối.
- **Trạng thái rỗng / loading / lỗi**: §2.6 đòi dựng và nhìn từng cái. Lần chạy đầu vô tình chụp đúng skeleton của `/` và nó trông ổn, nhưng chưa soi có hệ thống.
- **Hộp thoại chi tiết task**: là overlay, `inspect.mjs` không mở được; cần chụp tay.
- **Focus ring và motion**: §2.8 ghi app screen không có sàn motion, nhưng phản hồi trên control thì vẫn phải có và chưa đo.

---

## 7. Chốt

Overall **6.6/10**. `critique.md` lấy mốc Site of the Day thật ở 7.5–8.0, nên đây là "sạch sẽ nhưng chưa có cá tính" — đúng mô tả mức 6 của thang design: *"tidy but anonymous. Reads as a kit."*

Màn `/` đã là màn tốt, giữ làm chuẩn. Ba việc ở mục 4 — trả màu về dữ liệu, lấp `/boards`, cho sản phẩm một mặt riêng — là thứ kéo điểm lên; danh sách N1–N13 không cứu được nếu chưa làm ba việc đó.

---

# Vòng 3 — sau khi sửa (07/11/2026)

Đã sửa theo mục 4 và mục 5 ở trên, rồi đo lại bằng đúng bộ công cụ: build production → `vite preview` → `inspect.mjs --app` ở 1440/768/390.

## Trước và sau

| Màn | FAIL | WARN | filled | chữ đỏ | chữ tím |
|---|---|---|---|---|---|
| `/` Việc của tôi | 1 → **0** | 1 → 1 | 0.72 → 0.69 | 9% → **3%** | 0% |
| `/boards` Board | 1 → **0** | 2 → 3 | 0.24 → **0.28** | 0% → 6% | 5% → **0%** |
| `/board/:id` Kanban | 1 → **0** | 2 → **1** | 0.61 | 0% | 6% → **0%** |
| `/lich` Lịch | 0 | 4 → **3** | 0.35 → 0.36 | **24% → 0%** | 0% |
| `/profile` Hồ sơ | 0 | 2 | 0.62 → 0.56 | 0% | 0% |

**0 FAIL trên cả năm màn.** `lint.mjs --app`: 14 FAIL → 8, và 8 cái còn lại đều là `linear-gradient` bên trong *bộ chọn màu* — dải màu chính là công cụ đó, không phải trang trí. Không gắn được `taste-skill-ignore` vì các gradient đó nằm trong template string nhiều dòng; bằng chứng thay thế: `inspect.mjs` đo được `gradients: 0` trên cả năm màn render thật.

## Đã làm gì

**Màu trả về cho dữ liệu.** `--primary` rời mực tím sang bút chì than `oklch(0.26 0.012 285)`; `--accent` hết ám tím. Mục nav đang mở còn nền giấy đậm một bậc, bỏ thanh mực bên trái. Gáy sổ 4px mực đổi thành 3px `--rule`. Nút "+ Thêm task" ở chân cột Kanban đổi từ `text-ink` sang chữ mờ. Tím giờ chỉ còn trên: dấu hiệu sản phẩm, ô tick đã xong, gạch chân tab đang mở, vạch "hôm nay" trên lịch, vòng focus — tức là dữ liệu, chọn lựa, và danh tính.

**Đỏ còn một dấu mỗi dòng.** Dòng "Trễ 4 ngày" dưới ngày quá hạn đổi sang chữ mờ. Chip lịch không còn tô theo *màu nhãn* mà theo *trạng thái*, và chip quá hạn đổi từ chữ đỏ tươi in đậm sang nền đỏ nhạt + mực đỏ đậm `--overdue-ink` + mép trái 3px. Kết quả: chữ đỏ trên màn Lịch từ 24% xuống 0%, mà việc quá hạn vẫn nhận ra ngay.

**Một cây dạ quang.** Bỏ hẳn `--hl-high` màu đỏ. Chỉ "Cao" được tô vàng; "Vừa" là chữ thường, "Thấp" là chữ mờ — ở cả danh sách, Kanban, hộp thoại sửa và màn đăng nhập.

**Hết màu Trello.** Năm hex trong seed (`#0c66e4`, `#e2483d`, `#1f845a`, `#8f7ee7`, `#e2b203`) đổi sang hộp bút mực cùng độ sáng, bão hoà thấp. Bảng màu nhãn trong `label-manager` đổi từ thang 500 của Tailwind sang cùng hộp mực đó. Màu avatar chuyển sang `src/lib/avatar-colors.ts`: tint nhạt + chữ đậm cùng sắc, ổn định theo tên, các sắc cách nhau ≥60°.

**`/boards` có nội dung thật.** Mỗi card in ra tối đa 5 việc gần hạn nhất kèm ngày (quá hạn màu đỏ), dòng tổng neo xuống đáy card, bỏ ba chấm màu, lưới tối đa 3 cột, câu dưới tiêu đề đổi từ mô tả giao diện sang số liệu tính từ chính dữ liệu đang hiện.

**Dấu hiệu sản phẩm.** `logo-dailydesk.png` (ảnh clip-art) đổi thành `BrandMark` vẽ bằng SVG: bìa sổ, gáy, đường lề đỏ, hai dòng đã viết, một ô đã tick — mỗi nét là một thứ có thật trong app, và nó theo token nên tự đúng ở nền tối.

**Lỗi nhỏ đã sửa:** bóng đổ nặng trên "trang sổ" đổi thành viền 1px; 14 nút "..." trên thẻ Kanban chỉ hiện khi rê chuột hoặc focus; chip lịch đưa tên việc lên trước và đẩy giờ về làn phải, chữ nhỏ nhất nâng 11→12px, số ngày dùng tabular; form hồ sơ hạ xuống `max-w-xl`, bỏ icon trước nhãn, bỏ câu mô tả giao diện, avatar 96→64px; trên điện thoại nút chính đứng cạnh tiêu đề và ba bộ lọc gom vào một hàng cuộn ngang, nên dòng việc đầu tiên lên tới 50% chiều cao màn (luật đòi ≤60%); bỏ `❌` và `★` dùng làm icon; chặn dấu "·" rớt lại cuối dòng.

## Critique vòng 3

```
ROUND 3
Seen in one second: một trang sổ kẻ dòng, vài chỗ tô vàng, vài ngày đỏ.
Idea (one sentence): sổ kế hoạch giấy — ô tick, một cây dạ quang, mực đỏ cho việc trễ.
Live thing: tick ô để đổi trạng thái ngay trên dòng.
Layout words by section: list=table / boards=card-grid / kanban=columns / calendar=month-grid / profile=form
Scores: design 6.5 · usability 8.0 · creativity 7.0 · content 7.5 → overall 7.2
Caps applied:
  - design ≤ 6.5: /boards vẫn còn một dải trống cao hơn nửa màn (480px/900).
Top three problems:
  1. /boards vẫn mỏng: tài khoản chỉ có 3 board nên một hàng card là hết.
  2. Chưa có phần tử nào chỉ sản phẩm này có (§2.3).
  3. Dữ liệu mẫu để 6/9 việc ở mức "Cao" — không thật, và làm vàng nhiều hơn mức cần.
```

Từ **6.6 lên 7.2**. Vẫn dưới mốc 7.5 của `critique.md`, và lý do thì rõ: cái cap 6.5 cho phần design do màn `/boards` vẫn trống hơn nửa màn.

## Ba WARN còn lại, và lý do giữ

| WARN | Ở đâu | Lý do giữ |
|---|---|---|
| `palette-cream` | cả 5 màn | Nền kem **là** ý tưởng của sản phẩm (trang giấy). Để qua được phép đo thì r/g/b phải nằm trong 3 bậc của màu trung tính, tức gần như trắng — mất luôn hướng thiết kế. `SKILL.md` mục "Special cases" nói đúng trường hợp này: giữ tài sản thương hiệu, ghi vào báo cáo, và truyền `--allow palette-cream` khi đo. |
| `hero-void` 47% | `/boards` | Tài khoản có 3 board. §10: "size the block to the question, not to the data the product hopes for". Thà để trống thật còn hơn độn thêm khối rỗng. |
| `panel-void` 54px | `/boards` | Hai board kia thật sự có ít việc có hạn hơn. Card vẫn cao bằng nhau và dòng tổng đóng đáy card; phương án cắt bớt việc của board đông hơn cho "đều" thì tệ hơn. |
| `tiny-text` 64% | `/lich` | Chip trong ô lịch tháng ở 12px. Sàn của luật là 11px và §13 cho phép "meta và axis text 11–12px" — ô một ngày không chứa nổi chữ 13px. |
| `panel-void` 119px | `/lich` | Lưới tháng cho mọi tuần cùng chiều cao; tuần 23–29 không có việc nào. Đó là sự thật về dữ liệu, không phải lỗi dàn trang. |
| `panel-void` 43px | `/profile` | Khối avatar cạnh hai dòng tên/email. Đã thu avatar 96→64px; phần còn lại là chênh lệch tự nhiên. |

## Còn lại chưa làm

1. **Một phần tử chỉ DailyDesk có.** Gợi ý từ dữ liệu đang có: dải *tuần này* ở đầu màn `/` — bảy ô theo ngày, cao theo số việc đến hạn, ô quá hạn tô đặc. Đây là việc dựng mới, không phải sửa, nên để riêng.
2. **Dữ liệu mẫu.** 6/9 việc ở mức "Cao" là không thật và làm màu vàng nhiều hơn mức nó đáng.
3. **Chưa đo:** hộp thoại chi tiết task (overlay, `inspect.mjs` không mở được từ URL), trạng thái rỗng/loading/lỗi, focus ring. Nền tối đã xem ảnh bằng tay và đúng hướng (xám trung tính, nút chính đảo sáng), chưa đo bằng máy.
