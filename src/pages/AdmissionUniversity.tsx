import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  GraduationCap,
  Globe2,
  Landmark,
  Leaf,
  MapPin,
  Radar as RadarIcon,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { AmbientBackdrop, CountUp, Reveal } from '@/components/fx'
import UniversityLogo from '@/components/admission/UniversityLogo'
import UniversityRadar from '@/components/admission/UniversityRadar'
import AdmissionScoreComparison from '@/components/admission/AdmissionScoreComparison'
import { getUniversityBySlug, presentIndicators, QS_EDITION } from '@/data/admission'
import { useAdmissionScores } from '@/hooks/useAdmissionScores'
import { useUniversityCampusImage } from '@/hooks/useUniversityCampusImage'

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

const PERIOD_LABELS = {
  'academic-year': 'academic year',
  'calendar-year': 'year',
  month: 'month',
} as const

export default function AdmissionUniversity() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const university = slug ? getUniversityBySlug(slug) : undefined
  const { scores } = useAdmissionScores()
  const campusImage = useUniversityCampusImage(university?.name ?? '')

  if (!university) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
        <AmbientBackdrop variant="red" />
        <div className="relative mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-10 text-center">
          <h1 className="text-2xl font-black text-slate-900">University not found</h1>
          <p className="mt-2 text-slate-500">This profile doesn’t exist or hasn’t been added yet.</p>
          <button onClick={() => navigate('/admission/universities')} className="premium-back-btn mt-6">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to rankings
          </button>
        </div>
      </div>
    )
  }

  const u = university
  const accent = u.brand.accent
  const indicators = presentIndicators(u.indicators)
  const students = u.students
  const cost = u.costOfLiving
  const hasDetailedStudents = students && typeof students.undergraduate === 'number'

  const keyFacts: { icon: typeof Landmark; label: string; value: string }[] = [
    { icon: CalendarDays, label: 'Founded', value: String(u.founded) },
    { icon: Landmark, label: 'Institution', value: u.type },
    ...(students ? [{ icon: Users, label: 'Students', value: `${hasDetailedStudents ? '' : '≈ '}${students.total.toLocaleString()}` }] : []),
    ...(students && typeof students.international === 'number'
      ? [{ icon: Globe2, label: 'International', value: `${hasDetailedStudents ? '' : '≈ '}${students.international.toLocaleString()}` }]
      : []),
  ]

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        {/* ----------------------------- Hero ----------------------------- */}
        <Reveal>
          <section
            className="relative overflow-hidden rounded-[2rem] border border-white/10 p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.28)] sm:p-9"
            style={{ background: u.brand.gradient }}
          >
            <img
              key={campusImage?.src ?? 'campus-fallback'}
              src={campusImage?.src ?? '/assets/admission/campus-hero.webp'}
              alt={campusImage ? `${u.name} campus` : ''}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-700"
              referrerPolicy="no-referrer"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith('/assets/admission/campus-hero.webp')) {
                  event.currentTarget.src = '/assets/admission/campus-hero.webp'
                }
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${accent}dc 0%, ${accent}a8 46%, rgba(15,23,42,0.56) 100%)` }}
            />
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
            />
            <div className="relative">
              <button
                onClick={() => navigate('/admission/universities')}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Universities
              </button>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <UniversityLogo name={u.name} brand={u.brand} website={u.website} size={104} rounded="1.5rem" />
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold backdrop-blur">
                    <Trophy className="h-3.5 w-3.5" />
                    {typeof u.rank === 'number' ? `#${u.rankTied ? '=' : ''}${u.rank} · ${QS_EDITION}` : 'Official university profile'}
                  </div>
                  <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{u.name}</h1>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/80">
                    <MapPin className="h-4 w-4" />
                    {u.countryEmoji} {u.city}, {u.country}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/90">{u.type}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/90">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Founded {u.founded}
                    </span>
                    <a
                      href={u.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-[12px] font-bold text-slate-900 transition hover:bg-white/90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit website
                    </a>
                  </div>
                </div>
              </div>

              {/* Highlight stat cards */}
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">QS World Ranking</p>
                  <p className="mt-1 text-3xl font-black">{typeof u.rank === 'number' ? `#${u.rankTied ? '=' : ''}${u.rank}` : 'Not ranked'}</p>
                  <p className="text-[12px] font-medium text-white/70">{typeof u.rank === 'number' ? QS_EDITION : 'No QS rank listed'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Overall Score</p>
                  <p className="mt-1 text-3xl font-black">
                    {typeof u.overallScore === 'number' ? <CountUp value={u.overallScore} decimals={Number.isInteger(u.overallScore) ? 0 : 1} /> : '—'}
                  </p>
                  <p className="text-[12px] font-medium text-white/70">out of 100</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                    {typeof u.subjectRank === 'number' ? 'Subject Ranking' : 'Citations / Faculty'}
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {typeof u.subjectRank === 'number'
                      ? `#${u.subjectRank}`
                      : (u.indicators.citationsPerFaculty ?? '—')}
                  </p>
                  <p className="text-[12px] font-medium text-white/70">
                    {typeof u.subjectRank === 'number' ? 'QS WUR by Subject' : 'QS indicator'}
                  </p>
                </div>
              </div>
            </div>
            {campusImage && (
              <a
                href={campusImage.attributionUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="absolute bottom-2 right-4 z-10 text-[9px] font-semibold text-white/55 transition hover:text-white/90"
                onClick={(event) => event.stopPropagation()}
              >
                Campus photo · Wikimedia Commons
              </a>
            )}
          </section>
        </Reveal>

        {/* ----------------------- About + Radar ----------------------- */}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Reveal delay={0.04} className="h-full">
            <section className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                  <GraduationCap className="h-4 w-4" />
                </span>
                About {u.shortName}
              </h2>
              <p className="mt-4 flex-1 text-[15px] leading-7 text-slate-600">{u.about}</p>
              <p className="mt-3 text-[14px] font-semibold italic text-slate-500">{u.tagline}</p>

              {/* Key facts */}
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <fact.icon className="h-4 w-4" style={{ color: accent }} />
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{fact.label}</p>
                    <p className="mt-0.5 text-[13px] font-black leading-snug text-slate-900">{fact.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.06} className="h-full">
            <section className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
              <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                  <RadarIcon className="h-3.5 w-3.5" />
                </span>
                QS Performance
              </h2>
              {indicators.length > 0 ? (
                <>
                  <div className="mt-2 h-64 w-full sm:h-72">
                    <UniversityRadar indicators={u.indicators} accent={accent} />
                  </div>
                  <p className="text-center text-[11px] font-medium text-slate-400">All indicators scored out of 100</p>
                </>
              ) : (
                <div className="mt-5 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                  QS indicator breakdown is not included for this profile.
                </div>
              )}
            </section>
          </Reveal>
        </div>

        {/* ----------------------- Rankings & Ratings ----------------------- */}
        <Reveal delay={0.04}>
          <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                <Trophy className="h-4 w-4" />
              </span>
              Rankings &amp; Ratings
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <RankCard icon={Trophy} label="QS World University Rankings" value={typeof u.rank === 'number' ? `#${u.rankTied ? '=' : ''}${u.rank}` : 'Not listed'} accent={accent} />
              {typeof u.subjectRank === 'number' ? (
                <RankCard icon={Star} label="QS WUR Ranking by Subject" value={`#${u.subjectRank}`} accent={accent} />
              ) : (
                <RankCard icon={Award} label="Overall Score" value={typeof u.overallScore === 'number' ? String(u.overallScore) : 'Not listed'} accent={accent} />
              )}
              {typeof u.sustainabilityRank === 'number' ? (
                <RankCard icon={Leaf} label="QS Sustainability Ranking" value={`#${u.sustainabilityRank}`} accent={accent} />
              ) : (
                <RankCard icon={Globe2} label="Location" value={`${u.countryEmoji} ${u.city}`} accent={accent} />
              )}
            </div>

            {/* Indicator breakdown */}
            <h3 className="mt-7 text-sm font-bold uppercase tracking-[0.12em] text-slate-400">Ranking criteria</h3>
            <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {indicators.map(({ meta, value }) => (
                <div key={meta.key}>
                  <div className="flex items-center justify-between text-[13px] font-semibold text-slate-700">
                    <span>{meta.label}</span>
                    <span className="font-black text-slate-900">{value}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: accent }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Rank over time */}
            {u.rankHistory && u.rankHistory.length > 1 ? (
              <div className="mt-8">
                <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
                  <TrendingUp className="h-4 w-4" style={{ color: accent }} />
                  QS rank over time
                </h3>
                <div className="mt-4 flex flex-wrap gap-x-2.5 gap-y-3">
                  {u.rankHistory.map((point) => (
                    <div key={point.year} className="flex flex-col items-center gap-1.5">
                      <span
                        className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-1 text-[13px] font-black text-white"
                        style={{ background: accent }}
                      >
                        {point.rank}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{point.year}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] font-medium text-slate-500">
                  A decade-plus at <span className="font-bold" style={{ color: accent }}>#{u.rank}</span> — among the most
                  stable records in global higher education.
                </p>
              </div>
            ) : null}
          </section>
        </Reveal>

        {/* ----------------------- Admission requirements ----------------------- */}
        {u.admission?.bachelor && u.admission.bachelor.length > 0 ? (
          <Reveal delay={0.04}>
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                  <Award className="h-4 w-4" />
                </span>
                Admission · Bachelor
              </h2>
              <p className="mt-2 text-[13px] text-slate-500">{u.admission.note}</p>
              <div className="mt-5">
                <AdmissionScoreComparison university={u} scores={scores} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {u.admission.bachelor.map((req) => (
                  <div key={req.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{req.label}</p>
                    <p className="mt-1.5 text-base font-black leading-snug text-slate-900">{req.value}</p>
                    {req.detail ? <p className="mt-1 text-[10px] leading-4 text-slate-500">{req.detail}</p> : null}
                    {req.sourceUrl ? (
                      <a href={req.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:underline">
                        Official source <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
              {u.admission.verifiedAt ? <p className="mt-3 text-right text-[10px] font-medium text-slate-400">Verified {u.admission.verifiedAt}</p> : null}
            </section>
          </Reveal>
        ) : null}

        {/* ----------------------- Cost of Living + Campus ----------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {cost ? (
            <Reveal delay={0.04} className="h-full">
              <section className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                      <CircleDollarSign className="h-4 w-4" />
                    </span>
                    Cost of Living
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-bold text-slate-700">
                    {money(cost.amount, cost.currency)}{cost.maxAmount ? `–${money(cost.maxAmount, cost.currency)}` : ''} / {PERIOD_LABELS[cost.period]}
                  </span>
                </div>
                <div className="mt-5 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-sm font-black leading-snug text-slate-900">{cost.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cost.includes.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600">{item}</span>
                    ))}
                  </div>
                  {cost.note ? <p className="mt-4 text-[12px] leading-5 text-slate-500">{cost.note}</p> : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-400">
                  <span>{cost.academicYear ? `Published period: ${cost.academicYear}` : 'Current official published figure'} · Verified {cost.verifiedAt}</span>
                  <a href={cost.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-bold text-red-600 hover:underline">
                    Official cost source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </section>
            </Reveal>
          ) : null}

          {u.campus ? (
            <Reveal delay={0.06} className="h-full">
              <section className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                    <Building2 className="h-4 w-4" />
                  </span>
                  Campus location
                </h2>
                <div className="mt-5 flex flex-1 flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div>
                    <p className="text-base font-black text-slate-900">{u.campus.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{u.campus.address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u.campus.mapsQuery)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white"
                    style={{ background: accent }}
                  >
                    <MapPin className="h-4 w-4" />
                    Open in Maps
                  </a>
                </div>
              </section>
            </Reveal>
          ) : null}
        </div>

        {/* ----------------------- Students & Staff (detailed) ----------------------- */}
        {hasDetailedStudents && students ? (
          <Reveal delay={0.04}>
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}>
                  <Users className="h-4 w-4" />
                </span>
                Students &amp; Staff
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <StudentStat
                  label="Total students"
                  total={students.total}
                  parts={[
                    { label: 'Undergraduate', value: students.undergraduate ?? 0, color: accent },
                    { label: 'Postgraduate', value: students.postgraduate ?? 0, color: '#94a3b8' },
                  ]}
                />
                <StudentStat
                  label="International students"
                  total={students.international ?? 0}
                  parts={[
                    { label: 'Undergraduate', value: students.internationalUndergraduate ?? 0, color: accent },
                    { label: 'Postgraduate', value: students.internationalPostgraduate ?? 0, color: '#94a3b8' },
                  ]}
                />
                <StudentStat
                  label="Total faculty staff"
                  total={students.facultyStaff ?? 0}
                  parts={[
                    { label: 'Domestic', value: students.domesticStaffPct ?? 0, color: accent, isPct: true },
                    { label: 'International', value: students.internationalStaffPct ?? 0, color: '#94a3b8', isPct: true },
                  ]}
                />
              </div>
            </section>
          </Reveal>
        ) : null}

        {u.sources && u.sources.length > 0 ? (
          <Reveal delay={0.04}>
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent }}><ExternalLink className="h-4 w-4" /></span>
                Official sources
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {u.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:text-red-700">
                    {source.label}<ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        <Reveal delay={0.04}>
          <p className="flex items-center justify-center gap-2 pb-2 text-center text-[12px] font-medium text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Rankings from {QS_EDITION}; available admissions and student costs from official university sources.
          </p>
        </Reveal>
      </div>
    </div>
  )
}

/* --------------------------- small presentational helpers --------------------------- */

function RankCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Trophy
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <Icon className="h-5 w-5" style={{ color: accent }} />
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-[12px] font-semibold leading-snug text-slate-500">{label}</p>
    </div>
  )
}

function StudentStat({
  label,
  total,
  parts,
}: {
  label: string
  total: number
  parts: { label: string; value: number; color: string; isPct?: boolean }[]
}) {
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{total.toLocaleString()}</p>
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.value / sum) * 100}%`, background: p.color }} />
        ))}
      </div>
      <div className="mt-2.5 space-y-1">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center justify-between text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-bold text-slate-800">{p.isPct ? `${p.value}%` : p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
