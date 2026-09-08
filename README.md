# AP CSP 2027 · Lesson 01

第一份教学样稿：Bits, Binary, and Representation。90 分钟，23 页课堂 Slides。

[在线课堂](https://wenatnyu.github.io/ap-csp-2027/) · [总体目录与教学安排](COURSE_PLAN.md)

## 使用

直接用浏览器打开 `AP_CSP_L01_Bits_and_Binary.html`。

- **Slides**：英文课堂正文，关键词中文提示，答案逐题展开。左右方向键或 Page Up / Page Down 翻页，N 打开教师备注。
- **Homework**：12 题、30 分、约 40 分钟。行内答案与评分标准；可以打印题目或打印答案。
- **Teacher Guide**：教学节奏、考纲对应、分层与补救建议、2027 备考进度草案、官方资料入口。
- **Reading view**：适合小屏阅读；**Fullscreen**：适合投影。

文件中的课堂与作业功能均可离线运行，无需安装软件或联网加载字体。打开官方样题和 PDF 时，须保留 `resources`、`output` 文件夹与 HTML 的相对位置。若 PDF 阅读器没有自动跳页，在官方 CED 中输入 PDF 页码 182（原题）、194（答案）。

## 打印资料

- `output/pdf/AP_CSP_L01_Homework.pdf`：3 页 A4 黑白学生卷，保留作答空间。
- `output/pdf/AP_CSP_L01_Answer_Key.pdf`：2 页教师答案与逐分评分标准。

精确的三页作业版式请使用学生 PDF；浏览器直接打印的页数可能随纸张、缩放与页眉页脚设置变化。

## 范围与题源

本课为自定教学顺序的 Lesson 01，对应官方 Big Idea 2 / Topic 2.1 的部分内容：DAT-1.A.2–A.7、DAT-1.B.1–B.3、DAT-1.C.a/C.b。模拟数据与采样等后续内容未在本课展开。

第 20 页引用 College Board CED 公开样题 Q2（正文 p.175；PDF p.182），官方答案 A（正文 p.187；PDF p.194）。它是公开样题，不是某年实考真题。其余课堂与作业题均为原创；作业书面题不是官方 Create written-response 试题。作业分数不对应 AP 最终分数。

官方 CED 保留原文件和版权信息。当前考试要求核查于 2026-09-08，来源见 Teacher Guide。2027-05-14 为考试日期；Create 官方截止 2027-04-30 23:59 ET。备课中仍应复核后续官方更新。

## 后续修改

内容源文件位于 `scripts/slides.json`、`scripts/teacher-guide.html`、`lesson-exercises.json`，样式与交互位于 `scripts/lesson.css`、`scripts/runtime.js`。

```sh
python3 scripts/build_lesson.py
python3 scripts/build_homework_pdf.py
```

本次仅完成第一课，后续课次待确认本样稿后继续。

GitHub Pages 使用 `main` 分支的根目录；`index.html` 与第一课页面由同一构建脚本生成。
