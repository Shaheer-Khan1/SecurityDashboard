import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Camera, MoreVertical, Trash2, Edit2, Play, Clock } from "lucide-react";
import type { Bookmark as BookmarkType } from "@shared/schema";
import { format } from "date-fns";

interface BookmarkCardProps {
  bookmark: BookmarkType;
  onPlay?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const colorClasses = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500",
};

export function BookmarkCard({ bookmark, onPlay, onEdit, onDelete }: BookmarkCardProps) {
  return (
    <Card className="overflow-hidden" data-testid={`bookmark-card-${bookmark.id}`}>
      <CardHeader className="p-4 pb-2 flex-row items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-1 h-12 rounded-full ${colorClasses[bookmark.color]}`} />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate" data-testid={`bookmark-title-${bookmark.id}`}>
              {bookmark.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(`${bookmark.startDate}T${bookmark.startTime}`), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPlay?.(bookmark.id)}>
              <Play className="h-4 w-4 mr-2" />
              Play Recording
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(bookmark.id)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(bookmark.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {bookmark.remarks && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {bookmark.remarks}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Camera className="h-3 w-3 text-muted-foreground" />
          {bookmark.cameras.slice(0, 3).map((camera) => (
            <Badge key={camera} variant="secondary" className="text-xs">
              {camera}
            </Badge>
          ))}
          {bookmark.cameras.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{bookmark.cameras.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
