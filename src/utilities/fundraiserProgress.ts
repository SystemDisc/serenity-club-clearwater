export const fundraiserCampaignId = '9435980f-52be-4a2c-8479-142362d37e15'
export const fundraiserCampaignUrl =
  'https://www.zeffy.com/en-US/donation-form/help-restore-the-serenity-club-of-clearwater'
export const fundraiserCampaignTitle = 'Help Restore the Serenity Club of Clearwater'

export type FundraiserProgress = {
  raised: number
  goal: number
  currency: 'USD'
  checkedAt: string
}

export function parseFundraiserProgress(value: unknown): FundraiserProgress {
  if (!value || typeof value !== 'object') throw new Error('Invalid campaign response')
  const campaign = value as Record<string, unknown>
  const goal = campaign.goal_amount ?? campaign.target

  if (
    campaign.id !== fundraiserCampaignId ||
    campaign.object !== 'campaign' ||
    campaign.currency !== 'usd' ||
    campaign.is_archived !== false ||
    campaign.deleted_at != null ||
    typeof campaign.volume !== 'number' ||
    !Number.isSafeInteger(campaign.volume) ||
    campaign.volume < 0 ||
    typeof goal !== 'number' ||
    !Number.isSafeInteger(goal) ||
    goal <= 0
  ) {
    throw new Error('Invalid campaign totals')
  }

  // Zeffy's campaign API expresses both volume and goal_amount in cents.
  // Explicitly allowlist the public fields; never proxy full upstream responses.
  return {
    raised: campaign.volume / 100,
    goal: goal / 100,
    currency: 'USD',
    checkedAt: new Date().toISOString(),
  }
}
