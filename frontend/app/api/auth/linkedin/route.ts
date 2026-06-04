import type { NextRequest } from 'next/server';
import { buildOAuthStartRedirect } from '../_oauth-redirect';

export async function GET(request: NextRequest) {
  return buildOAuthStartRedirect(request, 'linkedin');
}
