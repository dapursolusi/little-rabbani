import z from 'zod';

const GuardianFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  email: z.string().optional().nullable(),
  secondContactName: z.string().optional().nullable(),
  secondContactPhone: z.string().optional().nullable(),
});

export { GuardianFormSchema };

export type GuardianFormData = z.infer<typeof GuardianFormSchema>;
