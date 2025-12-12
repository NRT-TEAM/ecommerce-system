import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToCart, currency, basket } = useContext(ShopContext);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5005/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        setProduct(data);
      } catch (e) {
        setError("Unable to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">{error}</div>;
  if (!product) return null;

  const img =
    product.pictureUrl && product.pictureUrl.startsWith("/")
      ? `http://localhost:5005${product.pictureUrl}`
      : product.pictureUrl;
  const inBasket =
    (basket?.items || []).find((i) => i.productId === product.id)?.quantity ||
    0;
  const available =
    typeof product.quantityInStock === "number"
      ? Math.max(0, product.quantityInStock - inBasket)
      : undefined;
  const outOfStock = typeof available === "number" && available <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {img && (
            <img
              src={img}
              alt={product.name}
              className="w-full rounded-lg"
              data-testid="product-page-image"
            />
          )}
        </div>
        <div>
          <h1
            className="text-2xl font-bold mb-4"
            data-testid="product-page-title"
          >
            {product.name}
          </h1>
          <p className="text-sm text-gray-600 mb-2">SKU: PRD-{product.id}</p>
          <p className="mb-4 text-gray-700">{product.description}</p>
          <p className="text-lg font-semibold mb-6">
            {currency}
            {(() => {
              const n = Number(product?.price);
              if (Number.isFinite(n)) return (n / 100).toFixed(2);
              return product?.price;
            })()}
          </p>
          {typeof available === "number" && (
            <p
              className={`text-sm mb-4 ${
                available <= 0
                  ? "text-red-600"
                  : available <= 5
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
              data-testid="product-stock"
            >
              {available <= 0 ? "Out of stock" : `In stock: ${available}`}
            </p>
          )}
          <div className="flex gap-3">
            <button
              className="h-10 px-6 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center"
              disabled={outOfStock}
              onClick={async () => {
                await addToCart(product.id, 1);
              }}
              data-testid="product-add-to-cart"
            >
              Add to Cart
            </button>
            <button
              className="h-10 px-6 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center"
              disabled={outOfStock}
              onClick={async () => {
                const ok = await addToCart(product.id, 1);
                if (ok) navigate("/cart");
              }}
              data-testid="product-buy-now"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
