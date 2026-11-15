import type { Tier } from '../../lib/classroom/groups';
export interface TeachPupil { id: string; name: string; tier: Tier; keepApart: string[]; keepTogether: string[] }
export const TIER_ICON: Record<Tier, string> = { low: '🌱', mod: '🌿', high: '🌳' };
export const TIER_NAME: Record<Tier, string> = { low: 'Low', mod: 'Moderate', high: 'High' };
