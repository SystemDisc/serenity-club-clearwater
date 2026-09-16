// Demo seeding is a local CLI operation, never a public/admin HTTP action.
export function POST(): Response {
  return new Response('Not found', { status: 404 })
}
