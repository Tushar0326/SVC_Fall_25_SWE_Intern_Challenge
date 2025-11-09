import type { Contractor } from '@shared/schemas';

/**
 * Factory function to create test contractor data
 */
export function createTestContractor(overrides?: Partial<Contractor>): Contractor {
  const timestamp = Date.now();
  return {
    id: Math.floor(Math.random() * 1000000),
    user_id: 1,
    email: `contractor-${timestamp}@example.com`,
    company_slug: 'silicon-valley-consulting',
    company_name: 'Silicon Valley Consulting',
    status: 'pending',
    joined_slack: true,
    can_start_job: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create test contractor for database insertion
 */
export function createTestContractorForInsert(
  userId: number,
  overrides?: Partial<Omit<Contractor, 'id' | 'created_at' | 'updated_at'>>
) {
  return {
    user_id: userId,
    email: `contractor-${Date.now()}@example.com`,
    company_slug: 'silicon-valley-consulting',
    company_name: 'Silicon Valley Consulting',
    status: 'pending' as const,
    joined_slack: true,
    can_start_job: false,
    ...overrides,
  };
}

