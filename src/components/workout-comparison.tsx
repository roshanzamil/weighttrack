
import { type WorkoutSet } from "@/lib/types";
import { ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";

interface WorkoutComparisonProps {
  latestSession: WorkoutSet[];
  previousSession: WorkoutSet[];
}

function calculateStats(session: WorkoutSet[]) {
  if (!session || session.length === 0) {
    return { sets: 0, reps: 0, volume: 0, avgWeight: 0 };
  }
  const sets = session.length;
  const reps = session.reduce((sum, s) => sum + s.reps, 0);
  const volume = session.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const avgWeight = reps > 0 ? volume / reps : 0;
  return { sets, reps, volume, avgWeight };
}

function StatCard({ title, value, change, percentage, colorClass }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  return (
    <div className="flex items-start gap-4">
       <div className={`w-1.5 h-12 rounded-full ${colorClass}`}></div>
       <div>
            <div className="text-muted-foreground text-sm">{title}</div>
            <div className="text-xl font-bold">{value}</div>
            {change !== null && (
                 <div className="flex items-center text-xs">
                    {isPositive && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {isNegative && <ArrowDown className="w-3 h-3 text-red-500" />}
                    <span className={`${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {change.toFixed(1)} ({percentage}%)
                    </span>
                </div>
            )}
       </div>
    </div>
  );
}

export function WorkoutComparison({ latestSession, previousSession }: WorkoutComparisonProps) {
  const latestStats = calculateStats(latestSession);
  const previousStats = calculateStats(previousSession);

  if (latestSession.length === 0) return null;

  const getChange = (latest, previous) => {
    if (previous === 0) return { change: null, percentage: null };
    const change = latest - previous;
    const percentage = (change / previous) * 100;
    return { change, percentage: isNaN(percentage) ? 0 : percentage.toFixed(1) };
  };
  
  const setsChange = getChange(latestStats.sets, previousStats.sets);
  const repsChange = getChange(latestStats.reps, previousStats.reps);
  const volumeChange = getChange(latestStats.volume, previousStats.volume);
  const avgWeightChange = getChange(latestStats.avgWeight, previousStats.avgWeight);


  return (
    <div className="bg-card p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
        <ArrowLeftRight className="w-4 h-4"/>
        COMPARED TO PREVIOUS
      </div>
      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
        <StatCard 
            title="Sets"
            value={latestStats.sets}
            change={setsChange.change}
            percentage={setsChange.percentage}
            colorClass="bg-pink-500"
        />
        <StatCard 
            title="Reps"
            value={latestStats.reps}
            change={repsChange.change}
            percentage={repsChange.percentage}
            colorClass="bg-green-500"
        />
        <StatCard 
            title="Volume (kg)"
            value={latestStats.volume.toFixed(0)}
            change={volumeChange.change}
            percentage={volumeChange.percentage}
            colorClass="bg-sky-500"
        />
        <StatCard 
            title="kg/rep"
            value={latestStats.avgWeight.toFixed(1)}
            change={avgWeightChange.change}
            percentage={avgWeightChange.percentage}
            colorClass="bg-yellow-500"
        />
      </div>
    </div>
  );
}
