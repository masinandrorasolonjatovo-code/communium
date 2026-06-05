import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email requis.')
    .email('Email invalide.')
    .max(320, 'Email invalide.')
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, 'Mot de passe requis.')
    .max(256, 'Mot de passe invalide.'),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = loginPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Identifiants invalides.',
        },
        {
          status: 422,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: parsed.data.email,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Identifiants invalides.',
      },
      {
        status: 400,
      },
    );
  }
}
