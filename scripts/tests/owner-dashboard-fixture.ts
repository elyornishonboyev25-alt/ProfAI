import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

export function installOwnerDashboardFixture() {
  const previousGet = apiClient.get
  const previousSession = useAuthStore.getState()
  const fixture = {
    requests: [] as string[], holdPeriod: '', finishOverview: null as null | (() => void), failOverview: false,
    checkedAt: '2026-10-31T04:00:00.000Z', counts: { activity: 4, users: 3, payments: 2, reports: 1, reviews: 1 },
  }
  useAuthStore.setState({ user: { id: 'owner-ui', fullName: 'Owner', email: 'elyornishonboyev000@gmail.com', role: 'USER', xp: 0, level: 1, currentStreak: 0 }, accessToken: 'fixture', refreshToken: 'fixture' })
  const user = (name: string) => ({ id: name, fullName: name, email: `${name.toLowerCase().replace(/ /g, '.')}@example.test`, createdAt: '2026-10-30T19:05:00.000Z', lastSeenAt: '2026-10-31T03:00:00.000Z' })
  const page = <T,>(items: T[], pageNumber = 1, total = items.length) => ({ items, total, page: pageNumber, pageSize: 20 })
  const order = { id: 'order-fifty', plan: 'PRO_1', status: 'PENDING', method: 'PAYME', currency: 'USD', amountMinor: 300, amountUzs: 0, discountPercent: 50, wheelSpinId: 'spin-fifty', createdAt: '2026-10-31T03:00:00.000Z', user: { ...user('Wheel Winner'), promoCode: { code: 'IVYACCOUNT', redeemedAt: '2026-10-31T03:00:00.000Z' } } }
  apiClient.get = async <T,>(path: string) => {
    fixture.requests.push(path)
    const url = new URL(path, 'http://localhost'), params = url.searchParams
    if (url.pathname === '/support/owner/updates') return { checkedAt: fixture.checkedAt, counts: Object.fromEntries(Object.entries(fixture.counts).map(([section, count]) => [section, (params.get(section) ?? '') >= fixture.checkedAt ? 0 : count])) } as T
    if (url.pathname === '/support/owner/overview') {
      if (fixture.failOverview && params.has('userPeriod')) throw new Error('Failed overview')
      const period = params.get('userPeriod') ?? 'ALL'
      const currentPage = Number(params.get('userPage') ?? 1)
      const name = params.get('userKind') === 'ACTIVE' ? 'Returning Learner' : period === 'TODAY' ? 'Today Learner' : period === 'WEEK' ? `Week Learner ${currentPage}` : 'All Learner'
      const result = { metrics: { totalUsers: 67, todayUsers: 1, weekUsers: 21, totalReports: 1, openReports: 1 }, users: page([user(name)], currentPage, period === 'WEEK' ? 21 : 1), reports: page([]) }
      if (fixture.holdPeriod === period && params.has('userPeriod')) return new Promise<T>(resolve => { fixture.finishOverview = () => resolve(result as T) })
      return result as T
    }
    if (url.pathname === '/billing/owner/users') return page([]) as T
    if (url.pathname === '/billing/owner/requests') return page(params.get('status') === 'APPROVED' ? [{ ...order, id: 'paid-uzs', currency: 'UZS', amountMinor: 3900000, amountUzs: 39000, status: 'APPROVED' }] : [order]) as T
    if (url.pathname === '/billing/owner/promotions') return page([
      { ...user('Wheel Winner'), promoCode: null, referralReceived: null, wheelSpin: { id: 'spin-fifty', percent: 50, expiresAt: '2099-10-31T04:10:00.000Z', usedAt: null }, paymentRequests: [order] },
      { ...user('Promo Learner'), promoCode: { code: 'IVYEXAMPLE', days: 7, redeemedAt: '2026-10-31T03:00:00.000Z' }, referralReceived: null, wheelSpin: null, paymentRequests: [] },
    ]) as T
    if (url.pathname === '/reviews/owner') return page([]) as T
    if (url.pathname === '/auth/owner/activity') return { ...page([]), updatedAt: fixture.checkedAt, trackingSince: null, metrics: { onlineUsers: 0, totalDevices: 0, multipleDeviceAccounts: 0, logins: 0 } } as T
    throw new Error(`Unexpected fixture URL: ${path}`)
  }
  return { fixture, restore: () => { apiClient.get = previousGet; useAuthStore.setState({ user: previousSession.user, accessToken: previousSession.accessToken, refreshToken: previousSession.refreshToken }) } }
}
