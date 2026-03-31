import { motion } from "framer-motion";
import { Check, Clock, Radio } from "lucide-react";
import { format } from "date-fns";

export default function GameCard({
  game,
  picks,
  profiles,
  currentUserUid,
  isAdmin,
  onPickTeam,
}) {
  const { homeTeam, awayTeam, status } = game;
  const isCompleted = status.completed;
  const isLive = status.state === "in";
  const isPre = status.state === "pre";

  const gameDate = new Date(game.date);
  const formattedTime = format(gameDate, "EEE, MMM d · h:mm a");

  // Get picks for this game
  const gamePicks = picks.filter((p) => String(p.game_id) === String(game.id));

  const getPickForUser = (userId) => {
    return gamePicks.find((p) => p.user_id === userId);
  };

  const getUserProfile = (userId) => {
    return profiles.find((p) => p.user_id === userId);
  };

  const getDisplayName = (profile, userId) => {
    return (
      profile?.username ||
      profile?.nickname ||
      profile?.name ||
      userId ||
      "Unknown"
    );
  };

  const handlePick = (teamId, teamName, teamAbbrev) => {
    if (isCompleted || isLive) return;
    onPickTeam(game.id, teamId, teamName, teamAbbrev, currentUserUid);
  };

  const handleAdminPick = (teamId, teamName, teamAbbrev, userId) => {
    onPickTeam(game.id, teamId, teamName, teamAbbrev, userId);
  };

  const currentUserPick = getPickForUser(currentUserUid);

  const allUserIds = [
    ...new Set([
      ...profiles.map((p) => p.user_id).filter(Boolean),
      ...gamePicks.map((p) => p.user_id).filter(Boolean),
    ]),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <Check className="w-3 h-3" />
              FINAL
            </span>
          )}
          {isPre && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formattedTime}
            </span>
          )}
        </div>
        {game.broadcast && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {game.broadcast}
          </span>
        )}
      </div>

      {game.note && (
        <div className="px-4 py-1.5 bg-primary/5 border-b border-border">
          <p className="text-[11px] font-semibold text-primary tracking-wide uppercase">
            {game.note}
          </p>
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <TeamBlock
            team={awayTeam}
            isPicked={
              String(currentUserPick?.picked_team_id) === String(awayTeam.id)
            }
            canPick={isPre && !isAdmin}
            onPick={() =>
              handlePick(awayTeam.id, awayTeam.name, awayTeam.abbreviation)
            }
            side="away"
            isCompleted={isCompleted}
          />

          <div className="text-center">
            {isPre ? (
              <span className="text-xs font-bold text-muted-foreground tracking-widest">
                VS
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-oswald font-bold ${
                    awayTeam.winner
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {awayTeam.score}
                </span>
                <span className="text-xs text-muted-foreground">-</span>
                <span
                  className={`text-2xl font-oswald font-bold ${
                    homeTeam.winner
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {homeTeam.score}
                </span>
              </div>
            )}
            {isLive && (
              <p className="text-[10px] text-red-500 font-medium mt-0.5">
                Q{status.period} · {status.clock}
              </p>
            )}
          </div>

          <TeamBlock
            team={homeTeam}
            isPicked={
              String(currentUserPick?.picked_team_id) === String(homeTeam.id)
            }
            canPick={isPre && !isAdmin}
            onPick={() =>
              handlePick(homeTeam.id, homeTeam.name, homeTeam.abbreviation)
            }
            side="home"
            isCompleted={isCompleted}
          />
        </div>

        {allUserIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Picks
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allUserIds.map((userId) => {
                const pick = getPickForUser(userId);
                const profile = getUserProfile(userId);
                const displayName = getDisplayName(profile, userId);
                const isCorrect = pick?.is_correct;
                const isWrong = pick?.game_completed && !pick?.is_correct;

                return (
                  <div
                    key={userId}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      isCorrect
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : isWrong
                          ? "bg-destructive/10 border-destructive/30 text-destructive"
                          : pick
                            ? "bg-primary/5 border-primary/20 text-foreground"
                            : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[9px] font-bold">
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium truncate">{displayName}</span>
                    {pick ? (
                      <span className="ml-auto font-bold text-[10px]">
                        {pick.picked_team_abbrev || "—"}
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] italic">—</span>
                    )}
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <AdminPickControls
                allUserIds={allUserIds}
                profiles={profiles}
                gamePicks={gamePicks}
                awayTeam={awayTeam}
                homeTeam={homeTeam}
                onPick={handleAdminPick}
                getUserProfile={getUserProfile}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TeamBlock({ team, isPicked, canPick, onPick, side, isCompleted }) {
  const align = side === "away" ? "text-right" : "text-left";
  const flexDir = side === "away" ? "flex-row-reverse" : "flex-row";

  return (
    <button
      onClick={canPick ? onPick : undefined}
      className={`flex items-center gap-3 ${flexDir} ${
        canPick ? "cursor-pointer" : "cursor-default"
      } group relative rounded-lg p-2 transition-all ${
        isPicked
          ? "bg-primary/10 ring-2 ring-primary/30"
          : canPick
            ? "hover:bg-muted"
            : ""
      }`}
    >
      <img
        src={team.logo}
        alt={team.name}
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
      />
      <div className={align}>
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            isCompleted && team.winner
              ? "text-muted-foreground"
              : isCompleted
                ? "text-muted-foreground"
                : "text-foreground"
          }`}
        >
          {team.abbreviation}
        </p>
        <p className="text-[10px] text-muted-foreground hidden sm:block">
          {team.record}
        </p>
      </div>
      {isPicked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

function AdminPickControls({
  allUserIds,
  profiles,
  gamePicks,
  awayTeam,
  homeTeam,
  onPick,
  getUserProfile,
}) {
  const getDisplayName = (profile, userId) => {
    return (
      profile?.username ||
      profile?.nickname ||
      profile?.name ||
      userId ||
      "Unknown"
    );
  };

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Admin: Set Picks
      </p>
      <div className="space-y-1.5">
        {allUserIds.map((userId) => {
          const profile = getUserProfile(userId);
          const displayName = getDisplayName(profile, userId);
          const userPick = gamePicks.find((p) => p.user_id === userId);

          return (
            <div key={userId} className="flex items-center gap-2 text-xs">
              <span className="font-medium w-20 truncate">{displayName}</span>
              <button
                onClick={() =>
                  onPick(
                    awayTeam.id,
                    awayTeam.name,
                    awayTeam.abbreviation,
                    userId,
                  )
                }
                className={`px-2 py-1 rounded border transition-all ${
                  String(userPick?.picked_team_id) === String(awayTeam.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {awayTeam.abbreviation}
              </button>
              <button
                onClick={() =>
                  onPick(
                    homeTeam.id,
                    homeTeam.name,
                    homeTeam.abbreviation,
                    userId,
                  )
                }
                className={`px-2 py-1 rounded border transition-all ${
                  String(userPick?.picked_team_id) === String(homeTeam.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {homeTeam.abbreviation}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
