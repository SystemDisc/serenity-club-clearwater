import { withPublicRevalidation } from '@/utilities/publicCache'
// Keep the mutation wrapper when regenerating Payload route scaffolding.
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = withPublicRevalidation(GRAPHQL_POST(config))

export const OPTIONS = REST_OPTIONS(config)
