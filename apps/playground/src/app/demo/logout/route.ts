/** Playground-only POST target: deliberately does not read or change auth cookies. */
export function POST(request: Request) {
  return Response.redirect(new URL('/demo/logout-form?submitted=1', request.url), 303);
}
