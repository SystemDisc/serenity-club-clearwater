export function kioskVersion() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  return sha && /^[a-f0-9]{40}$/.test(sha) ? sha : 'unknown'
}
