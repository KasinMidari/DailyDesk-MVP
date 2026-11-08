# Feature Specification: Quản lý công việc cá nhân theo trạng thái (DailyDesk MVP)

**Feature Branch**: `001-personal-task-management`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Xây dựng MVP "Website quản lý công việc cá nhân" (DailyDesk) – quản lý task theo trạng thái. Yêu cầu theo đề (Project 2): đăng ký/đăng nhập cho nhiều người dùng độc lập (khuyến nghị social login – Google); thêm/sửa/xoá task gồm tiêu đề, mô tả, deadline, độ ưu tiên; đổi trạng thái Todo / Doing / Done; lọc và sắp xếp theo trạng thái hoặc deadline; README + video demo 1–2 phút. Tránh: kéo-thả phức tạp, realtime, làm việc nhóm. Tiêu chí chấm: chọn đúng phạm vi MVP, có Use Case/ERD; ít nhất 1 luồng chính chạy end-to-end, xử lý lỗi/validation cơ bản; có test case thủ công hoặc unit test cho logic chính; Git có lịch sử commit rõ ràng; có WBS/checklist theo ngày kèm Definition of Done; daily log; nhận diện rủi ro và cách ứng phó; README (mục tiêu, cách chạy, chức năng, hạn chế); giải thích quyết định kỹ thuật (DECISIONS.md); demo video/ảnh; nêu vấn đề thực tế cần giải quyết; ghi rõ phần "ngoài phạm vi"; phần tự đánh giá/Lessons Learned. Gợi ý: dữ liệu mock/localStorage/SQLite, deploy miễn phí (Vercel/Netlify/Render). Bối cảnh: frontend đã có (React, đang chạy dữ liệu mock trong DailyDesk_MVP/frontend); backend sẽ xây sau."

## Vấn đề cần giải quyết

Học sinh, sinh viên và nhân viên văn phòng thường ghi việc cần làm rải rác: trong sổ tay, tin nhắn tự gửi cho mình, hoặc ghi nhớ trong đầu. Kết quả là họ quên hạn nộp, không biết việc nào nên làm trước, và không nhìn ra việc nào đang dở dang. DailyDesk cho mỗi người một chỗ riêng để ghi lại công việc, đặt hạn chót và mức ưu tiên, rồi chuyển từng việc qua các trạng thái Todo → Doing → Done. Nhờ vậy họ luôn biết việc gì đang quá hạn và việc gì cần làm tiếp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng nhập và có không gian làm việc riêng (Priority: P1)

Người dùng mở website, đăng nhập bằng tài khoản Google, rồi vào thẳng danh sách công việc của chính mình. Lần đầu đăng nhập, hệ thống tự tạo tài khoản. Mỗi người chỉ nhìn thấy và thao tác được với dữ liệu của chính mình.

**Why this priority**: Đề bài yêu cầu nhiều người dùng độc lập. Không có đăng nhập và tách dữ liệu thì không có sản phẩm nào chạy được cho nhiều người.

**Independent Test**: Đăng nhập bằng hai tài khoản khác nhau, tạo task ở tài khoản A, rồi kiểm tra tài khoản B không thấy và không mở được task đó.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập, **When** truy cập bất kỳ trang nào của ứng dụng, **Then** họ thấy màn hình đăng nhập với một nút "Tiếp tục với Google" và không thấy dữ liệu nào.
2. **Given** người dùng đăng nhập Google lần đầu, **When** đăng nhập thành công, **Then** hệ thống tạo tài khoản mới và đưa họ tới danh sách công việc đang trống, kèm gợi ý tạo task đầu tiên.
3. **Given** tài khoản A có task "Nộp báo cáo", **When** tài khoản B đăng nhập hoặc thử mở trực tiếp đường dẫn tới task đó, **Then** B không thấy task và nhận thông báo "không tìm thấy".
4. **Given** người dùng đang đăng nhập, **When** bấm "Đăng xuất", **Then** phiên kết thúc và họ quay về màn hình đăng nhập.
5. **Given** phiên đăng nhập đã hết hạn, **When** người dùng thực hiện một thao tác, **Then** họ được đưa về màn hình đăng nhập kèm thông báo, và dữ liệu đã lưu trước đó không mất.

---

### User Story 2 - Thêm task và xem danh sách công việc (Priority: P1)

Người dùng thêm một task với tiêu đề (bắt buộc), mô tả, hạn chót và độ ưu tiên (Cao / Vừa / Thấp). Task mới có trạng thái Todo và xuất hiện ngay trong danh sách. Màn hình chính cho biết số việc chưa xong và số việc quá hạn.

**Why this priority**: Đây là luồng nghiệp vụ chính chạy end-to-end, phải có để đạt tiêu chí "Cài đặt & Chức năng".

**Independent Test**: Đăng nhập, thêm task chỉ có tiêu đề, rồi thêm task có đủ mọi trường. Cả hai phải xuất hiện đúng trong danh sách và vẫn còn sau khi tải lại trang.

**Acceptance Scenarios**:

1. **Given** người dùng ở danh sách công việc, **When** mở form "Thêm task", nhập tiêu đề rồi lưu, **Then** task mới hiện trong danh sách với trạng thái Todo, độ ưu tiên mặc định là Vừa và không có hạn chót.
2. **Given** form thêm task đang mở, **When** người dùng để trống tiêu đề rồi bấm lưu, **Then** task không được tạo và thông báo "Hãy nhập tiêu đề cho task." hiện ngay dưới ô tiêu đề.
3. **Given** form thêm task đang mở, **When** người dùng chọn hạn chót ở thời điểm đã qua, **Then** task không được tạo và thông báo "Hạn chót phải từ bây giờ trở đi." hiện dưới ô hạn chót.
4. **Given** người dùng có task với hạn chót đã qua và chưa xong, **When** xem danh sách, **Then** task đó được đánh dấu "Quá hạn" và được tính vào số việc quá hạn.
5. **Given** người dùng chưa có task nào, **When** mở danh sách, **Then** họ thấy trạng thái trống với lời giải thích và nút "Thêm task đầu tiên".

---

### User Story 3 - Đổi trạng thái Todo / Doing / Done (Priority: P1)

Từ danh sách, người dùng chuyển một task sang Todo, Doing hoặc Done bằng một menu chọn ngay trên dòng task, không cần kéo-thả. Danh sách cập nhật ngay, và dòng vừa đổi được làm nổi bật trong chốc lát để người dùng thấy thay đổi.

**Why this priority**: Quản lý task theo trạng thái là vấn đề chính của đề bài.

**Independent Test**: Chuyển một task Todo → Doing → Done, rồi kiểm tra số lượng ở từng tab trạng thái và kết quả vẫn đúng sau khi tải lại trang.

**Acceptance Scenarios**:

1. **Given** task ở trạng thái Todo, **When** người dùng chọn "Doing" trong menu trạng thái của task, **Then** task chuyển sang Doing, số đếm của tab Todo giảm 1, số đếm của tab Doing tăng 1, và có thông báo xác nhận.
2. **Given** task quá hạn, **When** người dùng chuyển nó sang Done, **Then** task không còn bị tính là quá hạn.
3. **Given** việc lưu thay đổi trạng thái thất bại (mất mạng hoặc máy chủ lỗi), **When** người dùng đổi trạng thái, **Then** họ thấy thông báo lỗi và task giữ nguyên trạng thái cũ.

---

### User Story 4 - Sửa và xoá task (Priority: P2)

Người dùng mở một task để sửa bất kỳ trường nào (tiêu đề, mô tả, hạn chót, độ ưu tiên, trạng thái). Khi xoá task, họ phải xác nhận trước. Ngay sau khi xoá, họ có thể bấm hoàn tác.

**Why this priority**: Hoàn thiện thao tác CRUD mà đề bài yêu cầu. Thiếu phần này thì luồng chính vẫn dùng được, nhưng chưa trọn vẹn.

**Independent Test**: Sửa tiêu đề và hạn chót của một task, kiểm tra thay đổi được lưu. Xoá task, bấm hoàn tác và kiểm tra task trở lại. Xoá lần nữa không hoàn tác và kiểm tra task biến mất sau khi tải lại trang.

**Acceptance Scenarios**:

1. **Given** một task đã có, **When** người dùng đổi tiêu đề rồi lưu, **Then** danh sách hiện tiêu đề mới và có thông báo "Đã lưu thay đổi".
2. **Given** task có hạn chót đã qua, **When** người dùng chỉ sửa tiêu đề mà không đổi hạn chót, **Then** việc lưu thành công. Quy tắc "hạn chót không được ở quá khứ" chỉ áp dụng khi hạn chót được nhập mới hoặc thay đổi.
3. **Given** người dùng bấm xoá một task, **When** hộp xác nhận hiện ra và họ chọn "Giữ lại", **Then** task không bị xoá.
4. **Given** người dùng vừa xác nhận xoá task, **When** bấm "Hoàn tác" trong thông báo, **Then** task được khôi phục với cùng tiêu đề, mô tả, hạn chót, độ ưu tiên và trạng thái.

---

### User Story 5 - Lọc, tìm kiếm và sắp xếp (Priority: P2)

Người dùng lọc task theo trạng thái (Tất cả / Todo / Doing / Done) và theo độ ưu tiên. Họ có thể tìm theo từ khoá trong tiêu đề hoặc mô tả, và sắp xếp theo hạn chót (gần nhất / xa nhất), theo độ ưu tiên hoặc theo ngày tạo. Khi sắp xếp theo hạn chót gần nhất, task được nhóm thành Quá hạn / Hôm nay / 7 ngày tới / Sau đó / Không có hạn.

**Why this priority**: Đề bài yêu cầu lọc và sắp xếp. Đây là phần giúp người dùng biết việc nào cần làm trước.

**Independent Test**: Với một bộ task mẫu có đủ trạng thái, độ ưu tiên và hạn chót, kiểm tra từng bộ lọc và kiểu sắp xếp cho đúng kết quả, kể cả khi không có kết quả nào.

**Acceptance Scenarios**:

1. **Given** có task ở cả ba trạng thái, **When** người dùng chọn tab "Doing", **Then** chỉ các task Doing được hiển thị.
2. **Given** có task có hạn và task không có hạn, **When** sắp xếp theo hạn chót (gần nhất hoặc xa nhất), **Then** task không có hạn luôn nằm cuối danh sách.
3. **Given** có task đã xong, **When** sắp xếp theo độ ưu tiên, **Then** task Done nằm sau mọi task chưa xong.
4. **Given** người dùng tìm "bao cao" (không dấu), **When** có task tên "Nộp báo cáo", **Then** task đó vẫn được tìm thấy.
5. **Given** bộ lọc không khớp task nào, **When** áp dụng bộ lọc, **Then** người dùng thấy thông báo "Không có task nào khớp bộ lọc" và nút "Xoá bộ lọc".
6. **Given** người dùng đã chọn bộ lọc và kiểu sắp xếp, **When** tải lại trang, **Then** bộ lọc và kiểu sắp xếp vẫn được giữ nguyên.

---

### User Story 6 - Xem task theo board và theo lịch (Priority: P3)

Người dùng có thể gom task vào các board, ví dụ "Đồ án SE100" hay "Việc cá nhân". Mỗi board có ba cột Todo / Doing / Done. Người dùng cũng có thể xem các task có hạn trên lịch tháng. Đây là chế độ xem phụ, đã có sẵn trong giao diện hiện tại. Mọi thao tác chính vẫn làm được từ danh sách task.

**Why this priority**: Giúp người dùng quen với Trello hay Google Calendar thấy dễ dùng hơn, nhưng không bắt buộc với đề bài. Nếu thiếu thời gian, phần này có thể cắt mà không ảnh hưởng luồng chính.

**Independent Test**: Tạo task trong một board, kiểm tra task hiện cả trong danh sách chính (có ghi tên board) lẫn trong board, và hiện đúng ngày trên lịch nếu có hạn chót.

**Acceptance Scenarios**:

1. **Given** người dùng có hai board, **When** lọc danh sách chính theo một board, **Then** chỉ task của board đó được hiển thị.
2. **Given** một task có hạn ngày 4/11, **When** mở lịch tháng 11, **Then** task hiện ở ô ngày 4.

---

### Edge Cases

- Tiêu đề chỉ gồm khoảng trắng được coi là trống. Tiêu đề dài quá 200 ký tự hoặc mô tả dài quá 2000 ký tự bị từ chối, kèm thông báo nêu rõ giới hạn.
- Ngày giờ không hợp lệ (ví dụ 31/2) bị từ chối khi nhập.
- Nếu người dùng chọn ngày hạn chót mà không chọn giờ, hạn chót được hiểu là cuối ngày đó (23:59).
- Mất mạng hoặc máy chủ lỗi khi tải danh sách: hiện thông báo lỗi dễ hiểu kèm nút "Thử lại", không để màn hình trắng.
- Mất mạng khi lưu: form vẫn giữ nội dung người dùng đã nhập, kèm thông báo lỗi để thử lại.
- Người dùng truy cập task không thuộc về mình qua đường dẫn: trả về "không tìm thấy" và không tiết lộ task đó có tồn tại hay không.
- Hai tab cùng sửa một task: lần lưu sau cùng được giữ, và tải lại trang sẽ thấy dữ liệu mới nhất.
- Danh sách có nhiều task (trên 200): lọc và sắp xếp vẫn phản hồi ngay.
- Tiêu đề rất dài hiển thị tối đa hai dòng trên màn hình hẹp, không làm vỡ bố cục.
- Đổi trạng thái một task trong lúc đang có bộ lọc theo trạng thái khác: task rời khỏi danh sách đang xem, và có thông báo xác nhận để người dùng biết.

## Requirements *(mandatory)*

### Functional Requirements

**Tài khoản và quyền riêng tư**

- **FR-001**: Hệ thống MUST cho phép người dùng đăng nhập bằng tài khoản Google và tự tạo tài khoản ở lần đăng nhập đầu tiên.
- **FR-002**: Hệ thống MUST chặn mọi trang và dữ liệu khi người dùng chưa đăng nhập.
- **FR-003**: Hệ thống MUST chỉ cho mỗi người dùng xem, sửa và xoá task của chính họ. Yêu cầu tới task của người khác phải nhận kết quả "không tìm thấy".
- **FR-004**: Người dùng MUST đăng xuất được bất kỳ lúc nào.

**Quản lý task**

- **FR-005**: Người dùng MUST tạo được task với tiêu đề (bắt buộc, 1–200 ký tự sau khi bỏ khoảng trắng đầu cuối), mô tả (không bắt buộc, tối đa 2000 ký tự), hạn chót (ngày và giờ, không bắt buộc) và độ ưu tiên (Cao / Vừa / Thấp, mặc định Vừa).
- **FR-006**: Task mới MUST có trạng thái Todo, trừ khi người dùng chọn trạng thái khác ngay trong form.
- **FR-007**: Hệ thống MUST từ chối hạn chót ở thời điểm đã qua khi tạo task, hoặc khi người dùng thay đổi hạn chót lúc sửa task.
- **FR-008**: Người dùng MUST sửa được mọi trường của task đã có.
- **FR-009**: Người dùng MUST xoá được task, sau khi xác nhận, và MUST hoàn tác được thao tác xoá ngay sau đó.
- **FR-010**: Người dùng MUST đổi được trạng thái task giữa Todo, Doing, Done ngay từ danh sách, chỉ với chọn từ menu, không cần kéo-thả.
- **FR-011**: Hệ thống MUST lưu bền vững mọi thay đổi, để dữ liệu còn nguyên sau khi tải lại trang, đăng xuất rồi đăng nhập lại, hoặc dùng trình duyệt khác.

**Xem, lọc và sắp xếp**

- **FR-012**: Hệ thống MUST hiển thị danh sách task cùng trạng thái, độ ưu tiên, hạn chót và board của từng task.
- **FR-013**: Hệ thống MUST đánh dấu "Quá hạn" cho task chưa xong có hạn chót đã qua, và hiển thị tổng số việc chưa xong cùng số việc quá hạn.
- **FR-014**: Người dùng MUST lọc được theo trạng thái (kèm số lượng ở mỗi trạng thái), theo độ ưu tiên và theo board.
- **FR-015**: Người dùng MUST tìm được task theo từ khoá trong tiêu đề hoặc mô tả, không phân biệt hoa thường và dấu tiếng Việt.
- **FR-016**: Người dùng MUST sắp xếp được theo hạn chót gần nhất, hạn chót xa nhất, độ ưu tiên cao trước, và mới tạo. Task không có hạn luôn nằm cuối khi sắp theo hạn. Task đã xong nằm sau task chưa xong trong mọi kiểu sắp xếp.
- **FR-017**: Danh sách task MUST là một danh sách phẳng theo đúng thứ tự sắp xếp đang chọn, không chia thành nhóm con. (Sửa 08/11/2026: bản đầu yêu cầu nhóm Quá hạn / Hôm nay / 7 ngày tới / Sau đó / Không có hạn / Đã xong; bỏ theo yêu cầu người dùng vì các tiêu đề nhóm cắt vụn danh sách. Việc quá hạn vẫn nhận ra được nhờ ngày in đỏ và bộ đếm "N việc quá hạn" ở đầu trang.)
- **FR-018**: Hệ thống MUST giữ bộ lọc và kiểu sắp xếp sau khi tải lại trang.

**Phản hồi và xử lý lỗi**

- **FR-019**: Hệ thống MUST hiển thị lỗi kiểm tra dữ liệu ngay dưới ô nhập bị sai, bằng tiếng Việt, nêu rõ cần sửa gì.
- **FR-020**: Hệ thống MUST có trạng thái riêng cho lúc đang tải, có lỗi (kèm nút thử lại), danh sách trống, và bộ lọc không có kết quả.
- **FR-021**: Hệ thống MUST xác nhận bằng thông báo ngắn mỗi khi thêm, sửa, đổi trạng thái hoặc xoá thành công.
- **FR-022**: Giao diện MUST dùng tiếng Việt và dùng được trên màn hình máy tính lẫn điện thoại (rộng từ 375px), không bị cuộn ngang.

**Chế độ xem phụ (P3)**

- **FR-023**: Người dùng SHOULD gom được task vào board và xem board theo ba cột Todo / Doing / Done.
- **FR-024**: Người dùng SHOULD xem được các task có hạn trên lịch tháng, với tuần bắt đầu từ Thứ 2.

### Project Deliverables (minh chứng theo tiêu chí chấm)

- **DL-001**: Repository MUST có lịch sử commit rõ ràng, ít nhất 5 commit có ý nghĩa, rải đều trong tuần làm việc.
- **DL-002**: MUST có sơ đồ Use Case và ERD cho phần cốt lõi (người dùng – task), kèm giải thích lý do chọn phạm vi.
- **DL-003**: MUST có danh sách test case thủ công có kết quả pass/fail, bao phủ: thêm, sửa, xoá, đổi trạng thái, lọc, sắp xếp, kiểm tra dữ liệu và tách dữ liệu giữa hai người dùng. SHOULD có unit test tự động cho logic lọc, sắp xếp và kiểm tra dữ liệu.
- **DL-004**: MUST có bảng chia việc (WBS) hoặc checklist theo ngày, mỗi việc kèm Definition of Done và mốc thời gian.
- **DL-005**: MUST có nhật ký hằng ngày ngắn gọn: hôm qua làm gì, hôm nay làm gì, đang vướng gì.
- **DL-006**: MUST nêu ít nhất một rủi ro đã gặp và cách ứng phó, trong log hoặc phần Lessons Learned.
- **DL-007**: README MUST nêu: vấn đề cần giải quyết, mục tiêu, cách cài đặt và chạy, các chức năng đã làm, hạn chế hiện tại, phần ngoài phạm vi, tự đánh giá (điểm mạnh, điểm yếu, nếu có thêm thời gian sẽ làm gì).
- **DL-008**: MUST có phần giải thích quyết định kỹ thuật, trong README hoặc DECISIONS.md.
- **DL-009**: MUST có video demo 1–2 phút hướng dẫn sử dụng luồng chính, hoặc bộ ảnh chụp màn hình tương đương.
- **DL-010**: SHOULD có bản chạy thật trên dịch vụ miễn phí để làm minh chứng.

### Key Entities *(include if feature involves data)*

- **Người dùng**: Người sở hữu dữ liệu. Thuộc tính: định danh từ Google, tên hiển thị, email, ngày tạo. Một người dùng có nhiều task và nhiều board.
- **Task**: Một việc cần làm. Thuộc tính: tiêu đề, mô tả, hạn chót (có thể trống), độ ưu tiên (Cao / Vừa / Thấp), trạng thái (Todo / Doing / Done), ngày tạo, ngày cập nhật. Mỗi task thuộc về đúng một người dùng và một board.
- **Board**: Nhóm task theo chủ đề, ví dụ một môn học hay một dự án. Thuộc tính: tên, màu. Thuộc về một người dùng. Mỗi người dùng có ít nhất một board mặc định để task luôn có chỗ thuộc về.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mới, chưa được hướng dẫn, đăng nhập và tạo được task đầu tiên trong vòng 60 giây.
- **SC-002**: Tạo một task chỉ có tiêu đề mất không quá 15 giây. Tạo task đủ tiêu đề, hạn chót và độ ưu tiên mất không quá 30 giây.
- **SC-003**: Đổi trạng thái một task cần tối đa 2 thao tác từ danh sách.
- **SC-004**: Kết quả lọc, tìm kiếm và sắp xếp hiện ra ngay khi người dùng thao tác (dưới 1 giây) với danh sách tới 200 task.
- **SC-005**: Trong kiểm thử với hai tài khoản, 100% task của tài khoản này không xem, sửa hay xoá được từ tài khoản kia.
- **SC-006**: 100% trường hợp nhập sai trong danh sách test case (tiêu đề trống, quá dài, hạn chót đã qua, ngày không hợp lệ) đều bị chặn và có thông báo tiếng Việt chỉ rõ cách sửa.
- **SC-007**: Ít nhất 4/5 người dùng thử (sinh viên hoặc nhân viên văn phòng) hoàn thành chuỗi "thêm → đổi trạng thái → lọc → xoá" ngay lần đầu, không cần hỏi.
- **SC-008**: Toàn bộ luồng chính (đăng nhập → thêm → sửa → đổi trạng thái → lọc/sắp xếp → xoá) được trình diễn trọn vẹn trong video không quá 2 phút.
- **SC-009**: Mọi test case thủ công của luồng chính đạt kết quả pass trước khi nộp bài.

## Assumptions

- Người dùng chính là học sinh, sinh viên và nhân viên văn phòng quản lý việc của bản thân, chủ yếu trên trình duyệt máy tính, đôi khi trên điện thoại.
- Đăng nhập chỉ dùng Google, theo khuyến nghị social login của đề bài. Không làm đăng ký bằng email và mật khẩu.
- Giao diện hiện có đã đáp ứng phần lớn yêu cầu hiển thị và đang chạy với dữ liệu giả. Phần còn lại chủ yếu là lưu dữ liệu thật và đăng nhập thật, giữ nguyên cách giao diện gọi dữ liệu.
- Trạng thái của task tương ứng với cột Todo / Doing / Done trong board của nó.
- Mỗi người dùng tự có một board mặc định để task tạo từ danh sách chính luôn có board.
- Thời gian dùng giờ địa phương của trình duyệt. Hiển thị ngày theo kiểu Việt Nam, ví dụ "T4, 4/11, 17:00".
- Độ ưu tiên mặc định là Vừa. Hạn chót chỉ có ngày thì hiểu là 23:59 ngày đó.
- Thời gian thực hiện là một tuần, một người làm. Phạm vi được chọn để luồng chính chạy ổn định thay vì làm nhiều chức năng dở dang.

### Ngoài phạm vi (Out of Scope)

- Làm việc nhóm: mời thành viên, chia sẻ board, giao task cho người khác. Phần này đã có trong giao diện cũ nhưng bị ẩn và không làm.
- Cập nhật realtime giữa nhiều thiết bị hoặc nhiều người.
- Kéo-thả phức tạp. Trên board có thể giữ kéo-thả sẵn có, nhưng mọi thao tác phải làm được mà không cần kéo-thả.
- Gửi email hoặc thông báo nhắc hạn, task lặp lại, đồng bộ Google Calendar.
- Trợ lý AI, tệp đính kèm lưu trên đám mây, ứng dụng di động riêng.
- Đăng ký bằng email và mật khẩu, quên mật khẩu.
