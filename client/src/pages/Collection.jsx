import React, { useContext, useEffect, useMemo, useState } from "react";
import Title from "../components/common/Title";
import ProductItem from "../components/common/ProductItem";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { useSearchParams } from "react-router-dom";

const Collection = () => {
  const {
    products,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    getSearchResults,
    lastSearchTerm,
    setLastSearchTerm,
  } = useContext(ShopContext);

  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState("relevant");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [meta, setMeta] = useState(null);
  const [params, setParams] = useSearchParams();

  const STRUCTURE = useMemo(
    () => ({
      categories: ["Audio", "Bedroom", "Furniture", "Appliances"],
      typesByCategory: {
        Audio: ["Guitars", "Keyboards", "Pedals", "Synthesizers"],
        Bedroom: ["Beds", "Dressers", "Mattresses", "Nightstands"],
        Furniture: ["Chairs", "Shelves", "Sofas", "Tables"],
        Appliances: ["Fridges", "Ovens", "Microwaves", "Toasters"],
      },
    }),
    []
  );

  const TYPE_TO_CATEGORIES = useMemo(() => {
    const map = {};
    Object.entries(STRUCTURE.typesByCategory).forEach(([brand, types]) => {
      types.forEach((t) => {
        map[t] = (map[t] || []).concat(brand);
      });
    });
    return map;
  }, [STRUCTURE]);

  const allowedTypesForCategories = (brands) => {
    if (!brands || brands.length === 0) {
      return Object.values(STRUCTURE.typesByCategory).flat();
    }
    const set = new Set();
    brands.forEach((b) => {
      (STRUCTURE.typesByCategory[b] || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  };

  const toggleCategory = (e) => {
    const val = e.target.value;
    const next = category.includes(val)
      ? category.filter((a) => a !== val)
      : [...category, val];
    setCategory(next);
    const allowed = new Set(allowedTypesForCategories(next));
    setSubCategory((prev) => prev.filter((t) => allowed.has(t)));
    const nextParams = new URLSearchParams(params);
    nextParams.set("categories", next.map((b) => b.toLowerCase()).join(","));
    nextParams.set("page", "1");
    setPage(1);
    setParams(nextParams);
  };

  const toggleSubCategory = (e) => {
    const val = e.target.value;
    const allowed = new Set(allowedTypesForCategories(category));
    if (!allowed.has(val)) return;
    const next = subCategory.includes(val)
      ? subCategory.filter((a) => a !== val)
      : [...subCategory, val];
    setSubCategory(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set("types", next.map((t) => t.toLowerCase()).join(","));
    nextParams.set("page", "1");
    setPage(1);
    setParams(nextParams);
  };

  const applyFilter = async () => {
    const qRaw = (search || lastSearchTerm || "").trim();
    const synonyms = {
      sofa: "sofas",
      couch: "sofas",
      bed: "beds",
      dresser: "dressers",
      shelf: "shelves",
      chair: "chairs",
      table: "tables",
      guitar: "guitars",
      keyboard: "keyboards",
      pedal: "pedals",
      synth: "synthesizers",
    };
    const qLower = qRaw.toLowerCase();
    const inferredType = synonyms[qLower] || "";
    const q = qRaw;
    const brands = category.map((b) => b.toLowerCase()).join(",");
    const types = [
      ...subCategory.map((t) => t.toLowerCase()),
      ...(inferredType ? [inferredType] : []),
    ]
      .filter(Boolean)
      .join(",");
    const orderBy =
      sortType === "low-high"
        ? "price"
        : sortType === "high-low"
        ? "priceDesc"
        : "name";
    try {
      const url = new URL("http://localhost:5005/api/products");
      if (brands) url.searchParams.set("categories", brands);
      if (types) url.searchParams.set("types", types);
      if (q) url.searchParams.set("searchTerm", q);
      url.searchParams.set("orderBy", orderBy);
      url.searchParams.set("pageNumber", String(page));
      url.searchParams.set("pageSize", String(pageSize));
      const res = await fetch(url.toString());
      const arr = await res.json();
      setFilterProducts(
        Array.isArray(arr) ? arr : Array.isArray(arr?.items) ? arr.items : []
      );
      try {
        const pagination = res.headers.get("Pagination");
        if (pagination) setMeta(JSON.parse(pagination));
      } catch {}
      const nextParams = new URLSearchParams(params);
      q ? nextParams.set("q", q) : nextParams.delete("q");
      brands ? nextParams.set("categories", brands) : nextParams.delete("categories");
      types ? nextParams.set("types", types) : nextParams.delete("types");
      nextParams.set("page", String(page));
      setParams(nextParams);
    } catch (e) {
      console.warn("Filter load failed", e);
      setFilterProducts([]);
    }
  };

  const sortProduct = async () => {
    await applyFilter();
  };

  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, page, pageSize]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  useEffect(() => {
    const initBrands = (params.get("categories") || "").split(",").filter(Boolean);
    const initTypes = (params.get("types") || "").split(",").filter(Boolean);
    const initPage = parseInt(params.get("page") || "1", 10);
    const initQ = params.get("q") || "";
    setCategory(initBrands.map((b) => b[0].toUpperCase() + b.slice(1)));
    const initTypesProper = initTypes.map((t) => t[0].toUpperCase() + t.slice(1));
    const allowedInit = new Set(allowedTypesForCategories(
      initBrands.map((b) => b[0].toUpperCase() + b.slice(1))
    ));
    setSubCategory(
      initBrands.length ? initTypesProper.filter((t) => allowedInit.has(t)) : initTypesProper
    );
    setPage(Math.max(1, initPage));
    if (initQ) setSearch(initQ);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Filter Options */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
          data-testid="filters-toggle"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${showFilter ? " rotate-90" : ""}`}
            src={assets.dropdown_icon}
            alt=""
          />
        </p>

        {/* Category Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {STRUCTURE.categories.map((c) => (
              <p key={c} className="flex gap-2">
                <input
                  className="w-3"
                  value={c}
                  checked={category.includes(c)}
                  onChange={toggleCategory}
                  type="checkbox"
                  data-testid={`filter-category-${c.toLowerCase()}`}
                />{" "}
                {c}
              </p>
            ))}
          </div>
        </div>

        {/* Sub Category Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {(category.length ? category : STRUCTURE.categories).flatMap((c) =>
              STRUCTURE.typesByCategory[c].map((t) => (
                <p key={`${c}-${t}`} className="flex gap-2">
                  <input
                    className="w-3"
                    value={t}
                    checked={subCategory.includes(t)}
                    onChange={toggleSubCategory}
                    type="checkbox"
                    data-testid={`filter-type-${t.toLowerCase()}`}
                  />{" "}
                  {t}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />

          {/* Product Sort */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
            name=""
            id=""
            data-testid="collection-sort-select"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Price: Low-High</option>
            <option value="high-low">Sort by: Price: High-Low</option>
          </select>
        </div>

        {/* Map Products */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6"
          data-testid="collection-grid"
        >
          {filterProducts.map((item, index) => (
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
        {filterProducts.length === 0 && (
          <div
            className="mt-4 text-sm text-gray-600"
            data-testid="collection-empty"
          >
            No products found for selected filters. Try adjusting category or
            type.
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            className="h-8 px-3 rounded border disabled:opacity-50 justify-center flex items-center"
            disabled={!meta || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            data-testid="collection-prev"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {meta?.pageNumber || page} of {meta?.totalPages || 1}
          </span>
          <button
            className="h-8 px-3 rounded border justify-center flex items-center disabled:opacity-50"
            disabled={
              !meta || (meta?.pageNumber || page) >= (meta?.totalPages || 1)
            }
            onClick={() => setPage((p) => p + 1)}
            data-testid="collection-next"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Collection;
