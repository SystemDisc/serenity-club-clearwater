import { draftMode } from 'next/headers'

export async function GET() {
  const { isEnabled } = await draftMode()

  return Response.json(
    { preview: isEnabled },
    {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
      },
    },
  )
}
