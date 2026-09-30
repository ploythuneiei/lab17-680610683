//Zod คือ Library ตัวหนึ่ง ที่มีหน้าที่ให้เราเขียน "กฎ" ขึ้นมาเพื่อตรวจเช็คข้อมูล(Validation)
import { z } from "zod";

import type { Student } from "@/lib/types";

export const MAX_INTERESTS = 3;
export const MAX_EMAILS = 3;

// ใช้ร่วมกันระหว่างฟอร์ม (Checkbox) กับตารางจัดการนักศึกษา (แสดง label)
export const interestOptions = [
  { id: "web", label: "Web Development" },
  { id: "mobile", label: "Mobile Application" },
  { id: "ai", label: "AI / Machine Learning" },
  { id: "network", label: "Network & Security" },
];

//Schema คือ ก้อนข้อมูล/วัตถุ (Object) ที่เก็บรวบรวมกฎเกณฑ์ทั้งหมดเอาไว้
// ข้อมูลข้างในต้องหน้าตาแบบไหน มีเงื่อนไขอะไรบ้าง ถึงจะถูกต้องและผ่านเกณฑ์
export const studentFormSchema = z.object({
  studentId: z
    .string()
    .trim() //ตัดช่องว่างส่วนเกินออก ทั้งหน้าหลัง
    .regex(/^\d{9}$/, "รหัสนักศึกษาต้องเป็นตัวเลข 9 หลัก"),
  //(Slash ตัวแรกและตัวสุดท้าย): เป็นตัวครอบบอกขอบเขตของ Regular Expression ว่าช่วงนี้คือรูปแบบที่เราจะเช็ค
  //^ : หมายถึง "จุดเริ่มต้นของข้อความ" (บังคับว่าต้องเริ่มตรงนี้เป๊ะๆ ห้ามมีอะไรนำหน้า)
  //\d : ย่อมาจาก Digit หมายถึง "ตัวเลข 0 ถึง 9 เท่านั้น" (ถ้าพิมพ์ตัวอักษรภาษาอังกฤษหรืออักขระพิเศษ จะถือว่าผิดทันที)
  //{9} : หมายถึง "ต้องมีจำนวนความยาวพอดีเป๊ะๆ 9 ตัว"
  //$ : หมายถึง "จุดสิ้นสุดของข้อความ" (บังคับว่าต้องจบตรงนี้พอดี ห้ามมีตัวอักษรอื่นเกินมาต่อท้าย)

  //"กรอกชื่อ": คือข้อความแจ้งเตือน (Error Message) ที่จะแสดงให้ผู้ใช้เห็น เมื่อข้อมูลไม่ผ่านเงื่อนไข (เช่น ช่องนั้นว่างเปล่า)
  firstName: z.string().trim().min(1, "กรอกชื่อ"),
  lastName: z.string().trim().min(1, "กรอกนามสกุล"),
  //enum คือ รับค่าได้แค่ "CPE" หรือ "ISNE" เท่านั้น เป็นการกำหนดข้อความแจ้งเตือน (Error Message) กรณีที่ผู้ใช้ไม่ได้เลือกค่า หรือค่าที่ส่งมาไม่ตรงกับ "CPE" หรือ "ISNE" ให้แสดงคำว่า "เลือกหลักสูตร"
  program: z.enum(["CPE", "ISNE"], { message: "เลือกหลักสูตร" }),
  // Checkbox หลายตัว → array ของ id
  interests: z
    //ความหมาย: บอกว่าข้อมูลในฟิลด์ interests นี้จะต้องเก็บอยู่ในรูปแบบ "อาร์เรย์ (Array) ของสตริง"
    .array(z.string())
    .min(1, "เลือกความสนใจอย่างน้อย 1 ด้าน")
    .max(MAX_INTERESTS, `เลือกได้ไม่เกิน ${MAX_INTERESTS} ด้าน`),
  // Array Fields (useFieldArray) — array ของ object เพื่อให้แต่ละแถวมี field.id เป็น key
  emails: z
    //z.array(...): บอกว่าข้อมูลในฟิลด์ emails นี้เก็บเป็น "อาร์เรย์ (อาเรย์ของ Object)" เพราะผู้ใช้สามารถกรอกอีเมลได้หลายช่อง
    .array(
      //z.object({ address: ... }): ในแต่ละช่อง (แต่ละแถว) ของอาเรย์ จะต้องเป็น Object ที่มีหน้าตาแบบนี้: { address: "ข้อความอีเมล" }
      z.object({
        //z.email("อีเมลไม่ถูกต้อง"): Zod จะวิ่งเช็คทีละแถวทีละช่องเลยว่า ข้อความในฟิลด์ address ของแต่ละแถวมีรูปแบบเป็นอีเมลที่ถูกต้องหรือไม่ 
        // (เช่น มีเครื่องหมาย @, มีโดเมน) ถ้าพิมพ์มามั่วๆ (เช่น พิมพ์แค่ abc) จะแจ้งเตือนว่า "อีเมลไม่ถูกต้อง" ทันที
        address: z.email("อีเมลไม่ถูกต้อง"), // ← ตรวจทีละแถว
      }),
    )
    // ─── Array Validation: ตรวจทั้งรายการ ───
    .min(1, "ต้องมีอีเมลอย่างน้อย 1 อีเมล")
    .max(MAX_EMAILS, `มีอีเมลได้ไม่เกิน ${MAX_EMAILS} อีเมล`)
    .refine(
      (items) =>
        new Set(items.map((i) => i.address.toLowerCase())).size ===
        items.length,
      "อีเมลซ้ำกัน",
    ),
  //items.map((i) => i.address.toLowerCase()): ดึงค่าอีเมลจากทุกๆ แถวออกมา แล้วแปลงเป็นตัวพิมพ์เล็กทั้งหมด (toLowerCase)
  // เพื่อป้องกันปัญหาคนพิมพ์ตัวใหญ่วนซ้ำกับตัวเล็ก (เช่น Test@gmail.com กับ test@gmail.com ถือว่าเป็นตัวเดียวกัน)
  //new Set(...): โครงสร้างข้อมูลแบบ Set ใน JavaScript มีคุณสมบัติพิเศษคือ มันจะตัดค่าที่ซ้ำกันออกให้อัตโนมัติ เหลือเก็บไว้เฉพาะค่าที่ไม่ซ้ำกันเลย
  //   .size === items.length:
  //   เอาขนาดความยาวของ Set(หลังตัดตัวซ้ำทิ้งแล้ว) มาเทียบกับจำนวนอีเมลทั้งหมด(items.length)
  // ถ้าไม่ซ้ำกันเลย: ขนาดของ Set จะเท่ากับความยาวเดิมพอดีเป๊ะ(===) เงื่อนไขเป็นจริง(ผ่าน)
  // ถ้ามีอีเมลซ้ำกัน: Set จะทำการยุบรวมตัวที่ซ้ำกัน ทำให้ขนาดความยาว(size) น้อยกว่า จำนวนอีเมลทั้งหมด(items.length) เงื่อนไขกลายเป็นเท็จ
});

// ได้ type จาก schema ตรงๆ — ไม่ต้องประกาศ StudentFormValues ซ้ำเอง
export type StudentFormValues = z.infer<typeof studentFormSchema>;
//z.infer: เป็นคำสั่งมหัศจรรย์ของ Zod (ย่อมาจาก TypeScript Inference) ที่แปลว่า "ให้ Zod ช่วยแกะรอยดูโครงสร้างทั้งหมดใน schema แล้วแปลงร่างออกมาเป็น TypeScript Type ให้หน่อย"
//typeof studentFormSchema: เป็นการบอกว่าให้เอาโครงสร้างของ studentFormSchema ที่เราเพิ่งเขียนกติกาทั้งหมดด้านบนมาเป็นต้นแบบ
//ผลลัพธ์ที่ได้คืออะไร? มันจะสร้าง Type(หรือ Interface) ออกมาให้เราแบบอัตโนมัติ โดยที่เราไม่ต้องมานั่งพิมพ์ประกาศ Type เองเลย ซึ่ง Type ที่ Zod แปลงออกมาให้

/**
 * กันรหัสซ้ำด้วย .refine()
 * ต้องสร้าง "ข้างใน" component (ผ่าน useMemo) เพราะต้องรู้ students ล่าสุดจาก store
 */
export function createStudentFormSchema(existingStudents: Student[]) {
  return studentFormSchema.refine(
    (data) => !existingStudents.some((s) => s.studentId === data.studentId),
    { message: "รหัสนักศึกษานี้มีอยู่แล้ว", path: ["studentId"] },
  );
}
