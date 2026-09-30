import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, Plus, RotateCcw, X } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import {
  createCourseFormSchema,
  MAX_DESCRIPTION,
  MAX_INSTRUCTORS,
  type CouresFormValues,
} from "@/lib/schemas/course-schema";
import { cn } from "@/lib/utils";

const programOptions = [
  { value: "CPE", label: "CPE — วิศวกรรมคอมพิวเตอร์" },
  { value: "ISNE", label: "ISNE — วิศวกรรมระบบสารสนเทศและเครือข่าย" },
];

const semesterOptions = [
  { value: "1", label: "ภาคการศึกษาที่ 1" },
  { value: "2", label: "ภาคการศึกษาที่ 2" },
  { value: "3", label: "ภาคฤดูร้อน" },
];

// ค่าเริ่มต้น: ผู้สอนว่าง 1 แถว, switch ปิด, program/semester ยังไม่เลือก
const emptyCourseForm: DefaultValues<CouresFormValues> = {
  courseId: "",
  courseTitle: "",
  program: undefined,
  semester: undefined,
  description: "",
  instructors: [{ name: "", email: "" }],
  notifyByEmail: false,
};

export function AddNewCourseDialog() {
  const courses = useEnrollmentStore((s) => s.courses);
  const addCourse = useEnrollmentStore((s) => s.addCourse); // ⚠️ ชื่อตาม store ของคุณ
  const [open, setOpen] = useState(false);

  // สร้าง schema ใหม่เมื่อ courses เปลี่ยน เพื่อให้ .refine() กันรหัสซ้ำเห็นข้อมูลล่าสุด
  const schema = useMemo(() => createCourseFormSchema(courses), [courses]);

  const form = useForm<CouresFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyCourseForm,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "instructors",
  });

  // ตัวนับตัวอักษร (ข้อ 3.3)
  const description =
    useWatch({ control: form.control, name: "description" }) ?? "";
  const overLimit = description.length > MAX_DESCRIPTION;

  // error ระดับ array: .root เมื่อมีแถวอยู่แล้ว หรือที่ตัว array เองเมื่อว่าง
  const instructorsError =
    form.formState.errors.instructors?.root ?? form.formState.errors.instructors;

  const resetForm = () => form.reset(emptyCourseForm);

  // ถูกเรียกเฉพาะเมื่อผ่าน schema แล้ว: ค่าถูก trim และ program/semester มี type ถูกต้อง
  function onSubmit(values: CouresFormValues) {
    addCourse(values);
    resetForm();
    setOpen(false); // บันทึกสำเร็จ → ปิดฟอร์ม (ข้อ 4.2)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // ปิด popup ด้วยวิธีใดก็ตาม ให้ล้างค่า/error เปิดใหม่ต้องว่างเปล่า (ข้อ 4.2)
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <CirclePlus className="h-4 w-4" />
        เพิ่มวิชา
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>เพิ่มวิชาใหม่</DialogTitle>
            <DialogDescription>
              ลองใส่รหัสวิชาไม่ครบ 6 หลัก ใส่รหัสที่มีอยู่แล้ว
              ใส่อีเมลผู้สอนที่ไม่ใช่ @cmu.ac.th
              หรือพิมพ์รายละเอียดเกิน 100 ตัวอักษร แล้วกดบันทึก
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            {/* ---------- รหัสวิชา + ชื่อวิชา ---------- */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
              <Controller
                name="courseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="courseId">รหัสวิชา</FieldLabel>
                    <Input
                      {...field}
                      id="courseId"
                      inputMode="numeric"
                      placeholder="เช่น 261305"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="courseTitle"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="courseTitle">ชื่อวิชา</FieldLabel>
                    <Input
                      {...field}
                      id="courseTitle"
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น Mobile Application Development"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* ---------- หลักสูตร (Select) ---------- */}
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
                      field.onBlur(); // Select ไม่มี blur ชัดเจน ถือว่าแตะแล้วตั้งแต่เลือก
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

            {/* ---------- ภาคการศึกษา (Radio Group) ---------- */}
            <Controller
              name="semester"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant="label">ภาคการศึกษา</FieldLegend>
                  <RadioGroup
                    name={field.name}
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v);
                      field.onBlur();
                    }}
                    className="flex flex-wrap gap-4"
                  >
                    {semesterOptions.map((o) => (
                      <Field
                        key={o.value}
                        orientation="horizontal"
                        data-invalid={fieldState.invalid}
                        className="w-auto"
                      >
                        <RadioGroupItem
                          value={o.value}
                          id={`semester-${o.value}`}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`semester-${o.value}`}
                          className="font-normal"
                        >
                          {o.label}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />

            {/* ---------- รายละเอียด (Textarea + ตัวนับ) ---------- */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">
                    รายละเอียด (ไม่บังคับ)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder="คำอธิบายรายวิชาสั้นๆ"
                  />
                  <p
                    className={cn(
                      "text-sm",
                      overLimit ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {description.length}/{MAX_DESCRIPTION} ตัวอักษร
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- ผู้สอน (useFieldArray) ---------- */}
            <FieldSet data-invalid={!!instructorsError?.message}>
              <FieldLegend variant="label">ผู้สอน</FieldLegend>
              <FieldDescription>
                {fields.length}/{MAX_INSTRUCTORS} คน — กรอกชื่อผู้สอน และอีเมล
                name@cmu.ac.th (ห้ามซ้ำกัน)
              </FieldDescription>

              <FieldGroup className="gap-3">
                {/* key ต้องใช้ item.id ที่ useFieldArray สร้างให้ ไม่ใช่ index */}
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.5rem_1fr_1fr_auto] items-start gap-2"
                  >
                    <span className="pt-2 text-sm text-muted-foreground">
                      {index + 1}.
                    </span>

                    <Controller
                      name={`instructors.${index}.name`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-label={`ชื่อผู้สอนคนที่ ${index + 1}`}
                              placeholder="ชื่อผู้สอน"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldContent>
                        </Field>
                      )}
                    />

                    <Controller
                      name={`instructors.${index}.email`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <Input
                              {...field}
                              type="email"
                              aria-label={`อีเมลผู้สอนคนที่ ${index + 1}`}
                              placeholder="name@cmu.ac.th"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </FieldContent>
                        </Field>
                      )}
                    />

                    {/* remove(index): disabled เมื่อเหลือ 1 คน */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`ลบผู้สอนคนที่ ${index + 1}`}
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </FieldGroup>

              {/* error ระดับ array (.min / .max / .refine) เช่น "อีเมลผู้สอนซ้ำกัน" */}
              {instructorsError?.message && (
                <FieldError errors={[instructorsError]} />
              )}

              {/* append: disabled เมื่อครบ 3 คน */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={fields.length >= MAX_INSTRUCTORS}
                onClick={() => append({ name: "", email: "" })}
              >
                <Plus className="size-4" />
                เพิ่มผู้สอน
              </Button>
            </FieldSet>

            {/* ---------- รับข่าวสารทางอีเมล (Switch) ---------- */}
            <Controller
              name="notifyByEmail"
              control={form.control}
              render={({ field }) => (
                <div className="rounded-lg border p-3">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="notifyByEmail">
                        รับข่าวสารทางอีเมล
                      </FieldLabel>
                      <FieldDescription>
                        แจ้งเตือนผู้สอนเมื่อเปิดลงทะเบียน
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="notifyByEmail"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                </div>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            {/* ล้างฟอร์ม: กลับค่าเริ่มต้น + ซ่อน error โดยไม่ปิด popup */}
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