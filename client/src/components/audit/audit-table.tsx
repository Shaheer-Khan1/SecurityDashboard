import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Server, Shield, Clock } from "lucide-react";
import type { AuditLog } from "@shared/schema";
import { format } from "date-fns";

interface AuditTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const categoryIcons = {
  USER_ACTION: User,
  SERVER_CONNECTION: Server,
  SYSTEM: Clock,
  SECURITY: Shield,
};

const categoryColors = {
  USER_ACTION: "default" as const,
  SERVER_CONNECTION: "secondary" as const,
  SYSTEM: "outline" as const,
  SECURITY: "destructive" as const,
};

export function AuditTable({ logs, isLoading }: AuditTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[140px]">Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="w-[120px]">User</TableHead>
                <TableHead className="w-[140px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2 opacity-50" />
                      <p>No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const CategoryIcon = categoryIcons[log.category];
                  return (
                    <TableRow key={log.id} data-testid={`audit-row-${log.id}`}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={categoryColors[log.category]} className="text-xs">
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {log.category.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.action}</span>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                            {log.details}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
