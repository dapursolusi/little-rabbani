import z from 'zod';

const KidFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  dob: z.string().min(1, 'Tanggal lahir wajib diisi'),
  guardianId: z.string().min(1, 'Wali murid wajib dipilih'),
  status: z
    .enum(['waiting', 'enrolled', 'alumni'])
    .optional()
    .default('waiting'),
  enrolledTermId: z.string().nullable().optional(),
});

export { KidFormSchema };

export type KidFormData = z.infer<typeof KidFormSchema>;
