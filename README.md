# AP CSP 2026–27 · Chapter 1

第一章 **Computing & Representation（计算思维与信息表示）** 已完成：4 节课，每节 90 分钟，共 92 页课堂 Slides，面向 2027 年 5 月 AP CSP 大考。

**[在线章节目录](https://wenatnyu.github.io/ap-csp-2027/)** · [总体课程规划](COURSE_PLAN.md) · [下载整章离线包](https://wenatnyu.github.io/ap-csp-2027/AP_CSP_Chapter_1_Teaching_Pack.zip)

| 课次 | 内容 | 课堂页面 | 学生卷 / 答案 |
|---|---|---|---|
| L01 | 信息表示、二进制、容量与数值限制 | [Bits & Binary](AP_CSP_L01_Bits_and_Binary.html) | [学生 PDF](output/pdf/AP_CSP_L01_Homework.pdf) / [答案 PDF](output/pdf/AP_CSP_L01_Answer_Key.pdf) |
| L02 | 计算创新、目的与功能、输入与输出 | [Computing Innovations](AP_CSP_L02_Computing_Innovations.html) | [学生 PDF](output/pdf/AP_CSP_L02_Homework.pdf) / [答案 PDF](output/pdf/AP_CSP_L02_Answer_Key.pdf) |
| L03 | 算法、变量、赋值、顺序与程序追踪 | [Variables & Sequence](AP_CSP_L03_Variables_and_Sequence.html) | [学生 PDF](output/pdf/AP_CSP_L03_Homework.pdf) / [答案 PDF](output/pdf/AP_CSP_L03_Answer_Key.pdf) |
| L04 | 协作、需求、测试、调试与改进；章末检查 | [Test & Improve](AP_CSP_L04_Test_and_Improve.html) | [学生 PDF](output/pdf/AP_CSP_L04_Homework.pdf) / [答案 PDF](output/pdf/AP_CSP_L04_Answer_Key.pdf) |

## 课堂使用

从在线目录进入每课，或解压整章包后用浏览器打开 `index.html`。课堂与编程功能均可离线运行，无需安装软件。保持整个文件夹结构，PDF 链接才能正常打开；外部官方来源与 GitHub 链接需要联网。

- **Slides**：英文正文、关键术语中文提示，答案逐题展开；方向键或 Page Up / Page Down 翻页，N 显示教师备注。
- **Homework**：每课 12 题、30 分，约 35–40 分钟；课堂讲评可以逐题展开答案。L04 作业作为整章检查。
- **Teacher Guide**：目标、节奏、考纲对应、常见误区、分层支持和活动建议。
- **Reading view**：适合小屏阅读；Fullscreen 适合投影。
- **打印版**：L01–02 学生卷各 3 页，L03–04 各 4 页；每课答案各 2 页。使用 PDF 保留稳定的黑白版式和作答空间。

## 编程与章末项目

打开 [Chapter 1 Programming Lab](Chapter_1_Programming_Lab.html)。支持编辑、逐行运行、完整运行、输入队列、输出与变量追踪，以及保存代码。

该教学工具支持 AP 伪代码的有限子集：赋值、变量、数值运算、`INPUT()` 和 `DISPLAY()`；尚不支持条件、循环、列表或自定义过程。输入队列只接收数值。每次 DISPLAY 为便于阅读另起一行；AP 参考表中的 DISPLAY 通常在值后跟一个空格。工具使用浏览器的有限数值表示，不模拟 AP 参考表的整数容量。

第 4 课项目 Ticket Total：有效输入为 1–50 的整数票数，每张票 12，每单手续费 3，输出总价。学生先预测，再运行，记录测试证据、反馈与修改。

[项目记录单 PDF](output/pdf/AP_CSP_Chapter_1_Project_Sheet.pdf) 共 2 页，可直接打印。该项目是基础练习，**不是正式 Create 任务，也不满足正式 Create 的全部要求**。

## 覆盖与题源

本章是自定教学顺序，选取官方 Data、Creative Development 和 Algorithms and Programming 的部分内容，不等同于完整的官方 Big Idea。精确学习目标代码、范围和资料链接在各课 Teacher Guide。

L02–04 的题目均为原创 AP 风格练习及课堂书面题，不是官方真题或官方 Create written-response 题。L01 第 20 页另行标出 College Board CED 公开样题 Q2（正文 p.175；PDF p.182），答案见正文 p.187／PDF p.194。教师自定分数不对应 AP 最终分数。

官方 CED 原文件保留在 `resources/`。根据 [College Board 课程变更表](https://apcentral.collegeboard.org/courses/how-ap-develops-courses-and-exams/course-changes-overview)，2026–27 学年使用 Fall 2023 CED；计划中的下一次课程修订适用于 2027–28。核查于 2026-09-09。

## 修改、构建与发布

L01 原始内容在 `scripts/slides.json`、`scripts/teacher-guide.html`、`lesson-exercises.json`；L02–04 内容在 `lessons/L02` 至 `lessons/L04`。通用页面、样式与运行逻辑在 `scripts/`。

生成全部课件、PDF 与离线包（Python 需安装 `reportlab`）：

```sh
python3 scripts/build_chapter.py
```

验证编程工具核心逻辑：

```sh
node scripts/verify_lab.cjs
```

`main` 保存课程源文件；GitHub Pages 发布源是 `gh-pages` 根目录。修改、生成并检查后，将 `main` 的提交同步到 `gh-pages`，通过 **GitHub Desktop** 推送即可更新在线课堂。网站首页现在是章节目录；第一课原文件链接继续有效。

目前完成第一章，后续章节尚未制作。
