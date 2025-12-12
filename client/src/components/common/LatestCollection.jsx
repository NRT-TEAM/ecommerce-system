import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [refreshToken, setRefreshToken] = useState(0);

  const totalPages = useMemo(() => {
    const count = Array.isArray(products) ? products.length : 0;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [products, pageSize]);

  const getUpdatedAt = useMemo(() => {
    let map = {};
    try {
      map = JSON.parse(localStorage.getItem("productUpdatedAt") || "{}");
    } catch {}
    return (id) => map[String(id)] || null;
  }, [refreshToken]);

  useEffect(() => {
    const items = Array.isArray(products) ? products : [];
    const sorted = [...items].sort((a, b) => {
      const aU = getUpdatedAt(a.id);
      const bU = getUpdatedAt(b.id);
      if (aU && bU) return new Date(bU).getTime() - new Date(aU).getTime();
      if (aU && !bU) return -1;
      if (!aU && bU) return 1;
      return (b.id ?? 0) - (a.id ?? 0);
    });
    const start = (page - 1) * pageSize;
    setLatestProducts(sorted.slice(start, start + pageSize));
  }, [products, page, pageSize, getUpdatedAt]);

  return (
    <div className="my-20  p-6" data-testid="latest-collection">
      <div className="flex items-center justify-start">
        <div className="text-3xl">
          <Title text1="LATEST" text2="COLLECTION" />
        </div>
      </div>

      {/* Rendering Products */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6"
        data-testid="latest-collection-grid"
      >
        {latestProducts.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id ?? item.id}
            image={item.image ?? item.pictureUrl}
            name={item.name}
            price={item.price}
            stock={item.quantityInStock}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 justify-center">
        <button
          className="h-8 px-3 rounded border disabled:opacity-50 justify-center flex items-center"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          data-testid="latest-prev"
        >
          Prev
        </button>
        <span className="text-sm">Page {page}</span>
        <button
          className="h-8 px-3 rounded border justify-center flex items-center disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          data-testid="latest-next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LatestCollection;
