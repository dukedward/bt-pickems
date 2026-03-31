const BASE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export async function fetchScoreboard(seasonType, week, year) {
  const params = new URLSearchParams();
  if (seasonType) params.set("seasontype", seasonType);
  if (week) params.set("week", week);
  if (year) params.set("dates", year);

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch scoreboard");
  return res.json();
}

export function parseGames(data) {
  if (!data?.events) return [];

  return data.events.map((event) => {
    const comp = event.competitions[0];
    const homeTeam = comp.competitors.find((c) => c.homeAway === "home");
    const awayTeam = comp.competitors.find((c) => c.homeAway === "away");
    const status = comp.status;

    const note = comp.notes?.[0]?.headline || "";

    return {
      id: event.id,
      date: event.date,
      name: event.name,
      shortName: event.shortName,
      note,
      status: {
        state: status.type.state,
        detail: status.type.detail,
        shortDetail: status.type.shortDetail,
        completed: status.type.completed,
        period: status.period,
        clock: status.displayClock,
      },
      homeTeam: {
        id: homeTeam.team.id,
        name: homeTeam.team.name,
        displayName: homeTeam.team.displayName,
        abbreviation: homeTeam.team.abbreviation,
        logo: homeTeam.team.logo,
        color: homeTeam.team.color,
        altColor: homeTeam.team.alternateColor,
        score: homeTeam.score || "0",
        winner: homeTeam.winner,
        record: homeTeam.records?.[0]?.summary || "",
      },
      awayTeam: {
        id: awayTeam.team.id,
        name: awayTeam.team.name,
        displayName: awayTeam.team.displayName,
        abbreviation: awayTeam.team.abbreviation,
        logo: awayTeam.team.logo,
        color: awayTeam.team.color,
        altColor: awayTeam.team.alternateColor,
        score: awayTeam.score || "0",
        winner: awayTeam.winner,
        record: awayTeam.records?.[0]?.summary || "",
      },
      broadcast: comp.broadcasts?.[0]?.names?.[0] || "",
    };
  });
}

export function parseCalendar(data) {
  if (!data?.leagues?.[0]?.calendar) return [];
  return data.leagues[0].calendar;
}

export function getCurrentSeason(data) {
  if (!data?.leagues?.[0]?.season) return { year: 2025, type: 2 };
  const s = data.leagues[0].season;
  return { year: s.year, type: s.type.type };
}

export function getCurrentWeek(data) {
  if (!data?.week) return 1;
  return data.week.number;
}
