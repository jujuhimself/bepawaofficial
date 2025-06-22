import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductStatusBadge from "./ProductStatusBadge";
import WishlistButton from "./WishlistButton";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

type ProductCardProps = {
  product: Product;
  viewMode: "grid" | "list";
  isInWishlist: boolean;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onViewDetails: (product: Product) => void;
  userRole?: string;
  showActions?: boolean;
};

const ProductCard = ({
  product,
  viewMode,
  isInWishlist,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  userRole,
  showActions = true,
}: ProductCardProps) => {
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (product.requires_prescription) {
      toast({
        title: 'Prescription Required',
        description: 'This medication requires a valid prescription. Please upload your prescription first.',
        variant: 'destructive',
      });
      return;
    }

    if (product.stock <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    onAddToCart(product, {} as React.MouseEvent);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card
      className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 cursor-pointer ${
        viewMode === "list" ? "flex flex-row" : ""
      }`}
    >
      <CardHeader className={`p-0 ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
        <div className="relative" onClick={() => onViewDetails(product)}>
          <img
            src={product.image}
            alt={product.name}
            className={`w-full object-cover rounded-t-lg ${
              viewMode === "list"
                ? "h-32 rounded-l-lg rounded-t-none"
                : "h-48"
            }`}
          />
          <ProductStatusBadge stock={product.stock} prescription={product.prescription} />
          <WishlistButton
            isInWishlist={isInWishlist}
            onClick={e => {
              e.stopPropagation();
              onToggleWishlist(product.id, e);
            }}
          />
        </div>
      </CardHeader>
      <CardContent className={`p-4 md:p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
        <CardTitle
          className="text-lg md:text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors cursor-pointer"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </CardTitle>
        {product.manufacturer && (
          <p className="text-sm text-gray-500 mb-1">by {product.manufacturer}</p>
        )}
        {product.dosage && (
          <p className="text-sm text-gray-600 mb-2">Dosage: {product.dosage}</p>
        )}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div
          className={`flex justify-between items-center mb-4 ${
            viewMode === "list" ? "flex-col items-start gap-2" : ""
          }`}
        >
          <span className="text-2xl md:text-3xl font-bold text-blue-600">
            TZS {product.price.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Stock: {product.stock}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || userRole !== "retail"}
            className="flex-1 h-10 md:h-12 text-sm md:text-lg font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(product)}
            className="px-3"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
