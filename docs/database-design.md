# 数据库模型与高级特性设计

本文档详细说明教务选课系统的数据库概念模型、物理表结构、关系完整性约束、事务并发控制机制及 SQLite 特色实现。

---

## 1. 概念模型与 E-R 关系

系统包含 8 个核心业务实体，整体满足关系数据库第三范式 (3NF)：

```text
+-------------------+       +-----------------------+       +-------------------+
|      USERS        |----<  |       STUDENTS        |----<  |    ENROLLMENTS    |
| (账号体系/权限)   |       | (学号/专业/总学分)    |       | (选课记录/选课状态) |
+-------------------+       +-----------------------+       +-------------------+
          |                                                           |
          |                 +-----------------------+                 |
          +--------------<  |       TEACHERS        |                 |
                            | (工号/院系/职称)      |                 |
                            +-----------------------+                 |
                                        |                             |
                                        v                             v
+-------------------+       +-----------------------+       +-------------------+
|      COURSES      |----<  |   COURSE_OFFERINGS    |----<  |      GRADES       |
| (课程代码/学分/库)|       | (班级/学期/最大容量)  |       | (成绩/绩点/评语)  |
+-------------------+       +-----------------------+       +-------------------+
          |                             |
          v                             v
+-------------------+       +-----------------------+
|   PREREQUISITES   |       |      TIME_SLOTS       |
| (先修课程前置依赖)|       | (星期/开始节次/结束节)|
+-------------------+       +-----------------------+
```

---

## 2. 物理表结构与约束设计

### 2.1 用户表 (`users`)
- `id`: TEXT PRIMARY KEY
- `username`: TEXT UNIQUE NOT NULL
- `password_hash`: TEXT NOT NULL
- `role`: TEXT NOT NULL CHECK(role IN ('STUDENT', 'TEACHER', 'ADMIN'))
- `created_at`: INTEGER NOT NULL (UNIX 时间戳)

### 2.2 学生扩展表 (`students`)
- `id`: TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
- `student_no`: TEXT UNIQUE NOT NULL
- `real_name`: TEXT NOT NULL
- `department`: TEXT NOT NULL
- `class_name`: TEXT NOT NULL
- `enrolled_credits`: REAL DEFAULT 0.0 CHECK(enrolled_credits >= 0)

### 2.3 教师扩展表 (`teachers`)
- `id`: TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
- `teacher_no`: TEXT UNIQUE NOT NULL
- `real_name`: TEXT NOT NULL
- `department`: TEXT NOT NULL
- `title`: TEXT NOT NULL

### 2.4 课程库基础表 (`courses`)
- `id`: TEXT PRIMARY KEY
- `code`: TEXT UNIQUE NOT NULL (例如 `CS101`)
- `name`: TEXT NOT NULL
- `credits`: REAL NOT NULL CHECK(credits > 0 AND credits <= 10)
- `department`: TEXT NOT NULL
- `description`: TEXT

### 2.5 教学班开课计划表 (`course_offerings`)
- `id`: TEXT PRIMARY KEY
- `course_id`: TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT
- `teacher_id`: TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT
- `semester`: TEXT NOT NULL (例如 `2026-秋季`)
- `max_capacity`: INTEGER NOT NULL CHECK(max_capacity > 0)
- `current_capacity`: INTEGER NOT NULL DEFAULT 0 CHECK(current_capacity >= 0 AND current_capacity <= max_capacity)
- `classroom`: TEXT NOT NULL

### 2.6 排课时间段明细表 (`time_slots`)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `offering_id`: TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE
- `day_of_week`: INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7) (1 代表周一)
- `start_period`: INTEGER NOT NULL CHECK(start_period BETWEEN 1 AND 12)
- `end_period`: INTEGER NOT NULL CHECK(end_period >= start_period AND end_period <= 12)
- `week_type`: TEXT NOT NULL DEFAULT 'ALL' CHECK(week_type IN ('ALL', 'ODD', 'EVEN'))

### 2.7 选课关系表 (`enrollments`)
- `id`: TEXT PRIMARY KEY
- `student_id`: TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE
- `offering_id`: TEXT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE
- `status`: TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DROPPED'))
- `enrolled_at`: INTEGER NOT NULL
- 复合唯一约束：`UNIQUE(student_id, offering_id)` 防止同一学生重复选修相同教学班。

### 2.8 成绩单评定表 (`grades`)
- `enrollment_id`: TEXT PRIMARY KEY REFERENCES enrollments(id) ON DELETE CASCADE
- `score`: REAL CHECK(score IS NULL OR (score >= 0 AND score <= 100))
- `grade_point`: REAL CHECK(grade_point IS NULL OR (grade_point >= 0 AND grade_point <= 5.0))
- `submitted_at`: INTEGER

---

## 3. 高级业务与并发一致性保证

### 3.1 抢课并发控制与原子防超卖
在高并发选课场景下，利用 SQLite 独占事务与行级条件更新实现绝对一致性：

```sql
-- 开启事务
BEGIN IMMEDIATE TRANSACTION;

-- 原子递增当前选课人数，条件是人数未达到容量上限
UPDATE course_offerings 
SET current_capacity = current_capacity + 1 
WHERE id = ? AND current_capacity < max_capacity;

-- 在程序层判断受影响行数 (affectedRows)
-- 若 affectedRows === 0 则抛出异常并 ROLLBACK，否则执行 INSERT enrollments
```

### 3.2 课表时间冲突检测算法
选课前需判定新选课程的时间片是否与已选有效课程重叠：

```sql
SELECT s.id 
FROM enrollments e
JOIN time_slots s ON s.offering_id = e.offering_id
WHERE e.student_id = :student_id 
  AND e.status = 'ACTIVE'
  AND s.day_of_week = :target_day
  AND (s.week_type = 'ALL' OR :target_week_type = 'ALL' OR s.week_type = :target_week_type)
  AND NOT (:target_end_period < s.start_period OR :target_start_period > s.end_period);
```
若查询命中行数大于 0，说明存在上课时间重叠冲突，系统提前拦截并输出精确冲突时间。

### 3.3 SQLite 视图与触发器实现
- **学生完整周课表视图 (`v_student_timetable`)**：跨 4 表联合，直接产出按星期和节次排序的日历数据。
- **成绩与加权绩点计算视图 (`v_student_gpa`)**：根据各门课学分自动加权计算累计 GPA。
- **审计日志触发器 (`trg_enrollment_audit`)**：记录退课与选课操作的时间、操作人与前后状态。
