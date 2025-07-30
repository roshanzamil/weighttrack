import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type WorkoutSet } from "@/lib/types";
import { History, Calendar, Weight, Repeat } from "lucide-react";
import { format } from 'date-fns';

interface WorkoutHistoryProps {
  workouts: WorkoutSet[];
}

export function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Workout History
        </CardTitle>
        <CardDescription>Your last 10 logged sets.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.length > 0 ? (
                workouts.slice(0, 10).map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>
                      <div className="font-medium">{workout.exerciseName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(workout.date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono">{workout.weight}kg</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Repeat className="h-3 w-3" />
                        {workout.reps} reps
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">
                    No workouts logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
