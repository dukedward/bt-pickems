import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEASON_TYPES = [
  { value: "1", label: "Preseason" },
  { value: "2", label: "Regular Season" },
  { value: "3", label: "Postseason" },
];

export default function WeekSelector({
  calendar,
  seasonType,
  week,
  onSeasonTypeChange,
  onWeekChange,
}) {
  const currentCalendar = calendar.find((c) => c.value === String(seasonType));
  const weeks = currentCalendar?.entries || [];
  const currentWeekIdx = weeks.findIndex(
    (w) => String(w.value) === String(week),
  );

  const canPrev = currentWeekIdx > 0;
  const canNext = currentWeekIdx < weeks.length - 1;

  const currentWeekLabel = weeks[currentWeekIdx]?.label || `Week ${week}`;
  const currentWeekDetail = weeks[currentWeekIdx]?.detail || "";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Select
        value={String(seasonType)}
        onValueChange={(v) => onSeasonTypeChange(Number(v))}
      >
        <SelectTrigger className="w-45 bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SEASON_TYPES.map((st) => (
            <SelectItem key={st.value} value={st.value}>
              {st.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canPrev}
          onClick={() => onWeekChange(Number(weeks[currentWeekIdx - 1].value))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="text-center min-w-35">
          <p className="text-sm font-semibold text-foreground">
            {currentWeekLabel}
          </p>
          {currentWeekDetail && (
            <p className="text-[11px] text-muted-foreground">
              {currentWeekDetail}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canNext}
          onClick={() => onWeekChange(Number(weeks[currentWeekIdx + 1].value))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
