import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, CalendarDays, ShieldCheck } from "lucide-react";

import GameCard from "@/components/GameCard";
import { useAuth } from "@/lib/AuthContext";
import { listAllPicks, createPick, updatePick } from "@/api/pick";
import { listUsers } from "@/api/user";
import { getGamesForWeek } from "@/api/espn";

function getDisplayName(profile, userId) {
  return (
    profile?.username ||
    profile?.nickname ||
    profile?.name ||
    userId ||
    "Unknown"
  );
}

function buildWeekOptions(seasonType) {
  if (Number(seasonType) === 3) {
    return [
      { value: 1, label: "Wild Card" },
      { value: 2, label: "Divisional" },
      { value: 3, label: "Conference" },
      { value: 4, label: "Super Bowl" },
    ];
  }

  return Array.from({ length: 18 }, (_, i) => ({
    value: i + 1,
    label: `Week ${i + 1}`,
  }));
}

export default function Picks() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [seasonYear, setSeasonYear] = useState(2025);
  const [seasonType, setSeasonType] = useState(2); // 2=regular, 3=postseason
  const [week, setWeek] = useState(1);

  const weekOptions = useMemo(() => buildWeekOptions(seasonType), [seasonType]);

  const {
    data: games = [],
    isLoading: isLoadingGames,
    error: gamesError,
  } = useQuery({
    queryKey: ["games", seasonYear, seasonType, week],
    queryFn: () =>
      getGamesForWeek({
        seasonYear,
        seasonType,
        week,
      }),
  });

  const {
    data: picks = [],
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: ["all-picks"],
    queryFn: () => listAllPicks(),
  });

  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    error: profilesError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
  });

  const myProfile = useMemo(() => {
    return profiles.find((p) => p.user_id === user?.uid) || null;
  }, [profiles, user]);

  const isAdmin = myProfile?.role === "admin";

  const filteredPicks = useMemo(() => {
    return picks.filter(
      (pick) =>
        Number(pick.season_year) === Number(seasonYear) &&
        Number(pick.season_type) === Number(seasonType) &&
        Number(pick.week) === Number(week),
    );
  }, [picks, seasonYear, seasonType, week]);

  const weeklyLeader = useMemo(() => {
    const completedPicks = filteredPicks.filter((pick) => pick.game_completed);
    if (!completedPicks.length) return null;

    const scoreMap = {};

    for (const pick of completedPicks) {
      const userId = pick.user_id;
      if (!userId) continue;

      if (!scoreMap[userId]) {
        scoreMap[userId] = { correct: 0, total: 0 };
      }

      scoreMap[userId].total += 1;
      if (pick.is_correct) scoreMap[userId].correct += 1;
    }

    let best = null;

    Object.entries(scoreMap).forEach(([userId, stats]) => {
      const pct = stats.total ? (stats.correct / stats.total) * 100 : 0;
      const profile = profiles.find((p) => p.user_id === userId);

      const candidate = {
        userId,
        username: getDisplayName(profile, userId),
        correct: stats.correct,
        total: stats.total,
        pct,
      };

      if (!best) {
        best = candidate;
        return;
      }

      if (candidate.correct > best.correct) {
        best = candidate;
        return;
      }

      if (candidate.correct === best.correct && candidate.pct > best.pct) {
        best = candidate;
      }
    });

    return best;
  }, [filteredPicks, profiles]);

  const pickMutation = useMutation({
    mutationFn: async ({ gameId, teamId, teamName, teamAbbrev, userId }) => {
      const existing = filteredPicks.find(
        (p) =>
          String(p.game_id) === String(gameId) &&
          String(p.user_id) === String(userId),
      );

      const pickData = {
        user_id: userId,
        game_id: String(gameId),
        season_year: Number(seasonYear),
        season_type: Number(seasonType),
        week: Number(week),
        picked_team_id: String(teamId),
        picked_team_name: teamName || "",
        picked_team_abbrev: teamAbbrev || "",
        is_correct: existing?.is_correct ?? false,
        game_completed: existing?.game_completed ?? false,
      };

      if (existing) {
        return updatePick(existing.id, {
          picked_team_id: String(teamId),
          picked_team_name: teamName || "",
          picked_team_abbrev: teamAbbrev || "",
          updated_at: Date.now(),
        });
      }

      return createPick(pickData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all-picks"] });
    },
  });

  const handlePickTeam = useCallback(
    (gameId, teamId, teamName, teamAbbrev, userId) => {
      if (!user) return;

      if (!isAdmin && userId !== user.uid) return;

      pickMutation.mutate({
        gameId,
        teamId,
        teamName,
        teamAbbrev,
        userId,
      });
    },
    [user, isAdmin, pickMutation],
  );

  const gamesWithSort = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [games]);

  const isLoading = isLoadingGames || isLoadingPicks || isLoadingProfiles;
  const hasError = gamesError || picksError || profilesError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-oswald text-3xl font-bold uppercase tracking-wide text-foreground">
            Picks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Make your NFL picks and review past selections by week
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pr-1">
              Season Year
            </label>
            <select
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pr-1">
              Season Type
            </label>
            <select
              value={seasonType}
              onChange={(e) => {
                const nextType = Number(e.target.value);
                setSeasonType(nextType);
                setWeek(1);
              }}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value={2}>Regular Season</option>
              <option value={3}>Postseason</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pr-1">
              Week
            </label>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Sign in with Firebase to make picks. You can still browse games and
          previous results.
        </div>
      )}

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Admin Mode Enabled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You can set picks for any player shown in the weekly game cards.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {weeklyLeader && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Leader
              </p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {weeklyLeader.username}
              </p>
              <p className="text-sm text-muted-foreground">
                {weeklyLeader.correct}/{weeklyLeader.total} correct
                {" · "}
                {weeklyLeader.pct.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {seasonYear}{" "}
            {Number(seasonType) === 2 ? "Regular Season" : "Postseason"} ·{" "}
            {weekOptions.find((w) => w.value === week)?.label || `Week ${week}`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Picks shown below are filtered to the selected season, type, and week.
        </p>
      </motion.div>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          <div className="h-40 rounded-xl border border-border bg-card animate-pulse" />
          <div className="h-40 rounded-xl border border-border bg-card animate-pulse" />
        </div>
      )}

      {hasError && !isLoading && (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive">
          Failed to load games or picks.
        </div>
      )}

      {!isLoading && !hasError && gamesWithSort.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No games found for this selection.
        </div>
      )}

      {!isLoading && !hasError && gamesWithSort.length > 0 && (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {gamesWithSort.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              picks={filteredPicks}
              profiles={profiles}
              currentUserUid={user?.uid}
              isAdmin={isAdmin}
              onPickTeam={handlePickTeam}
            />
          ))}
        </div>
      )}
    </div>
  );
}
