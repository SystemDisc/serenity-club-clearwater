import { describe, expect, it } from 'vitest'
import { assertDatabaseSafety, assertTestDatabase, isLocalDatabase } from '../../src/utilities/databaseSafety'

describe('database isolation', () => {
  it('rejects production connections during local development and builds', () => {
    expect(() => assertDatabaseSafety({ DATABASE_URL: 'postgres://user:secret@example.neon.tech/db' })).toThrow('Remote database')
    expect(() => assertDatabaseSafety({ DATABASE_URL: 'postgres://user:secret@example.neon.tech/db', NODE_ENV: 'production' })).toThrow('Remote database')
    expect(isLocalDatabase('postgres://localhost.evil.example/db')).toBe(false)
  })
  it('allows loopback and explicitly authorized server environments', () => {
    expect(() => assertDatabaseSafety({ DATABASE_URL: 'postgres://localhost/serenity' })).not.toThrow()
    expect(() => assertDatabaseSafety({ DATABASE_URL: 'postgres://db.example/db', VERCEL: '1' })).not.toThrow()
  })
  it('refuses destructive tests outside a dedicated local test database', () => {
    expect(() => assertTestDatabase({ DATABASE_URL: 'postgres://localhost/serenity' })).toThrow()
    expect(() => assertTestDatabase({ DATABASE_URL: 'postgres://db.example/serenity_test' })).toThrow()
    expect(() => assertTestDatabase({ DATABASE_URL: 'postgres://localhost/serenity_test', BLOB_READ_WRITE_TOKEN: 'not-a-real-token' })).toThrow()
    expect(() => assertTestDatabase({ DATABASE_URL: 'postgres://localhost/serenity_test' })).not.toThrow()
  })
})
