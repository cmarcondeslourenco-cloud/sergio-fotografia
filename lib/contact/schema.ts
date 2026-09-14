import { z } from 'zod';

export const workTypes = ['Casamento', 'Evento', 'Ensaio', 'Festa', 'Corporativo', 'Outro'] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(100, 'O nome é muito longo.'),
  whatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido.').max(30, 'O WhatsApp é muito longo.'),
  email: z.string().trim().email('Informe um e-mail válido.').max(160).or(z.literal('')),
  workType: z.enum(workTypes),
  eventDate: z.string().trim().max(10).or(z.literal('')),
  city: z.string().trim().max(120, 'A cidade é muito longa.'),
  message: z.string().trim().min(10, 'Conte um pouco mais sobre o que você imagina.').max(3000, 'A mensagem é muito longa.'),
  company: z.string().max(0, 'Envio inválido.').optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
