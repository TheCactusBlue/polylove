import { ENV_CONFIG } from './prod'
export { ENV_CONFIG }

export const MAX_DESCRIPTION_LENGTH = 16000
export const MAX_ANSWER_LENGTH = 240

export const DOMAIN = ENV_CONFIG.domain

export const AUTH_COOKIE_NAME = 'POLYLOVE_AUTH'

export function isAdminId(id: string) {
  return ENV_CONFIG.adminIds.includes(id)
}

export function isModId(id: string) {
  return ENV_CONFIG.modIds.includes(id)
}

export const VERIFIED_USERNAMES = [
  'ScottAlexander',
  'Aella',
  'Roko',
  'KatjaGrace',
  'patrissimo',
]

export const TEN_YEARS_SECS = 60 * 60 * 24 * 365 * 10

export const RESERVED_PATHS = [
  '_next',
  'about',
  'ad',
  'add-funds',
  'ads',
  'admin',
  'analytics',
  'api',
  'auth',
  'browse',
  'career',
  'careers',
  'chat',
  'chats',
  'common',
  'contact',
  'contacts',
  'create',
  'dashboard',
  'discord',
  'embed',
  'facebook',
  'find',
  'github',
  'google',
  'group',
  'groups',
  'help',
  'home',
  'link',
  'linkAccount',
  'links',
  'live',
  'login',
  'manifest',
  'manifold',
  'market',
  'markets',
  'message',
  'messages',
  'notifications',
  'og-test',
  'payments',
  'privacy',
  'profile',
  'public',
  'questions',
  'referral',
  'referrals',
  'send',
  'server-sitemap',
  'sign-in',
  'sign-in-waiting',
  'sitemap',
  'slack',
  'stats',
  'styles',
  'team',
  'terms',
  'twitch',
  'twitter',
  'user',
  'users',
  'web',
  'welcome',
]
