import type { AdminViewServerProps } from 'payload'
import { redirect } from 'next/navigation'
import PasswordResetRequest from './PasswordResetRequest'
export default function PasswordHelp({ initPageResult }: AdminViewServerProps) {
  if (initPageResult.req.user) redirect('/admin/account')
  return <PasswordResetRequest />
}
