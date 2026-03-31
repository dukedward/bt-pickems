const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getCompetitorByHomeAway(competitors, homeAway) {
  return competitors.find((c) => c.homeAway === homeAway) || null;
}

function getTeamRecord(competitor) {
  const records = competitor?.records || [];
  const overall =
    records.find((r) => r.type === "total") ||
    records.find((r) => r.name?.toLowerCase() === "overall") ||
    records[0];

  return overall?.summary || "";
}

function getBroadcastName(event) {
  const broadcast =
    event?.competitions?.[0]?.broadcasts?.[0]?.names?.[0] ||
    event?.competitions?.[0]?.broadcast ||
    "";

  return broadcast || "";
}

function getStatusState(event) {
  const state = event?.status?.type?.state;

  if (state === "pre") return "pre";
  if (state === "in") return "in";
  if (state === "post") return "post";

  if (event?.status?.type?.completed) return "post";
  return "pre";
}

function getSeasonTypeLabel(seasonType) {
  const type = Number(seasonType);
  if (type === 1) return "Preseason";
  if (type === 2) return "Regular Season";
  if (type === 3) return "Postseason";
  return "Season";
}

function normalizeEvent(event) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];

  const home = getCompetitorByHomeAway(competitors, "home");
  const away = getCompetitorByHomeAway(competitors, "away");

  if (!home || !away) {
    return null;
  }

  const state = getStatusState(event);
  const completed = !!event?.status?.type?.completed;

  const homeTeam = {
    id: String(home.team?.id || ""),
    name: home.team?.displayName || home.team?.name || "Home",
    abbreviation: home.team?.abbreviation || "",
    logo:
      home.team?.logo ||
      "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png",
    score: toNumber(home.score, 0),
    winner: !!home.winner,
    record: getTeamRecord(home),
  };

  const awayTeam = {
    id: String(away.team?.id || ""),
    name: away.team?.displayName || away.team?.name || "Away",
    abbreviation: away.team?.abbreviation || "",
    logo:
      away.team?.logo ||
      "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png",
    score: toNumber(away.score, 0),
    winner: !!away.winner,
    record: getTeamRecord(away),
  };

  return {
    id: String(event.id),
    uid: event.uid || String(event.id),
    name: event.name || `${awayTeam.name} at ${homeTeam.name}`,
    shortName:
      event.shortName || `${awayTeam.abbreviation} @ ${homeTeam.abbreviation}`,
    date: event.date,
    broadcast: getBroadcastName(event),
    note: competition?.notes?.[0]?.headline || "",
    status: {
      state,
      completed,
      period: toNumber(event?.status?.period, 0),
      clock: event?.status?.displayClock || event?.status?.clock || "",
      detail:
        event?.status?.type?.shortDetail || event?.status?.type?.detail || "",
      description: event?.status?.type?.description || "",
    },
    homeTeam,
    awayTeam,
    venue: competition?.venue?.fullName || "",
    season: {
      year: toNumber(event?.season?.year, 0),
      type: toNumber(event?.season?.type, 0),
      slug: event?.season?.slug || "",
    },
    week: {
      number: toNumber(event?.week?.number, 0),
    },
    raw: event,
  };
}

export function espnScoreboardUrlForWeek({
  seasonYear,
  seasonType = 2,
  week = 1,
}) {
  const url = new URL(ESPN_BASE);
  url.searchParams.set("dates", String(seasonYear));
  url.searchParams.set("seasontype", String(seasonType));
  url.searchParams.set("week", String(week));
  return url.toString();
}

export async function getGamesForWeek({
  seasonYear,
  seasonType = 2,
  week = 1,
}) {
  const url = espnScoreboardUrlForWeek({
    seasonYear,
    seasonType,
    week,
  });

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`ESPN request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return events
    .map(normalizeEvent)
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function getCurrentNflWeek() {
  const res = await fetch(ESPN_BASE);

  if (!res.ok) {
    throw new Error(`ESPN request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const seasonYear = toNumber(data?.season?.year, new Date().getFullYear());
  const seasonType = toNumber(data?.season?.type, 2);
  const week = toNumber(data?.week?.number, 1);

  return {
    seasonYear,
    seasonType,
    seasonTypeLabel: getSeasonTypeLabel(seasonType),
    week,
    displayName:
      data?.week?.text || `${getSeasonTypeLabel(seasonType)} Week ${week}`,
    raw: data,
  };
}

export async function getGameById({
  gameId,
  seasonYear,
  seasonType = 2,
  week = 1,
}) {
  const games = await getGamesForWeek({ seasonYear, seasonType, week });
  return games.find((g) => String(g.id) === String(gameId)) || null;
}
