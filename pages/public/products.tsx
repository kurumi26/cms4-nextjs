import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { axiosInstance } from "@/services/axios";
import { useEffect, useMemo, useState } from "react";

type Props = {
	pageData: any;
	products: any[];
	categories: any[];
};

const USE_DUMMY_PRODUCTS = true;

const DUMMY_PRODUCTS: any[] = [
	{
		id: 101,
		slug: "calamari-rings",
		name: "Calamari Rings",
		price: 8.99,
		serving_size: "1 pc",
		description: "Lightly battered squid rings, crispy and tender.",
		image_url: "/images/calamarirings.jpg",
		category_id: 1,
		category: { id: 1, name: "Appetizers" },
	},
	{
		id: 102,
		slug: "garlic-bread",
		name: "Garlic Bread",
		price: 7.49,
		serving_size: "1 pc",
		description: "Toasted bread with garlic butter and herbs.",
		image_url: "/images/garlicbread.jpg",
		category_id: 1,
		category: { id: 1, name: "Appetizers" },
	},

    {
		id: 103,
		slug: "cheesy-sticks",
		name: "Cheesy Sticks",
		price: 7.49,
		serving_size: "1 pc",
		description: "Golden-fried mozzarella sticks served with marinara sauce.",
		image_url: "/images/cheesesticks.jpg",
		category_id: 1,
		category: { id: 1, name: "Appetizers" },
	},

    {
		id: 104,
		slug: "spring-rolls",
		name: "Spring Rolls",
		price: 2.04,
		serving_size: "1 pc",
		description: "Crispy rolls filled with seasoned vegetables, served with sweet chili sauce.",
		image_url: "/images/springrolls.jpg",
		category_id: 1,
		category: { id: 1, name: "Appetizers" },
	},
	{
		id: 201,
		slug: "chicken-inasal",
		name: "Chicken Inasal",
		price: 10.5,
		serving_size: "1 bowl",
		description: "Grilled chicken marinated in inasal spices.",
		image_url: "/images/chickeninasal.jpg",
		category_id: 2,
		category: { id: 2, name: "Chicken Dishes" },
	},
	{
		id: 202,
		slug: "fried-chicken",
		name: "Fried Chicken",
		price: 3.32,
		serving_size: "1 bowl",
		description: "Crispy fried chicken, juicy inside.",
		image_url: "/images/friedchicken.jpg",
		category_id: 2,
		category: { id: 2, name: "Chicken Dishes" },
	},
	{
		id: 301,
		slug: "chicken-alfredo-pasta",
		name: "Chicken Alfredo Pasta",
		price: 3.95,
		serving_size: "1 plate",
		description: "Pasta in creamy alfredo sauce with grilled chicken.",
		image_url: "/images/chickenalfredo.jpg",
		category_id: 3,
		category: { id: 3, name: "Pasta & Noodles" },
	},
	{
		id: 302,
		slug: "carbonara-pasta",
		name: "Carbonara Pasta",
		price: 3.5,
		serving_size: "1 plate",
		description: "Classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
		image_url: "/images/carbonara.jpg",
		category_id: 3,
		category: { id: 3, name: "Pasta & Noodles" },
	},
    {
		id: 303,
		slug: "spaghetti-bolognese",
		name: "Spaghetti Bolognese",
		price: 3.5,
		serving_size: "1 plate",
		description: "Classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.",
		image_url: "/images/spaghetti.jpg",
		category_id: 3,
		category: { id: 3, name: "Pasta & Noodles" },
	},

    {
		id: 401,
		slug: "butter-garlic-shrimp",
		name: "Butter Garlic Shrimp",
		price: 3.5,
		serving_size: "1 plate",
		description: "Shrimp sautéed in a rich butter and garlic sauce.",
		image_url: "/images/butteredshrimp.jpg",
		category_id: 4,
		category: { id: 4, name: "Seafoods" },
	},
];

const DUMMY_CATEGORIES: any[] = [
	{ id: 1, name: "Appetizers" },
	{ id: 2, name: "Chicken Dishes" },
	{ id: 3, name: "Pasta & Noodles" },
    { id: 4, name: "Seafoods" }
];

function groupByCategory(products: any[]) {
	const map: Record<string, any[]> = {};
	for (const p of products) {
		const catId = getProductCategoryId(p);
		if (!map[catId]) map[catId] = [];
		map[catId].push(p);
	}
	return map;
}

function extractArray(payload: any): any[] {
	if (!payload) return [];
	let data: any = payload?.data ?? payload;
	// Common nesting: { data: { data: [...] } }
	if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
		data = (data as any).data;
		if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
			data = (data as any).data;
		}
	}
	if (Array.isArray(data)) return data;

	const candidates = [
		(data as any)?.items,
		(data as any)?.rows,
		(data as any)?.results,
		(data as any)?.result,
		(data as any)?.products,
		(data as any)?.categories,
		(data as any)?.product_categories,
		(data as any)?.productCategories,
		(data as any)?.productCategory,
	];
	for (const c of candidates) {
		if (Array.isArray(c)) return c;
		if (c && typeof c === "object" && Array.isArray((c as any).data)) return (c as any).data;
	}
	return [];
}

function getCategoryId(c: any): string {
	return String(c?.id ?? c?.category_id ?? c?.product_category_id ?? c?.slug ?? c?.name ?? "");
}

function getProductCategoryId(p: any): string {
	return String(
		p?.category_id ??
		p?.product_category_id ??
		p?.category?.id ??
		p?.category?.category_id ??
		p?.category?.product_category_id ??
		"_uncategorized"
	);
}

function resolveProductImageUrl(src: any): string {
	if (!src) return "/images/logo.png";
	let s = String(src).trim();
	if (!s) return "/images/logo.png";
	// Normalize Windows paths/backslashes
	s = s.replace(/\\/g, "/");

	if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;

	// If a Windows absolute path leaks in (e.g. C:/.../public/images/x.jpg)
	if (/^[a-zA-Z]:\//.test(s)) {
		const lowered = s.toLowerCase();
		const idx = lowered.lastIndexOf("/public/images/");
		if (idx >= 0) return `/images/${s.slice(idx + "/public/images/".length)}`;
		const basename = s.split("/").pop() || "";
		if (basename) return `/images/${basename}`;
	}

	if (s.includes("/public/images/")) return `/images/${s.split("/public/images/").pop()}`;

	// Normalize common relative public paths
	if (s.startsWith("images/") || s.startsWith("img/") || s.startsWith("icons/") || s.startsWith("favicon")) return `/${s}`;
	if (s.startsWith("./images/") || s.startsWith("./img/") || s.startsWith("./icons/")) return s.slice(1);

	// Public Next.js assets should stay local
	if (s.startsWith("/images/") || s.startsWith("/img/") || s.startsWith("/icons/") || s.startsWith("/favicon") || s.startsWith("/_next/")) {
		return s;
	}

	const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
	if (s.startsWith("/storage/")) return base ? `${base}${s}` : s;
	if (s.startsWith("storage/")) return base ? `${base}/${s}` : `/${s}`;
	if (s.startsWith("/uploads/")) return base ? `${base}${s}` : s;
	if (s.startsWith("uploads/")) return base ? `${base}/${s}` : `/${s}`;

	// Filename-only: use public images for dummy/dev datasets
	if (!s.includes("/") && /\.(png|jpe?g|webp|gif|svg)$/i.test(s)) {
		// Many of our bundled public images are .jpg, but some payloads may send .webp.
		// Prefer the same name with .jpg to avoid 404s (works on refresh/SSR).
		if (/\.webp$/i.test(s)) return `/images/${s.replace(/\.webp$/i, ".jpg")}`;
		return `/images/${s}`;
	}

	// If it's a bare filename without extension, also treat it as a public image key.
	if (!s.includes("/") && /^[a-z0-9._-]+$/i.test(s)) {
		return `/images/${s}`;
	}

	// Root-relative URLs are assumed local
	if (s.startsWith("/")) return s;

	// Last resort: treat as storage key
	return base ? `${base}/storage/${s.replace(/^\.\/?/, "")}` : s;
}

export default function ProductsPublicPage({ products, categories, pageData }: Props) {
	const [clientProducts, setClientProducts] = useState<any[]>(products || []);
	const [clientCategories, setClientCategories] = useState<any[]>(categories || []);
	const [activeCategory, setActiveCategory] = useState<string>("*");
	const [search, setSearch] = useState<string>("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	useEffect(() => {
		setClientProducts(products || []);
		setClientCategories(categories || []);
	}, [products, categories]);

	useEffect(() => {
		if (USE_DUMMY_PRODUCTS) return;
		// If SSR couldn't fetch (often due to auth token only available in localStorage), try in the browser.
		if ((products && products.length) || (categories && categories.length)) return;

		let cancelled = false;
		const run = async () => {
			const tryInstance = async (ep: string, params?: any) => {
				const resp = await axiosInstance.get(ep, { params, headers: { "X-No-Loading": true } });
				return resp.data;
			};

			try {
				// Products
				let nextProducts: any[] = [];
				const productEndpoints = ["/public-products", "/public/products", "/products", "/api/products"];
				for (const ep of productEndpoints) {
					try {
						const payload = await tryInstance(ep, { per_page: 1000 });
						nextProducts = extractArray(payload);
						if (nextProducts.length) break;
					} catch {
						// try next
					}
				}

				// Categories
				let nextCategories: any[] = [];
				const catEndpoints = ["/public-product-categories", "/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
				for (const ep of catEndpoints) {
					try {
						const payload = await tryInstance(ep, { per_page: 1000 });
						nextCategories = extractArray(payload);
						if (nextCategories.length) break;
					} catch {
						// try next
					}
				}

				if (cancelled) return;
				setClientProducts(nextProducts);
				setClientCategories(nextCategories);
			} catch {
				if (cancelled) return;
			}
		};

		run();
		return () => {
			cancelled = true;
		};
	}, [products, categories]);

	const effectiveProducts = (USE_DUMMY_PRODUCTS ? DUMMY_PRODUCTS : clientProducts) || [];
	const effectiveCategories = (USE_DUMMY_PRODUCTS ? DUMMY_CATEGORIES : clientCategories) || [];

	const searchedProducts = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return effectiveProducts;
		return effectiveProducts.filter((p: any) => {
			const hay = [
				p?.name,
				p?.title,
				p?.slug,
				p?.description,
				p?.teaser,
				p?.summary,
				p?.category?.name,
				p?.category_name,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return hay.includes(q);
		});
	}, [search, effectiveProducts]);

	const byCat = useMemo(() => groupByCategory(searchedProducts), [searchedProducts]);

	const filteredProducts = useMemo(() => {
		if (activeCategory === "*") return searchedProducts;
		return (byCat[activeCategory] || []) as any[];
	}, [activeCategory, searchedProducts, byCat]);

	return (
		<div className="container-fluid px-0">
			<div className="row">
				{/* SIDEBAR */}
				<div className="col-md-4 col-lg-3">
					<div className="sidebar2 p-t-80 p-b-80 p-r-20 p-r-0-md p-t-0-md">
						<div className="search-sidebar2 size12 bo2 pos-relative" style={{ marginBottom: 24 }}>
							<input
								className="input-search-sidebar2 txt10 p-l-20 p-r-55"
								type="text"
								placeholder="Search products"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Escape") setSearch("");
								}}
							/>
							<button
								type="button"
								className="btn-search-sidebar2 flex-c-m ti-search trans-0-4"
								aria-label="Search"
								onClick={() => {
									// Search is applied live as the user types.
								}}
							/>
						</div>

						<div className="categories">
							<h4 className="txt33 bo5-b p-b-35 p-t-58">Categories</h4>

							<ul>
								<li className="flex-sb-m bo5-b p-t-8 p-b-8">
									<a
										className={`txt27 ${activeCategory === "*" ? "color0" : "color1"} color0-hov`}
										style={{ cursor: "pointer", textDecoration: "none" }}
										onClick={() => setActiveCategory("*")}
									>
										All Products
									</a>
									<span className="txt29">({searchedProducts.length})</span>
								</li>

								{effectiveCategories?.map((c: any) => {
									const catId = getCategoryId(c);
									const label = c?.name ?? c?.title ?? c?.slug ?? "Category";
									return (
										<li key={catId} className="flex-sb-m bo5-b p-t-8 p-b-8">
											<a
												className={`txt27 ${activeCategory === catId ? "color0" : "color1"} color0-hov`}
												style={{ cursor: "pointer", textDecoration: "none" }}
												onClick={() => setActiveCategory(catId)}
											>
												{label}
											</a>
											<span className="txt29">({(byCat[catId] || []).length})</span>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				{/* MAIN */}
				<div className="col-md-8 col-lg-9">
					<div className="p-t-80 p-b-80">
						<div className="p-b-50 d-flex align-items-start justify-content-between flex-wrap" style={{ gap: 12 }}>
							<div>
								<h3 className="txt33">Products</h3>
								<p className="txt14 m-t-10">
									{pageData?.title ? `Explore ${pageData.title}` : "Explore our latest items"}
								</p>
							</div>

							<div className="d-flex align-items-center" style={{ gap: 8 }}>
								<span className="txt27" style={{ margin: 0 }}>View</span>
								<div className="btn-group" role="group" aria-label="Products view mode">
									<button
										type="button"
										onClick={() => setViewMode("grid")}
										className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
										aria-pressed={viewMode === "grid"}
										title="Grid view"
									>
										<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
											<rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
											<rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
											<rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
										</svg>
									</button>
									<button
										type="button"
										onClick={() => setViewMode("list")}
										className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-outline-secondary"}`}
										aria-pressed={viewMode === "list"}
										title="List view"
									>
										<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
											<line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
											<line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									</button>
								</div>
							</div>
						</div>

						{filteredProducts.length ? (
							<div className="row">
								{filteredProducts.map((p: any) => {
									const href = `/public/product/${p.slug ?? p.id}`;
									const imageSrc = resolveProductImageUrl(p.image_url ?? p.image);
									const colClass = viewMode === "grid" ? "col-sm-6 col-lg-4" : "col-12";
									return (
										<div key={p.id ?? p.slug} className={`${colClass} p-b-40`}>
											<a href={href} className="dis-block link-reset" style={{ width: "100%" }}>
												<div
													className="blo4 bo-rad-10 of-hidden"
													style={{ width: "100%", display: "flex", flexDirection: "column" }}
												>
													{viewMode === "grid" ? (
														<>
															<div className="hov-img-zoom" style={{ aspectRatio: "4 / 3", width: "100%", overflow: "hidden" }}>
																{/* eslint-disable-next-line @next/next/no-img-element */}
																<img
																	src={imageSrc || "/images/logo.png"}
																	alt={p.name ?? p.title ?? "Product"}
																	style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
																/>
															</div>

															<div className="p-20" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
																<h4 className="p-b-10" style={{ marginTop: 8 }}>
																	{p.name ?? p.title ?? p.slug}
																</h4>

																<div className="txt32 flex-w p-b-10">
																	{p.price ? <span className="color0">${Number(p.price).toFixed(2)}</span> : null}
																	{p.price && (p.serving_size || p.category_name || p.category?.name) ? (
																		<span className="m-r-6 m-l-4">|</span>
																	) : null}
																	{p.serving_size ? <span>{p.serving_size}</span> : null}
																</div>

																<p
																	className="txt14"
																	style={{
																		display: "-webkit-box",
																		WebkitLineClamp: 3,
																		WebkitBoxOrient: "vertical",
																		overflow: "hidden",
																	}}
																>
																	{(p.description ?? p.teaser ?? p.summary ?? "").toString()}
																</p>
																<span className="txt4 m-t-15 color0-hov" style={{ marginTop: "auto" }}>
																	View Details →
																</span>
															</div>
														</>
													) : (
														<div className="row g-0">
															<div className="col-md-5">
																<div className="hov-img-zoom" style={{ height: 220, overflow: "hidden" }}>
																	{/* eslint-disable-next-line @next/next/no-img-element */}
																	<img
																		src={imageSrc || "/images/logo.png"}
																		alt={p.name ?? p.title ?? "Product"}
																		style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
																	/>
																</div>
															</div>

															<div className="col-md-7 ps-md-4">
																<div className="p-20" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
																	<h4 className="p-b-10" style={{ marginTop: 8 }}>
																		{p.name ?? p.title ?? p.slug}
																	</h4>
																	<div className="txt32 flex-w p-b-10">
																		{p.price ? <span className="color0">${Number(p.price).toFixed(2)}</span> : null}
																		{p.price && (p.serving_size || p.category_name || p.category?.name) ? (
																			<span className="m-r-6 m-l-4">|</span>
																		) : null}
																		{p.serving_size ? <span>{p.serving_size}</span> : null}
																	</div>
																	<p
																		className="txt14"
																		style={{
																			display: "-webkit-box",
																			WebkitLineClamp: 4,
																			WebkitBoxOrient: "vertical",
																			overflow: "hidden",
																		}}
																	>
																		{(p.description ?? p.teaser ?? p.summary ?? "").toString()}
																	</p>
																	<span className="txt4 m-t-15 color0-hov" style={{ marginTop: "auto" }}>
																		View Details →
																	</span>
																</div>
															</div>
														</div>
													)}
												</div>
											</a>
										</div>
									);
								})}
							</div>
						) : (
							<p className="txt14">No products found.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export async function getServerSideProps() {
	if (USE_DUMMY_PRODUCTS) {
		let pageData: any = null;
		try {
			const pageRes = await getPublicPageBySlug("products");
			pageData = pageRes.data;
		} catch {
			pageData = null;
		}

		return {
			props: {
				pageData,
				products: DUMMY_PRODUCTS,
				categories: DUMMY_CATEGORIES,
			},
		};
	}

	try {
		// Attempt to fetch a public page config (optional)
		const pageRes = await getPublicPageBySlug("products");

		// Fetch products from common public endpoints
		let products: any[] = [];
		const productEndpoints = ["/public-products", "/public/products", "/products", "/api/products"];
		for (const ep of productEndpoints) {
			try {
				const resp = await axiosInstance.get(ep, { params: { per_page: 1000 }, headers: { "X-No-Loading": true } });
				const data = resp.data?.data ?? resp.data ?? [];
				products = Array.isArray(data) ? data : data?.items ?? data?.rows ?? [];
				if (products && products.length) break;
			} catch {
				// try next
			}
		}

		// Categories: try several endpoints and absolute fallbacks
		let categories: any[] = [];
		const catEndpoints = ["/public-product-categories", "/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
		for (const ep of catEndpoints) {
			try {
				const cresp = await axiosInstance.get(ep, { params: { per_page: 1000 }, headers: { "X-No-Loading": true } });
				const cdata = cresp.data?.data ?? cresp.data ?? [];
				if (Array.isArray(cdata) && cdata.length) { categories = cdata; break; }
			} catch {
				// try next
			}
		}

		return {
			props: {
				pageData: pageRes.data,
				products,
				categories,
			},
		};
	} catch (error: any) {
		console.error("PUBLIC PRODUCTS SSR ERROR:", error?.response?.data || error);
		return {
			props: {
				pageData: null,
				products: [],
				categories: [],
			},
		};
	}
}

ProductsPublicPage.Layout = LandingPageLayout;

