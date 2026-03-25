import { redirect } from 'next/navigation'

export const revalidate = 3600

function searchParamsToQueryString(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v)
    } else {
      sp.set(key, value)
    }
  }
  return sp.toString()
}

export default async function LeagueStandingsRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ scope: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { scope } = await params
  const query = await searchParams
  const q = searchParamsToQueryString(query)
  redirect(q ? `/league/${scope}?${q}` : `/league/${scope}`)
}
