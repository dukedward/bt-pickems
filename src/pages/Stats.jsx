import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  BarChart3,
  Crown,
  Medal,
  Award,
  TrendingUp,
} from "lucide-react";
import { listAllPicks } from "@/api/pick";
import { listUsers } from "@/api/user";
import { useAuth } from "@/lib/AuthContext";

function getDisplayName(profile, userId) {
  return (
    profile?.username ||
    profile?.nickname ||
    profile?.name ||
    userId ||
    "Unknown"
  );
}

function getAvatar(profile, fallbackName) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className="w-10 h-10 rounded-full object-cover border border-border"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border text-sm font-bold text-foreground">
      {fallbackName?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function calcWinPct(correct, total) {
  if (!total) return 0;
  return (correct / total) * 100;
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-oswald font-bold text-foreground">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const { user } = useAuth();
  const [seasonYear, setSeasonYear] = useState(2025);
  const [seasonType, setSeasonType] = useState(2);

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

  const filteredPicks = useMemo(() => {
    return picks.filter(
      (pick) =>
        Number(pick.season_year) === Number(seasonYear) &&
        Number(pick.season_type) === Number(seasonType),
    );
  }, [picks, seasonYear, seasonType]);

  const leaderboard = useMemo(() => {
    const statsMap = {};

    for (const pick of filteredPicks) {
      const userId = pick.user_id;
      if (!userId) continue;

      if (!statsMap[userId]) {
        statsMap[userId] = {
          userId,
          total: 0,
          correct: 0,
          incorrect: 0,
          completed: 0,
          pending: 0,
          weeks: new Set(),
          weekly: {},
        };
      }

      const entry = statsMap[userId];
      const week = Number(pick.week || 0);

      entry.total += 1;
      entry.weeks.add(week);

      if (!entry.weekly[week]) {
        entry.weekly[week] = {
          correct: 0,
          total: 0,
        };
      }

      entry.weekly[week].total += 1;

      if (pick.game_completed) {
        entry.completed += 1;

        if (pick.is_correct) {
          entry.correct += 1;
          entry.weekly[week].correct += 1;
        } else {
          entry.incorrect += 1;
        }
      } else {
        entry.pending += 1;
      }
    }

    const rows = Object.values(statsMap).map((entry) => {
      const profile = profiles.find((p) => p.user_id === entry.userId);
      const displayName = getDisplayName(profile, entry.userId);
      const winPct = calcWinPct(entry.correct, entry.completed);

      return {
        ...entry,
        username: displayName,
        avatar_url: profile?.avatar_url || "",
        role: profile?.role || "player",
        color: profile?.color || "",
        weeks: Array.from(entry.weeks).sort((a, b) => a - b),
        winPct,
      };
    });

    rows.sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (b.winPct !== a.winPct) return b.winPct - a.winPct;
      if (a.incorrect !== b.incorrect) return a.incorrect - b.incorrect;
      return a.username.localeCompare(b.username);
    });

    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [filteredPicks, profiles]);

  const myStats = useMemo(() => {
    return leaderboard.find((row) => row.userId === user?.uid) || null;
  }, [leaderboard, user]);

  const seasonSummary = useMemo(() => {
    const totalPicks = filteredPicks.length;
    const completedPicks = filteredPicks.filter((p) => p.game_completed).length;
    const correctPicks = filteredPicks.filter(
      (p) => p.game_completed && p.is_correct,
    ).length;
    const accuracy = calcWinPct(correctPicks, completedPicks);

    return {
      totalPicks,
      completedPicks,
      correctPicks,
      accuracy,
      players: leaderboard.length,
    };
  }, [filteredPicks, leaderboard]);

  const weeklyLeaders = useMemo(() => {
    const weekMap = {};

    for (const row of leaderboard) {
      for (const week of Object.keys(row.weekly)) {
        const weekNum = Number(week);
        const stats = row.weekly[weekNum];
        const pct = calcWinPct(stats.correct, stats.total);

        if (!weekMap[weekNum]) {
          weekMap[weekNum] = [];
        }

        weekMap[weekNum].push({
          userId: row.userId,
          username: row.username,
          avatar_url: row.avatar_url,
          correct: stats.correct,
          total: stats.total,
          pct,
        });
      }
    }

    return Object.entries(weekMap)
      .map(([week, rows]) => {
        rows.sort((a, b) => {
          if (b.correct !== a.correct) return b.correct - a.correct;
          if (b.pct !== a.pct) return b.pct - a.pct;
          if (a.total !== b.total) return b.total - a.total;
          return a.username.localeCompare(b.username);
        });

        return {
          week: Number(week),
          leaders: rows,
          best: rows[0] || null,
        };
      })
      .sort((a, b) => a.week - b.week);
  }, [leaderboard]);

  if (isLoadingPicks || isLoadingProfiles) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (picksError || profilesError) {
    return (
      <div className="bg-card rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
        Failed to load stats.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-oswald text-3xl font-bold uppercase tracking-wide text-foreground">
            Stats
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Season leaderboard and weekly performance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Season Type
            </label>
            <select
              value={seasonType}
              onChange={(e) => setSeasonType(Number(e.target.value))}
              className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value={2}>Regular Season</option>
              <option value={3}>Postseason</option>
            </select>
          </div>
        </div>
      </div>

      {myStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="My Rank"
            value={`#${myStats.rank}`}
            subtitle={myStats.username}
            icon={Trophy}
          />
          <StatCard
            title="My Correct Picks"
            value={myStats.correct}
            subtitle={`${myStats.completed} completed games`}
            icon={Target}
          />
          <StatCard
            title="My Accuracy"
            value={`${myStats.winPct.toFixed(1)}%`}
            subtitle={`${myStats.incorrect} incorrect`}
            icon={TrendingUp}
          />
          <StatCard
            title="My Total Picks"
            value={myStats.total}
            subtitle={`${myStats.pending} pending`}
            icon={BarChart3}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Players"
          value={seasonSummary.players}
          subtitle="With recorded picks"
          icon={Crown}
        />
        <StatCard
          title="Season Picks"
          value={seasonSummary.totalPicks}
          subtitle={`${seasonSummary.completedPicks} completed`}
          icon={BarChart3}
        />
        <StatCard
          title="Correct Picks"
          value={seasonSummary.correctPicks}
          subtitle="Across all players"
          icon={Target}
        />
        <StatCard
          title="Overall Accuracy"
          value={`${seasonSummary.accuracy.toFixed(1)}%`}
          subtitle="Completed games only"
          icon={Award}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Leaderboard</h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No picks found for this season/year selection.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaderboard.map((row) => (
              <div
                key={row.userId}
                className="px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="w-8 text-sm font-oswald font-bold text-muted-foreground">
                  #{row.rank}
                </div>

                <div>{getAvatar(row, row.username)}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {row.username}
                    </p>
                    {row.role === "admin" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.correct} correct · {row.incorrect} wrong ·{" "}
                    {row.pending} pending
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-oswald font-bold text-foreground">
                    {row.winPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.completed} completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Medal className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Weekly Leaders</h2>
        </div>

        {weeklyLeaders.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No weekly data available.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {weeklyLeaders.map((weekRow) => (
              <div key={weekRow.week} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Week {weekRow.week}
                    </p>
                    {weekRow.best && (
                      <p className="text-xs text-muted-foreground">
                        Top performer: {weekRow.best.username} (
                        {weekRow.best.correct}/{weekRow.best.total},{" "}
                        {weekRow.best.pct.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {weekRow.leaders.map((leader, idx) => (
                    <div
                      key={`${weekRow.week}-${leader.userId}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                    >
                      <div className="w-6 text-xs font-bold text-muted-foreground">
                        #{idx + 1}
                      </div>

                      {leader.avatar_url ? (
                        <img
                          src={leader.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border text-xs font-bold">
                          {leader.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {leader.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leader.correct}/{leader.total} correct
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-foreground">
                        {leader.pct.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
