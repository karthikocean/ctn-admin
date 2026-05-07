import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { categoryPoints as defaultCategoryPoints } from "@/data/mockData";
import { Plus, Edit, Trash2 } from "lucide-react";

type CategoryPointsConfig = Record<string, number>;

const AllocatePointsPage = () => {
  const navigate = useNavigate();
  const [categoryPointsConfig, setCategoryPointsConfig] = useState<CategoryPointsConfig>(() => {
    const stored = localStorage.getItem("categoryPointsConfig");
    if (stored) {
      return JSON.parse(stored);
    }
    // Default from mockData
    return { ...defaultCategoryPoints };
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [pointsValue, setPointsValue] = useState("");
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("categoryPointsConfig", JSON.stringify(categoryPointsConfig));
  }, [categoryPointsConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleName.trim() || !pointsValue) return;

    const points = parseInt(pointsValue);
    if (isNaN(points) || points < 0) return;

    setCategoryPointsConfig(prev => ({
      ...prev,
      [moduleName]: points,
    }));

    // Reset form
    setModuleName("");
    setPointsValue("");
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: string) => {
    setEditingCategory(category);
    setModuleName(category);
    setPointsValue(categoryPointsConfig[category].toString());
    setShowForm(true);
  };

  const handleDeleteClick = (category: string) => {
    setDeleteCategory(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteCategory) {
      setCategoryPointsConfig(prev => {
        const updated = { ...prev };
        delete updated[deleteCategory];
        return updated;
      });
      setDeleteCategory(null);
      setShowDeleteDialog(false);
    }
  };

  const sortedEntries = Object.entries(categoryPointsConfig).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page-container">
      <PageHeader
        title="Allocate Points"
        subtitle=""
      >
        <Button
          className="rounded-xl bg-primary hover:bg-primary/90"
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setModuleName("");
            setPointsValue("");
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Category
        </Button>
      </PageHeader>

      {/* Form Section */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card p-6 mb-6"
        >
          <h3 className="font-semibold text-sm text-foreground mb-4">
            {editingCategory ? `Edit "${editingCategory}"` : "Add New Category"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moduleName">Category Name</Label>
                <Input
                  id="moduleName"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g., Trading, Services, Manufacturing"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={pointsValue}
                  onChange={(e) => setPointsValue(e.target.value)}
                  placeholder="Enter points value"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setModuleName("");
                  setPointsValue("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                {editingCategory ? "Update" : "Add Category"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Categories List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Points Allocation
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                    No categories configured. Add one to get started.
                  </td>
                </tr>
              ) : (
                sortedEntries.map(([category, points]) => (
                  <tr key={category} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">{category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{points} points</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category &quot;{deleteCategory}&quot;? This will remove the points allocation for this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllocatePointsPage;
