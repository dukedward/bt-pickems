import { useEffect, useRef, useState } from "react";
import { fetchScoreboard, parseGames } from "@/lib/espn";
import { toast } from "sonner";
import { Radio } from "lucide-react";

const POLL_INTERVAL = 45000; // 45 seconds

export default function LiveGameAlerts() {
  const prevGamesRef = useRef({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function checkGames() {
      try {
        const data = await fetchScoreboard();
        const games = parseGames(data);
        const prev = prevGamesRef.current;

        games.forEach((game) => {
          const key = game.id;
          const prevGame = prev[key];

          // First load - just store, no alerts
          if (!initialized) {
            prev[key] = game;
            return;
          }

          // Game just went live
          if (prevGame?.status.state === "pre" && game.status.state === "in") {
            toast.custom(
              (id) => (
                <div className="flex items-center gap-3 bg-card border border-red-500/30 text-foreground rounded-xl px-4 py-3 shadow-lg max-w-xs">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                      Game Started
                    </p>
                    <p className="text-sm font-medium">
                      {game.awayTeam.abbreviation} @{" "}
                      {game.homeTeam.abbreviation}
                    </p>
                  </div>
                </div>
              ),
              { duration: 6000 },
            );
          }

          // Score changed while live
          if (
            prevGame &&
            game.status.state === "in" &&
            (prevGame.awayTeam.score !== game.awayTeam.score ||
              prevGame.homeTeam.score !== game.homeTeam.score)
          ) {
            toast.custom(
              (id) => (
                <div className="flex items-center gap-3 bg-card border border-border text-foreground rounded-xl px-4 py-3 shadow-lg max-w-xs">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Score Update · Q{game.status.period} {game.status.clock}
                    </p>
                    <p className="text-sm font-bold">
                      {game.awayTeam.abbreviation} {game.awayTeam.score} –{" "}
                      {game.homeTeam.score} {game.homeTeam.abbreviation}
                    </p>
                  </div>
                </div>
              ),
              { duration: 5000 },
            );
          }

          // Game just ended
          if (prevGame?.status.state === "in" && game.status.completed) {
            const winner = game.awayTeam.winner ? game.awayTeam : game.homeTeam;
            const loser = game.awayTeam.winner ? game.homeTeam : game.awayTeam;
            toast.custom(
              (id) => (
                <div className="flex items-center gap-3 bg-card border border-accent/30 text-foreground rounded-xl px-4 py-3 shadow-lg max-w-xs">
                  <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-accent uppercase tracking-wide">
                      Final
                    </p>
                    <p className="text-sm font-bold">
                      {winner.abbreviation} wins · {game.awayTeam.score}–
                      {game.homeTeam.score}
                    </p>
                  </div>
                </div>
              ),
              { duration: 8000 },
            );
          }

          prev[key] = game;
        });

        if (!initialized) {
          setInitialized(true);
        }
        prevGamesRef.current = { ...prev };
      } catch {
        // Silent fail
      }
    }

    checkGames();
    const interval = setInterval(checkGames, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [initialized]);

  return null;
}
