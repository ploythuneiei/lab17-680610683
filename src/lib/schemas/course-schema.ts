import { z } from "zod";

import type { Course } from "@/lib/types";

export const MAX_EMAILS = 3;
export const MAX_DESCRIPTION = 100;
export const MAX_INSTRUCTORS = 3;

export const courseFormSchema = z.object({
    courseId: z
        .string()
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
export type CouresFormValues = z.infer<typeof courseFormSchema>;

/**
 * กันรหัสซ้ำด้วย .refine()
 * ต้องสร้าง "ข้างใน" component (ผ่าน useMemo) เพราะต้องรู้ students ล่าสุดจาก store
 */
export function createCourseFormSchema(existingCourses: Course[]) {
    return courseFormSchema.refine(
        (data) => !existingCourses.some((s) => s.courseId === data.courseId),
        { message: "รหัสวิชานี้มีอยู่แล้ว", path: ["courseId"] },
    );
}
