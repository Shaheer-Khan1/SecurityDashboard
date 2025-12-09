import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AuditTable } from "@/components/audit/audit-table";
import { SearchInput } from "@/components/search-input";
import { CalendarIcon, Download, RefreshCcw, Filter } from "lucide-react";
import { format } from "date-fns";
import type { AuditLog, AuditSearchParams } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AuditPage() {
  const [filters, setFilters] = useState<Partial<AuditSearchParams>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [category, setCategory] = useState<string>("all");
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit/logs", filters],
  });

  const handleSearch = () => {
    setFilters({
      keyword: searchKeyword || undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      category: category !== "all" ? category as any : undefined,
    });
  };

  const handleClear = () => {
    setSearchKeyword("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCategory("all");
    setFilters({});
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your audit logs are being prepared for download.",
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        log.action.toLowerCase().includes(keyword) ||
        log.user?.toLowerCase().includes(keyword) ||
        log.details?.toLowerCase().includes(keyword)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            System activity logs and user actions history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-audit">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-audit">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <SearchInput
                  placeholder="Search by keyword..."
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  onSearch={handleSearch}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-audit-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PP") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-audit-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PP") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-audit-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="USER_ACTION">User Action</SelectItem>
                    <SelectItem value="SERVER_CONNECTION">Server Connection</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={handleClear} data-testid="button-clear-audit-filters">
                Clear
              </Button>
              <Button onClick={handleSearch} data-testid="button-search-audit">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuditTable logs={filteredLogs} isLoading={isLoading} />
    </div>
  );
}
