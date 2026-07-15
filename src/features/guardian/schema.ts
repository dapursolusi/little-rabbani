import z from 'zod';

const GuardianFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  email: z.string().optional(),
  secondContactName: z.string().optional(),
  secondContactPhone: z.string().optional(),
});

export { GuardianFormSchema };

export type GuardianFormData = z.infer<typeof GuardianFormSchema>;
