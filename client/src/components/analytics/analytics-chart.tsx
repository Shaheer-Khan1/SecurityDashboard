import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Activity } from "lucide-react";

interface ChartDataPoint {
  time: string;
  events: number;
  motion?: number;
  intrusions?: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  title?: string;
  isLoading?: boolean;
  type?: "line" | "area";
}

export function AnalyticsChart({ 
  data, 
  title = "Event Timeline", 
  isLoading,
  type = "area"
}: AnalyticsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md animate-pulse">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
            <div className="text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Chart = type === "area" ? AreaChart : LineChart;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMotion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.375rem",
                }}
                labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
              {type === "area" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                    name="Total Events"
                  />
                  {data[0]?.motion !== undefined && (
                    <Area
                      type="monotone"
                      dataKey="motion"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMotion)"
                      name="Motion Events"
                    />
                  )}
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    name="Total Events"
                  />
                  {data[0]?.motion !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="motion"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                      name="Motion Events"
                    />
                  )}
                </>
              )}
            </Chart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
