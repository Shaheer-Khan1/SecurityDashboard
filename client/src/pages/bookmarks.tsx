import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { AddBookmarkDialog } from "@/components/bookmarks/add-bookmark-dialog";
import { SearchInput } from "@/components/search-input";
import { Bookmark, Plus, RefreshCcw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Bookmark as BookmarkType, Camera, InsertBookmark } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const colorOptions = [
  { value: "all", label: "All Colors" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "gray", label: "Gray" },
];

export default function BookmarksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [colorFilter, setColorFilter] = useState("all");
  const { toast } = useToast();

  const { data: bookmarks = [], isLoading, refetch } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
  });

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const addBookmarkMutation = useMutation({
    mutationFn: async (data: InsertBookmark) => {
      return apiRequest("POST", "/api/bookmarks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setIsDialogOpen(false);
      toast({
        title: "Bookmark added",
        description: "Your bookmark has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bookmark.",
        variant: "destructive",
      });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/bookmarks/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark deleted",
        description: "The bookmark has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark.",
        variant: "destructive",
      });
    },
  });

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = colorFilter === "all" || bookmark.color === colorFilter;
    return matchesSearch && matchesColor;
  });

  const colorCounts = bookmarks.reduce((acc, b) => {
    acc[b.color] = (acc[b.color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Bookmarks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Save and organize important video segments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-bookmarks">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-bookmark">
            <Plus className="h-4 w-4 mr-2" />
            Add Bookmark
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="outline" className="text-xs">
          <Bookmark className="h-3 w-3 mr-1" />
          {bookmarks.length} Total
        </Badge>
        {Object.entries(colorCounts).map(([color, count]) => (
          <Badge
            key={color}
            variant="outline"
            className="text-xs cursor-pointer"
            onClick={() => setColorFilter(color)}
          >
            <span className={`h-2 w-2 rounded-full mr-1.5 bg-${color}-500`} />
            {count} {color}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-64"
        />
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-36" data-testid="select-bookmark-color-filter">
            <SelectValue placeholder="All colors" />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16" />
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {searchQuery || colorFilter !== "all"
              ? "Try adjusting your filters."
              : "Create your first bookmark to save important moments."}
          </p>
          {!searchQuery && colorFilter === "all" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onPlay={(id) => {
                toast({
                  title: "Playing recording",
                  description: "Opening video playback...",
                });
              }}
              onEdit={(id) => {
                toast({
                  title: "Edit bookmark",
                  description: "Opening bookmark editor...",
                });
              }}
              onDelete={(id) => deleteBookmarkMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <AddBookmarkDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cameras={cameras}
        onSubmit={(data) => addBookmarkMutation.mutate(data)}
        isSubmitting={addBookmarkMutation.isPending}
      />
    </div>
  );
}
