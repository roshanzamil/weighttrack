"use client"

import { type WorkoutSet } from "@/lib/types";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format } from "date-fns";

interface ProgressChartProps {
    data: WorkoutSet[];
}

const chartConfig = {
    weight: {
        label: "Weight (kg)",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

export function ProgressChart({ data }: ProgressChartProps) {
    if (data.length < 2) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Not enough data to display a chart. Log at least two sets.</p>
            </div>
        )
    }

    const chartData = data.map(item => ({
        date: format(new Date(item.date), 'MMM d'),
        weight: item.weight,
        reps: item.reps,
    }));

    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 6)}
                    />
                <YAxis 
                    dataKey="weight"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `${value}`}
                 />
                <Tooltip content={<ChartTooltipContent formatter={(value, name, props) => (
                    <div>
                        <div className="font-bold">{props.payload.date}</div>
                        <div>Weight: {props.payload.weight}kg</div>
                        <div>Reps: {props.payload.reps}</div>
                    </div>
                )} />} />
                <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="var(--color-weight)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#fillWeight)"
                 />
            </AreaChart>
        </ChartContainer>
    );
}
