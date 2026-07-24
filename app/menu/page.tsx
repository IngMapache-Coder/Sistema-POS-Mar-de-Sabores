"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputNumber } from "@/components/ui/input-number";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  getCategories,
  saveCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  saveProduct,
  updateProduct,
  deleteProduct,
  getMenus,
  saveMenu,
  updateMenu,
  deleteMenu,
} from "@/lib/database";
import type { Category, Product, Menu } from "@/lib/types";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  FolderOpen,
  AlertTriangle,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";

const CATEGORY_COLORS = [
  "#0ea5e9",
  "#f97316",
  "#22c55e",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#06b6d4",
  "#84cc16",
  "#ef4444",
  "#10b981",
  "#a855f7",
  "#eab308",
  "#64748b",
  "#0f766e",
];

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");

  // Menu dialog
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [showDeleteMenuDialog, setShowDeleteMenuDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuName, setMenuName] = useState("");

  // Category dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "product";
    id: string;
  } | null>(null);

  // Product dialog
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { toast } = useToast();

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: CATEGORY_COLORS[0],
    order: 1,
    parentId: null as string | null,
    menuId: null as string | null,
  });

  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    categoryId: "",
    stock: 0,
    minStock: 0,
    hasInventoryControl: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menusData, categoriesData, productsData] = await Promise.all([
        getMenus(),
        getCategories(),
        getProducts(),
      ]);

      setMenus(menusData);
      setCategories(categoriesData);
      setProducts(productsData.filter((p) => p.isActive));

      if (menusData.length > 0 && !selectedMenuId) {
        setSelectedMenuId(menusData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    }
  };

  // --- Derived state ---
  const menuTopCategories = categories.filter(
    (c) => c.menuId === selectedMenuId && !c.parentId
  );

  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const menuAllCategories = categories.filter(
    (c) =>
      c.menuId === selectedMenuId ||
      menuTopCategories.some((t) => t.id === c.parentId)
  );

  const assignableCategories = menuAllCategories;

  const filteredProducts =
    selectedCategory === "all"
      ? products.filter((p) =>
          assignableCategories.some((c) => c.id === p.categoryId)
        )
      : products.filter((p) => p.categoryId === selectedCategory);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name || "Sin categoría";

  const getCategoryColor = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.color || "#6b7280";

  // --- Menu Handlers ---
  const openMenuDialog = (menu?: Menu) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuName(menu.name);
    } else {
      setEditingMenu(null);
      setMenuName("");
    }
    setShowMenuDialog(true);
  };

  const handleSaveMenu = async () => {
    if (!menuName.trim()) {
      toast({ title: "Error", description: "El nombre del menú es requerido", variant: "destructive" });
      return;
    }
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, { name: menuName.trim() });
        toast({ title: "Menú actualizado" });
      } else {
        const newMenu = await saveMenu(menuName.trim());
        if (newMenu) {
          setSelectedMenuId(newMenu.id);
          toast({ title: "Menú creado" });
        }
      }
      setShowMenuDialog(false);
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el menú", variant: "destructive" });
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenuId) return;
    const hasCategories = categories.some((c) => c.menuId === selectedMenuId);
    if (hasCategories) {
      toast({
        title: "No se puede eliminar",
        description: "Elimina primero todas las categorías de este menú.",
        variant: "destructive",
      });
      setShowDeleteMenuDialog(false);
      return;
    }
    await deleteMenu(selectedMenuId);
    setSelectedMenuId(null);
    toast({ title: "Menú eliminado" });
    setShowDeleteMenuDialog(false);
    await loadData();
  };

  // --- Category Handlers ---
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        color: category.color,
        order: category.order,
        parentId: category.parentId ?? null,
        menuId: category.menuId ?? selectedMenuId,
      });
    } else {
      const topCount = menuTopCategories.length;
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        color: CATEGORY_COLORS[topCount % CATEGORY_COLORS.length],
        order: topCount + 1,
        parentId: null,
        menuId: selectedMenuId,
      });
    }
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Error", description: "El nombre de la categoría es requerido", variant: "destructive" });
      return;
    }
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: categoryForm.name,
          color: categoryForm.color,
          order: categoryForm.order,
          parentId: categoryForm.parentId,
          menuId: categoryForm.menuId,
        });
        toast({ title: "Categoría actualizada" });
      } else {
        await saveCategory({
          name: categoryForm.name,
          color: categoryForm.color,
          order: categoryForm.order,
          parentId: categoryForm.parentId,
          menuId: categoryForm.menuId,
        });
        toast({ title: "Categoría creada" });
      }
      setShowCategoryDialog(false);
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la categoría", variant: "destructive" });
    }
  };

  // --- Product Handlers ---
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        stock: product.stock,
        minStock: product.minStock,
        hasInventoryControl: product.hasInventoryControl,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        price: 0,
        categoryId: assignableCategories[0]?.id || "",
        stock: 0,
        minStock: 0,
        hasInventoryControl: false,
      });
    }
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      toast({ title: "Error", description: "El nombre del producto es requerido", variant: "destructive" });
      return;
    }
    if (productForm.price <= 0) {
      toast({ title: "Error", description: "El precio debe ser mayor a 0", variant: "destructive" });
      return;
    }
    if (!productForm.categoryId) {
      toast({ title: "Error", description: "Selecciona una categoría", variant: "destructive" });
      return;
    }
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast({ title: "Producto actualizado" });
      } else {
        await saveProduct({ ...productForm, isActive: true });
        toast({ title: "Producto creado" });
      }
      setShowProductDialog(false);
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" });
    }
  };

  // --- Delete Handlers ---
  const openDeleteDialog = (type: "category" | "product", id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "category") {
        const subs = getSubcategories(deleteTarget.id);
        if (subs.length > 0) {
          toast({ title: "Error", description: "Elimina primero las subcategorías de esta categoría.", variant: "destructive" });
          setShowDeleteDialog(false);
          return;
        }
        const catProds = products.filter((p) => p.categoryId === deleteTarget.id);
        if (catProds.length > 0) {
          toast({ title: "Error", description: "No puedes eliminar una categoría con productos. Elimina o mueve los productos primero.", variant: "destructive" });
          setShowDeleteDialog(false);
          return;
        }
        await deleteCategory(deleteTarget.id);
        toast({ title: "Categoría eliminada" });
      } else {
        await deleteProduct(deleteTarget.id);
        toast({ title: "Producto eliminado" });
      }
      setShowDeleteDialog(false);
      await loadData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto flex flex-col">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Gestión del Menú</h1>
          <p className="text-muted-foreground">Administra menús, categorías y productos</p>
        </div>

        {/* Menu Selector Bar */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl border bg-muted/30 flex-wrap">
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground shrink-0">Menú activo:</span>
          <div className="flex gap-2 flex-wrap flex-1">
            {menus.map((menu) => (
              <Button
                key={menu.id}
                size="sm"
                variant={selectedMenuId === menu.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedMenuId(menu.id);
                  setSelectedCategory("all");
                }}
              >
                {menu.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => openMenuDialog()} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Nuevo Menú
            </Button>
            {selectedMenu && (
              <>
                <Button size="sm" variant="ghost" onClick={() => openMenuDialog(selectedMenu)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  Renombrar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteMenuDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* No menu state */}
        {!selectedMenuId && (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-muted-foreground">
            <UtensilsCrossed className="h-12 w-12 opacity-30" />
            <p className="text-lg">No hay menús creados.</p>
            <Button onClick={() => openMenuDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear primer menú
            </Button>
          </div>
        )}

        {/* Content scoped to selected menu */}
        {selectedMenuId && (
          <Tabs defaultValue="products" className="flex-1 flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Categorías
              </TabsTrigger>
            </TabsList>

            {/* PRODUCTS TAB */}
            <TabsContent value="products" className="flex-1 flex flex-col mt-4">
              <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
                <div className="flex gap-2 overflow-x-auto flex-wrap flex-1">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    Todos
                  </Button>
                  {menuTopCategories.map((cat) => {
                    const subs = getSubcategories(cat.id);
                    return (
                      <div key={cat.id} className="flex items-center gap-1 flex-wrap">
                        <Button
                          variant={selectedCategory === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id)}
                          style={{
                            backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                            borderColor: cat.color,
                            color: selectedCategory === cat.id ? "#fff" : cat.color,
                          }}
                        >
                          {cat.name}
                        </Button>
                        {subs.map((sub) => (
                          <Button
                            key={sub.id}
                            variant={selectedCategory === sub.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(sub.id)}
                            className="text-xs gap-1"
                            style={{
                              backgroundColor: selectedCategory === sub.id ? sub.color : undefined,
                              color: selectedCategory === sub.id ? "#fff" : sub.color,
                            }}
                          >
                            <ChevronRight className="h-3 w-3" />
                            {sub.name}
                          </Button>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <Button onClick={() => openProductDialog()} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Nuevo Producto
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pr-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge
                              variant="outline"
                              className="mt-1"
                              style={{
                                borderColor: getCategoryColor(product.categoryId),
                                color: getCategoryColor(product.categoryId),
                              }}
                            >
                              {getCategoryName(product.categoryId)}
                            </Badge>
                          </div>
                          <p className="text-xl font-bold text-primary">
                            ${product.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {product.hasInventoryControl ? (
                              <div className="flex items-center gap-1">
                                Stock:
                                <span className={product.stock <= product.minStock ? "text-destructive font-medium" : ""}>
                                  {product.stock}
                                </span>
                                {product.stock <= product.minStock && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            ) : (
                              <span>Sin control de inventario</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProductDialog(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog("product", product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-3 flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Package className="h-10 w-10 mb-2 opacity-30" />
                      <p>No hay productos en este menú</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* CATEGORIES TAB */}
            <TabsContent value="categories" className="flex-1 flex flex-col mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={() => openCategoryDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Categoría
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {menuTopCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
                      <p>No hay categorías en este menú</p>
                    </div>
                  )}
                  {menuTopCategories.map((category) => {
                    const subs = getSubcategories(category.id);
                    const productCount = products.filter((p) => p.categoryId === category.id).length;
                    return (
                      <div key={category.id}>
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: category.color }}
                                >
                                  <FolderOpen className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-base">{category.name}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {subs.length > 0
                                      ? `${subs.length} subcategoría${subs.length !== 1 ? "s" : ""}`
                                      : `${productCount} producto${productCount !== 1 ? "s" : ""}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryDialog(category)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => openDeleteDialog("category", category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        {/* Subcategories */}
                        <div className="ml-8 mt-2 space-y-2">
                          {subs.map((sub) => {
                            const subProductCount = products.filter((p) => p.categoryId === sub.id).length;
                            return (
                              <Card key={sub.id} className="border-dashed">
                                <CardHeader className="pb-2 pt-3 px-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      <div
                                        className="h-7 w-7 rounded flex items-center justify-center"
                                        style={{ backgroundColor: sub.color }}
                                      >
                                        <FolderOpen className="h-3.5 w-3.5 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{sub.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {subProductCount} producto{subProductCount !== 1 ? "s" : ""}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCategoryDialog(sub)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => openDeleteDialog("category", sub.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                              </Card>
                            );
                          })}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground gap-1 text-xs"
                            onClick={() => {
                              setEditingCategory(null);
                              setCategoryForm({
                                name: "",
                                color: category.color,
                                order: subs.length + 1,
                                parentId: category.id,
                                menuId: selectedMenuId,
                              });
                              setShowCategoryDialog(true);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            Agregar subcategoría en "{category.name}"
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Menu Dialog */}
        <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingMenu ? "Renombrar Menú" : "Nuevo Menú"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Label htmlFor="menuName">Nombre del menú</Label>
              <Input
                id="menuName"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Ej: Menú Principal, Menú Fin de Semana..."
                onKeyDown={(e) => e.key === "Enter" && handleSaveMenu()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMenuDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveMenu}>{editingMenu ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nombre</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Pescados, Mariscos..."
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría padre (opcional)</Label>
                <Select
                  value={categoryForm.parentId || "none"}
                  onValueChange={(v) =>
                    setCategoryForm((prev) => ({ ...prev, parentId: v === "none" ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin padre (categoría principal)</SelectItem>
                    {menuTopCategories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona una categoría padre para convertirla en subcategoría.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-lg transition-transform ${
                        categoryForm.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCategoryForm((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryOrder">Orden</Label>
                <Input
                  id="categoryOrder"
                  type="number"
                  value={categoryForm.order}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveCategory}>{editingCategory ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nombre</Label>
                <Input
                  id="productName"
                  value={productForm.name}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Filete de Pescado"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Precio</Label>
                  <InputNumber
                    id="productPrice"
                    value={productForm.price}
                    onChange={(value) => setProductForm((prev) => ({ ...prev, price: value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCategory">Categoría</Label>
                  <Select
                    value={productForm.categoryId}
                    onValueChange={(value) => setProductForm((prev) => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableCategories.map((cat) => {
                        const parent = cat.parentId
                          ? categories.find((c) => c.id === cat.parentId)
                          : null;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            {parent ? `${parent.name} › ${cat.name}` : cat.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Control de Inventario</Label>
                  <p className="text-sm text-muted-foreground">Activar para descontar stock en cada venta</p>
                </div>
                <Switch
                  checked={productForm.hasInventoryControl}
                  onCheckedChange={(checked) => setProductForm((prev) => ({ ...prev, hasInventoryControl: checked }))}
                />
              </div>
              {productForm.hasInventoryControl && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productStock">Stock Actual</Label>
                    <InputNumber
                      id="productStock"
                      value={productForm.stock}
                      onChange={(value) => setProductForm((prev) => ({ ...prev, stock: value }))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productMinStock">Stock Mínimo</Label>
                    <InputNumber
                      id="productMinStock"
                      value={productForm.minStock}
                      onChange={(value) => setProductForm((prev) => ({ ...prev, minStock: value }))}
                      min={0}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveProduct}>{editingProduct ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === "category"
                  ? "¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer."
                  : "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Menu Confirmation */}
        <AlertDialog open={showDeleteMenuDialog} onOpenChange={setShowDeleteMenuDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Menú</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar el menú "{selectedMenu?.name}"? Debes eliminar primero todas sus categorías y productos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMenu}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar Menú
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
