import React, { useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { ShopContext } from "../../context/ShopContext";

const BestSeller = () => {
  const [bestSeller, setBestSeller] = useState([]);
  const { products } = useContext(ShopContext);
  const LIMIT = 5;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5005/api/products/bestSellers",
          { params: { limit: LIMIT } }
        );
        if (!cancelled) setBestSeller(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setBestSeller([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("productsChanged", handler);
    return () => window.removeEventListener("productsChanged", handler);
  }, []);

  const displayList = useMemo(() => {
    const lowBest = (Array.isArray(bestSeller) ? bestSeller : [])
      .filter((p) => Number(p.quantityInStock) <= 5);
    if (lowBest.length >= LIMIT) return lowBest.slice(0, LIMIT);
    const items = Array.isArray(products) ? products : [];
    const lowStock = items
      .filter((p) => Number(p.quantityInStock) <= 5)
      .sort((a, b) => Number(a.quantityInStock) - Number(b.quantityInStock));
    const seen = new Set(lowBest.map((p) => String(p._id ?? p.id)));
    const filled = [...lowBest];
    for (const p of lowStock) {
      const id = String(p._id ?? p.id);
      if (!seen.has(id)) {
        seen.add(id);
        filled.push(p);
        if (filled.length >= LIMIT) break;
      }
    }
    return filled;
  }, [bestSeller, products]);

  return (
    <div className="my-10" data-testid="best-seller">
      <div className="text-center text-3xl py-8">
        <Title text1="BEST" text2="SELLERS" />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Top selling products
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6" data-testid="best-seller-grid">
        {displayList.map((item, index) => (
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
    </div>
  );
};

export default BestSeller;
