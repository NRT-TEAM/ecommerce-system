import React, { useContext } from "react";
import { ShopContext } from "../../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price, stock }) => {
  const { currency, addToCart, basket } = useContext(ShopContext);
  const raw = Array.isArray(image) ? image[0] : image;
  const imgSrc =
    raw && raw.startsWith("/") ? `http://localhost:5005${raw}` : raw;

  return (
    <div className="group rounded-xl border bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5" data-testid={`product-item-${id}`}>
      <div className="relative overflow-hidden rounded-t-xl aspect-[4/3] bg-white flex items-center justify-center">
        <img
          src={imgSrc}
          alt={name}
          className="max-h-full max-w-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
          data-testid={`product-image-${id}`}
        />
        <div className="absolute inset-0 pointer-events-none" />
        <Link
          to={`/product/${id}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`product-view-${id}`}
        >
          <span className="px-4 py-2 rounded-full bg-white/90 text-black text-sm font-medium shadow">
            View Product
          </span>
        </Link>
      </div>
      <div className="p-3 text-center">
        <p className="pt-1 text-sm font-medium truncate">{name}</p>
        <p className="text-sm font-semibold">
          {currency}
          {(() => {
            const n = Number(price);
            if (Number.isFinite(n)) return (n / 100).toFixed(2);
            return price;
          })()}
        </p>
        {typeof stock === "number" && (
          (() => {
            const inBasket = (basket?.items || []).find((i) => i.productId === id)?.quantity || 0;
            const available = Math.max(0, stock - inBasket);
            return (
              <p className={`mt-1 text-xs ${available <= 0 ? "text-red-600" : available <= 5 ? "text-amber-600" : "text-green-600"}`} data-testid={`product-stock-${id}`}>
                {available <= 0 ? "Out of stock" : `Stock: ${available}`}
              </p>
            );
          })()
        )}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Link
            to={`/product/${id}`}
            className="h-8 px-3 rounded border text-sm flex justify-center items-center shadow-md hover:shadow-lg transition-shadow duration-200"
            data-testid={`product-view-inline-${id}`}
          >
            View
          </Link>
          <button
            onClick={() => addToCart(id, 1)}
            disabled={(() => {
              if (typeof stock !== "number") return false;
              const inBasket = (basket?.items || []).find((i) => i.productId === id)?.quantity || 0;
              return stock - inBasket <= 0;
            })()}
            className="h-8 px-3 rounded bg-red-600 text-white text-sm flex justify-center items-center shadow-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`product-add-${id}`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
