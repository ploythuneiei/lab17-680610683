import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RotateCcw, UserPlus, X } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  type DefaultValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import {
  createStudentFormSchema,
  interestOptions,
  MAX_EMAILS,
  type StudentFormValues,
} from "@/lib/schemas/student-schema";

const programOptions = [
  { value: "CPE", label: "CPE — วิศวกรรมคอมพิวเตอร์" },
  { value: "ISNE", label: "ISNE — วิศวกรรมระบบสารสนเทศและเครือข่าย" },
];

const emptyStudentForm: DefaultValues<StudentFormValues> = {
  studentId: "",
  firstName: "",
  lastName: "",
  program: undefined,
  interests: [],
  emails: [{ address: "" }],
};

export function AddNewStudentDialog() {
  //useEnrollmentStore(...): เป็นการดึง State และฟังก์ชันมาจาก Local Store
  // ดึงฟังก์ชัน addStudent เอาไว้สำหรับกดบันทึกเพิ่มนักศึกษาใหม่ลงระบบ
  //s(มาจาก State) คือตัวแทนของข้อมูลทั้งหมดใน Store ก้อนใหญ่ เราจะดึงแค่ฟังก์ชั่น
  const addStudent = useEnrollmentStore((s) => s.addStudent);
  // เราจะดึงแค่รายชื่อนักศึกษาปัจจุบันทั้งหมด(students) ออกมาใช้งาน
  const students = useEnrollmentStore((s) => s.students);
  const [open, setOpen] = useState(false);

  //Dynamic Validation เพื่อป้องกันไม่ให้ข้อมูลรหัสซ้ำตกหล่น
  // schema ต้องสร้างใหม่เมื่อ students เปลี่ยน เพื่อให้ .refine() กันรหัสซ้ำเห็นข้อมูลล่าสุด
  //useMemo : "ให้จำค่า schema นี้ไว้นะ แต่ถ้าเมื่อไหร่ที่อาเรย์รายชื่อนักศึกษา (students) 
  // มีการเปลี่ยนแปลง (เช่น มีคนเพิ่มหรือลบข้อมูล) ให้ทำการคำนวณและสร้าง schema ตัวใหม่ขึ้นมาทันที"
  const schema = useMemo(() => createStudentFormSchema(students), [students]);

  // useForm คือ เครื่องมือหลัก (Hook) ของ React ที่ช่วยจัดการฟอร์ม ตั้งแต่การเก็บค่าที่ผู้ใช้พิมพ์ 
  // การเช็คความถูกต้อง ไปจนถึงการกดส่งข้อมูล โดยที่เราไม่ต้องเขียนstateหลายๆตัว
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(schema), //กำหนดschemaที่ต้องเอาไปตรวจ
    defaultValues: emptyStudentForm, //กำหนด "ค่าเริ่มต้น" ของฟอร์มตอนที่หน้าต่าง Dialog ถูกเปิดขึ้นมาครั้งแรก
    mode: "onBlur", //หน้าที่: กำหนด "จังหวะเวลา" ที่จะให้ฟอร์มเริ่มทำการตรวจสอบ (Validate) ความถูกต้องของข้อมูล
    //ย่อมาจาก "On Loss of Focus" หรือก็คือ "เช็คข้อมูลทันทีเมื่อผู้ใช้คลิกพิมพ์เสร็จแล้วเอาเมาส์คลิกออก (ย้ายไปช่องอื่น)"
    //เกร็ดความรู้: นอกจาก onBlur แล้ว react-hook-form ยังมีโหมดอื่นๆ เช่น onSubmit เช็คตอนกดบันทึก, onChange เช็คแบบเรียลไทม์ทุกตัวอักษรที่พิมพ์
  });

  //useFieldArray ซึ่งเป็นอีกหนึ่งฟีเจอร์เด็ดของ react-hook-form ที่เอาไว้ใช้สำหรับ "จัดการฟอร์มที่เป็นอาเรย์ (Dynamic Field)
  // หรือฟอร์มที่ผู้ใช้สามารถกดปุ่มเพิ่ม/ลดแถวข้อมูลได้เอง" (เช่น ช่องกรอกอีเมลที่กดเพิ่มช่องที่ 2, ช่องที่ 3 ได้)
  // ─── useFieldArray ───
  //การตั้งค่าเริ่มต้นของ useFieldArray 
  //fields (อาเรย์ของข้อมูลแต่ละแถว) หน้าที่: เป็นอาเรย์ที่เก็บรายการแถวปัจจุบันทั้งหมด (เช่น ตอนแรกมี 1 แถว, พอกดปุ่มเพิ่ม จะกลายเป็น 2 แถว)
  // append(ฟังก์ชันสำหรับกด "เพิ่ม" แถวใหม่) หน้าที่: เอาไว้ใส่ปุ่ม "เพิ่มอีเมล"
  //remove (ฟังก์ชันสำหรับกด "ลบ" แถวออก) หน้าที่: เอาไว้ใส่ปุ่ม "ลบ"(เช่น ปุ่มกากบาท หรือปุ่มถังขยะข้างๆ ช่องอีเมลแต่ละช่อง)
  const { fields, append, remove } = useFieldArray({
    //control: form.control: เป็นการเชื่อมโยง useFieldArray เข้ากับตัวควบคุมฟอร์มหลัก (form) ที่เราสร้างไว้จาก useForm เพื่อให้มันรู้ว่ากำลังคุมฟอร์มตัวไหนอยู่
    control: form.control,
    //name: "emails": บอกว่า Field Array ตัวนี้ จะไปผูกและจัดการกับข้อมูลก้อนที่ชื่อว่า emails
    name: "emails",
  });

  //Error ของภาพรวมทั้งอาเรย์ (Root Error): เช่น Error จากกฎ .refine() ที่เราเขียนเช็คว่า "อีเมลซ้ำกัน" หรือ Error ที่บอกว่า "ต้องมีอีเมลอย่างน้อย 1 อีเมล"
  // ซึ่ง Error แบบนี้มันไม่ได้เกิดขึ้นที่ช่องใดช่องหนึ่งโดยเฉพาะ แต่มันเกิดขึ้นกับ ภาพรวมของก้อน emails ทั้งหมด
  //rror ของแต่ละช่องย่อย (Item Error): เช่น Error จากกฎ z.email() ที่บอกว่าช่องที่ 2 พิมพ์อีเมลผิดรูปแบบ (address: "อีเมลไม่ถูกต้อง")
  const emailsError =
    //ให้เช็คก่อนว่ามี Error ภาพรวมที่ตัว Root ของ emails ไหม (form.formState.errors.emails?.root) ถ้ามี ให้หยิบอันนั้นมาใช้"
    //แต่ถ้าไม่มี Error ที่ Root (เช่น พิมพ์ถูกหมดแล้ว แต่มีช่องใดช่องหนึ่งกรอกอีเมลผิดรูปแบบ) ให้ใช้เครื่องหมาย Nullish Coalescing (??) 
    // สลับไปหยิบ Error ของตัวอาเรย์ปกติ (form.formState.errors.emails) แทน
    form.formState.errors.emails?.root ?? form.formState.errors.emails;

  //form.reset(...): เป็นฟังก์ชันสำเร็จรูปที่มีมาให้ใน useForm ใช้สำหรับล้างค่าในฟอร์มทั้งหมดให้กลับไปเป็นค่าเริ่มต้น
  //emptyStudentForm: คือข้อมูลตั้งต้น(ค่าว่างๆ) ที่เราเตรียมไว้
  const resetForm = () => form.reset(emptyStudentForm);

  // ถึงจุดนี้แปลว่า Zod validate ผ่านแล้วทุก field (ค่าถูก trim แล้วด้วย)
  function onSubmit(values: StudentFormValues) {
    addStudent(values); //นำข้อมูลที่ผ่านการตรวจสอบความถูกต้องแล้ว (values ที่มี Type เป็น StudentFormValues) ส่งเข้าไปในฟังก์ชัน addStudent เพื่อบันทึกข้อมูลนักศึกษาใหม่ลงใน store
    resetForm(); // เรียกใช้ฟังก์ชั่นreset from
    setOpen(false); //ปิดหน้าต่าง Dialog
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // ปิด popup แล้วล้างค่า/error — เปิดใหม่ต้องได้ฟอร์มว่าง
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus className="h-4 w-4" />
        เพิ่มนักศึกษา
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form
          //   form.handleSubmit เป็นฟังก์ชันสำเร็จรูปที่มีมาให้ใน react-hook-form (ที่เราเรียกผ่านตัวแปร form ที่ประกาศไว้ด้านบน)
          // เมื่อผู้ใช้กดปุ่ม Submit (ปุ่มบันทึก) ยามตัวนี้จะวิ่งไปหยิบข้อมูลทั้งหมดในฟอร์ม มาเข้าเครื่องตรวจ (เช็คกับ Zod Schema ที่เราตั้งค่าไว้)
          // ถ้าผ่านถึงเข้าฟังก์ชั่นถัดไปได้ ซึ่งก็คือ onSubmit มันจะรับข้อมูลที่สะอาดและปลอดภัยแล้ว
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>เพิ่มนักศึกษาใหม่</DialogTitle>
            <DialogDescription>
              ลองเว้นช่องว่าง ใส่รหัสนักศึกษาไม่ครบ 9 หลัก ใส่รหัสที่มีอยู่แล้ว
              หรือไม่เลือกความสนใจเลย แล้วกดบันทึก
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            {/* ต้องใช้ <Controller> มาเป็นตัวครอบและทำหน้าที่เป็น "สะพานเชื่อม" ระหว่างช่อง Input กับ useForm */}
            <Controller
              //name="studentId": บอกว่า Controller ตัวนี้กำลังคุมฟิลด์ไหนใน Zod Schema
              name="studentId"
              // บอกว่า: เอาตัวควบคุมหลักของฟอร์มมาใส่ตรงนี้นะ
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="studentId">รหัสนักศึกษา</FieldLabel>
                  <Input
                    //พอกดเอา {...field} ไปแปะไว้ใน <Input> มันจะแปลงร่างกลายเป็นโค้ดเบื้องหลังพวกนี้ให้เราอัตโนมัติ:
                    // value={...} (จำค่าที่ผู้ใช้พิมพ์)
                    // onChange={...} (เวลามีการพิมพ์ตัวหนังสือเพิ่ม)
                    // onBlur={...} (เวลาผู้ใช้คลิกย้ายไปช่องอื่น)
                    // name="..."
                    {...field}
                    id="studentId"
                    placeholder="650610099"
                    //เมื่อผู้ใช้จิ้มคลิกเข้ามาที่ช่องกรอกข้อมูลนี้ ให้เด้งแป้นพิมพ์ตัวเลข (Numeric Keypad) ขึ้นมาทันที
                    inputMode="numeric"
                    //{fieldState.invalid}: เป็น true หรือ false ที่ดึงมาจาก Controller:
                    //   ถ้าผู้ใช้กรอกถูกต้อง:ค่าจะเป็น false (ระบบรู้ว่าปกติดี)
                    // ถ้าผู้ใช้กรอกผิดกฎ Zod (เช่น รหัสไม่ครบ 9 หลัก): ค่าจะเปลี่ยนเป็น true ทันที
                    aria-invalid={fieldState.invalid}
                  />
                  {/* ถ้าตรวจสอบแล้วพบว่าผู้ใช้กรอกข้อมูลผิด ให้หยิบข้อความเตือนสีแดงจาก Zod มาแสดงผลโชว์ไว้ใต้ช่องกรอกทันที แต่ถ้ากรอกถูกต้องดีแล้ว ก็ปล่อยโล่งไว้ */}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="firstName">ชื่อ</FieldLabel>
                    <Input
                      {...field}
                      id="firstName"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lastName">นามสกุล</FieldLabel>
                    <Input
                      {...field}
                      id="lastName"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="program"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="program">หลักสูตร</FieldLabel>
                  <Select
                    name={field.name}
                    items={programOptions}
                    value={field.value ?? null}
                    onValueChange={(v) => {
                      field.onChange(v);
                      field.onBlur();
                    }}
                  >
                    <SelectTrigger
                      id="program"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="เลือกหลักสูตร" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="interests"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant="label">
                    ความสนใจ (Checkbox หลายตัว)
                  </FieldLegend>
                  <FieldDescription>เลือก 1–3 ด้าน</FieldDescription>
                  <FieldGroup data-slot="checkbox-group" className="gap-3">
                    {/* การวนลูปสร้าง Checkbox แต่ละตัว */}
                    {interestOptions.map((item) => (
                      <Field
                        key={item.id}
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          id={`interest-${item.id}`}
                          name={field.name}
                          aria-invalid={fieldState.invalid}
                          //เช็คว่าค่าปัจจุบันในฟอร์ม (field.value ซึ่งเป็นอาเรย์) มีไอเท็มนี้อยู่ข้างในหรือยัง?
                          checked={field.value.includes(item.id)}
                          onCheckedChange={(checked) => {
                            //ถ้าติ๊กเพิ่ม (checked เป็นจริง): มันจะเอาค่าเดิมทั้งหมดในอาเรย์(...field.value) 
                            // มาต่อท้ายด้วย item.id ตัวใหม่ที่เพิ่งติ๊กเข้าไป กลายเป็นอาเรย์ชุดใหม่แล้วส่งให้ field.onChange(...)
                            field.onChange(
                              checked
                                ? [...field.value, item.id]
                                //ถ้าเอาติ๊กออก (checked เป็นเท็จ): มันจะใช้ฟังก์ชัน.filter(...) วิ่งไปกรองเอา item.id ตัวนั้น 
                                // ทิ้งออกไปจากอาเรย์ เหลือไว้เฉพาะตัวที่ยังไม่ได้เอาออก แล้วส่งค่าที่เหลือกลับเข้าฟอร์ม
                                : field.value.filter((id) => id !== item.id)
                            );
                            //field.onBlur(): สั่งอัปเดตสถานะว่าช่องนี้ถูกใช้งานแล้ว เพื่อให้ Zod วิ่งมาเช็คกฎทันที 
                            // (เช่น เช็คว่าเลือกครบอย่างน้อย 1 ข้อหรือยัง)
                            field.onBlur();
                          }}
                        />
                        <FieldLabel
                          htmlFor={`interest-${item.id}`}
                          className="font-normal"
                        >
                          {item.label}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />

            <FieldSet data-invalid={!!emailsError?.message}>
              <FieldLegend variant="label">อีเมล</FieldLegend>
              <FieldDescription>
                {fields.length}/{MAX_EMAILS} อีเมล — ห้ามซ้ำกัน
              </FieldDescription>

              <FieldGroup className="gap-3">
                {/* fields.map((item, index) => (...)): วนลูปสร้างแถวตามจำนวนสมาชิกใน fields */}
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="mt-1.5 w-5 shrink-0 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    {/* ควบคุมแต่ละช่องอีเมลด้วย <Controller> */}
                    <Controller
                      //name={emails.${index}.address}: จุดนี้สำคัญมาก! เพราะมันคือการระบุตำแหน่งเจาะจงลงไปในอาเรย์
                      //เช่น แถวแรกจะเป็น emails.0.address, แถวที่สองเป็น emails.1.address เพื่อให้ Zod ตรวจสอบถูกช่อง
                      name={`emails.${index}.address`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="flex-1">
                          <FieldContent>
                            <Input
                              {...field}
                              id={`email-${index}`}
                              //<Input type="email"/>: ช่องกรอกข้อมูลที่เป็นประเภทอีเมลโดยเฉพาะ และมีระบบเช็ค Error เฉพาะตัวของแต่ละช่อง 
                              // (เช่น ถ้าพิมพ์รูปแบบอีเมลผิด ก็จะขึ้นเตือนแดงๆ แค่ช่องนั้น)
                              type="email"
                              placeholder="name@cmu.ac.th"
                              aria-label={`อีเมลที่ ${index + 1}`}
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldContent>
                        </Field>
                      )}
                    />
                    {/* ─── remove(index) ─── */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`ลบอีเมลที่ ${index + 1}`}
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </FieldGroup>

              {/* ─── Array Validation: error ระดับ array ─── */}
              {emailsError?.message && <FieldError errors={[emailsError]} />}

              {/* ─── append({...}) ─── */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={fields.length >= MAX_EMAILS}
                onClick={() => append({ address: "" })}
              >
                <Plus className="size-4" />
                เพิ่มอีเมล
              </Button>
            </FieldSet>
          </FieldGroup>

          <DialogFooter>
            {/* ล้างฟอร์ม — กลับเป็นค่าเริ่มต้น + ล้าง error โดยไม่ปิด popup */}
            <Button type="button" variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4" />
              ล้างฟอร์ม
            </Button>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
