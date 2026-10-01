import { z } from "zod";

import type { Course } from "@/lib/types";

export const MAX_DESCRIPTION = 100;
export const MAX_INSTRUCTORS = 3;

export const courseFormSchema = z.object({
    courseId: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "รหัสวิชาต้องเป็นตัวเลข 6 หลัก"),

    courseTitle: z
        .string()
        .trim()
        .min(1, "กรอกชื่อวิชา")
        .max(100, "ชื่อวิชายาวได้ไม่เกิน 100 ตัวอักษร"),

    instructors: z
        .array(
            z.object({
                name: z.string().trim().min(1, "กรอกชื่อผู้สอน"),
                email: z
                    .string()
                    .trim()
                    .pipe(
                        z
                            .email("อีเมลไม่ถูกต้อง")
                            .refine(
                                (v) => v.toLowerCase().endsWith("@cmu.ac.th"),
                                "ต้องเป็นอีเมล @cmu.ac.th",
                            ),
                    ),
            }),
        )// Array Validation: ตรวจทั้งรายการ
        .min(1, "ต้องมีผู้สอนอย่างน้อย 1 คน")
        .max(MAX_INSTRUCTORS, `มีผู้สอนได้ไม่เกิน ${MAX_INSTRUCTORS} คน`)
        .refine(
            (items) =>
                new Set(items.map((i) => i.email.toLowerCase())).size === items.length,
            "อีเมลผู้สอนซ้ำกัน",
        ),

    program: z.enum(["CPE", "ISNE"], { message: "เลือกหลักสูตร" }),

    semester: z.enum(["1", "2", "3"], { message: "เลือกภาคการศึกษา" }),

    description: z.string().max(MAX_DESCRIPTION, `รายละเอียดยาวได้ไม่เกิน ${MAX_DESCRIPTION} ตัวอักษร`),

    notifyByEmail: z.boolean(),
});

// ได้ type จาก schema ตรงๆ — ไม่ต้องประกาศ StudentFormValues ซ้ำเอง
export type CourseFormValues = z.infer<typeof courseFormSchema>;

/**
 * กันรหัสซ้ำด้วย .refine()
 * ต้องสร้าง "ข้างใน" component (ผ่าน useMemo) เพราะต้องรู้ students ล่าสุดจาก store
 */
export function createCourseFormSchema(existingCourses: Course[]) {
    return courseFormSchema.extend({
        courseId: courseFormSchema.shape.courseId.refine(
            (id) => !existingCourses.some((c) => c.courseId === id),
            "รหัสวิชานี้มีอยู่แล้ว",
        ),
    });
}

// .extend({ ...}) คือ สร้าง schema ใหม่โดยคัดลอกของเดิมทั้งหมด
// แล้วทับเฉพาะ key ที่ระบุ ในวงเล็บ ในที่นี้ทับแค่ courseId ช่องอื่น(courseTitle, instructors, program ฯลฯ) คงเดิม

// .extend ไม่แก้ courseFormSchema ต้นฉบับ แต่สร้างตัวใหม่ให้
//courseFormSchema.shape.courseId

// .shape คือ object ที่เก็บ schema ของแต่ละช่องไว้ข้างใน
//     .shape.courseId จึงเป็นกฎเดิมของรหัสวิชา คือ z.string().trim().regex(/^\d{6}$/, ...)
// เราหยิบกฎเดิมมา แล้วต่อกฎใหม่ท้ายมัน ไม่ต้องเขียน regex ซ้ำ

//.refine(ฟังก์ชันตรวจ, ข้อความ error)
// .refine คือการเพิ่มกฎแบบกำหนดเองต่อท้าย รับ 2 อย่าง คือฟังก์ชันที่คืน true(ผ่าน) หรือ false(ไม่ผ่าน) กับข้อความที่จะแสดงเมื่อไม่ผ่าน
// กฎนี้จะทำงานต่อจาก regex ถ้ารหัสไม่ใช่ตัวเลข 6 หลัก จะขึ้น "รหัสวิชาต้องเป็นตัวเลข 6 หลัก" ก่อน และถ้าผ่านแล้วค่อยเช็คว่าซ้ำไหม
//     (id) => !existingCourses.some((c) => c.courseId === id)
// อ่านจากในออกนอก:

// (id) => คือฟังก์ชันที่รับค่าที่ผู้ใช้กรอก(หลัง trim แล้ว) ชื่อ id
// c.courseId === id เทียบว่าวิชา c ตัวหนึ่งมีรหัสตรงกับที่กรอกไหม
//     .some(...) คือถามว่ามี อย่างน้อยหนึ่งวิชา ในรายการที่ตรงเงื่อนไขไหม ได้ true ถ้ามีที่ซ้ำ
// !คือกลับค่า ซ้ำ(true) กลายเป็น false = ไม่ผ่าน ไม่ซ้ำ(false) กลายเป็น true = ผ่าน