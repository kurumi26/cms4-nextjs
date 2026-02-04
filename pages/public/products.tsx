import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { axiosInstance } from "@/services/axios";
import productService from "@/services/productService";
import { useEffect, useMemo, useState } from "react";

type Props = {
	pageData: any;
	products: any[];
	categories: any[];
	layout?: {
		fullWidth?: boolean;
		hideBanner?: boolean;
	};
};

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

function getCategoryLabel(c: any): string {
	return String(c?.name ?? c?.title ?? c?.slug ?? "Category");
}

function normalizeNumber(value: any): number | undefined {
	if (value === null || value === undefined || value === "") return undefined;
	const num = Number(value);
	return Number.isFinite(num) ? num : undefined;
}

function getCategorySortKey(c: any): number | undefined {
	return (
		normalizeNumber(c?.order) ??
		normalizeNumber(c?.sort_order) ??
		normalizeNumber(c?.position) ??
		normalizeNumber(c?.display_order) ??
		normalizeNumber(c?.rank) ??
		undefined
	);
}

function resolveImageUrl(src: any): string | undefined {
	if (!src) return undefined;
	const s = String(src);
	if (!s) return undefined;
	if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;
	const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
	if (!base) return s;
	if (s.startsWith("/storage/")) return `${base}${s}`;
	if (s.startsWith("storage/")) return `${base}/${s}`;
	if (s.startsWith("/")) return `${base}${s}`;
	return `${base}/storage/${s.replace(/^\.\/?/, "")}`;
}

export default function ProductsPublicPage({ products, categories, pageData }: Props) {
	const [clientProducts, setClientProducts] = useState<any[]>(products || []);
	const [clientCategories, setClientCategories] = useState<any[]>(categories || []);
	const [categoryQuery, setCategoryQuery] = useState<string>("");
	const [activeCategory, setActiveCategory] = useState<string>("*");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	useEffect(() => {
		setClientProducts(products || []);
		setClientCategories(categories || []);
	}, [products, categories]);

	useEffect(() => {
		if ((products && products.length) || (categories && categories.length)) return;

		let cancelled = false;
		const run = async () => {
			const tryInstance = async (ep: string, params?: any) => {
				const resp = await axiosInstance.get(ep, {
					params,
					headers: { "X-No-Loading": true, "X-No-Auth-Redirect": true },
				});
				return resp.data;
			};

			try {
				let nextProducts: any[] = [];
				const productEndpoints = ["/products"];
				for (const ep of productEndpoints) {
					try {
						const payload = await tryInstance(ep, { per_page: 1000 });
						nextProducts = extractArray(payload);
						if (nextProducts.length) break;
					} catch {
						// try next
					}
				}

				let nextCategories: any[] = [];
				const catEndpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
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

	const effectiveProducts = clientProducts || [];
	const effectiveCategories = clientCategories || [];
	const byCat = useMemo(() => groupByCategory(effectiveProducts), [effectiveProducts]);

	const sortedCategories = useMemo(() => {
		const list = [...effectiveCategories];
		const hasAnyOrder = list.some((c: any) => typeof getCategorySortKey(c) === "number");
		if (!hasAnyOrder) return list;
		return list.sort((a: any, b: any) => (getCategorySortKey(a) ?? 0) - (getCategorySortKey(b) ?? 0));
	}, [effectiveCategories]);

	const navCategories = useMemo(() => {
		const query = categoryQuery.trim().toLowerCase();
		if (!query) return sortedCategories;
		return sortedCategories.filter((c: any) => {
			const label = getCategoryLabel(c).toLowerCase();
			return label.includes(query);
		});
	}, [sortedCategories, categoryQuery]);

	const formatPrice = (value: any) => {
		if (value === null || value === undefined || value === "") return "";
		const num = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(num)) return String(value);
		return `$${num.toFixed(2)}`;
	};

	return (
		<div className="products-section">
			<div className="row g-4 mx-0">
				<div className="col-lg-3 mb-4">
					<div className="sidebar-card">
						<div className="sidebar-header">
							<h5 className="sidebar-title">Categories</h5>
						</div>

						<div className="sidebar-search">
							<input
								type="search"
								value={categoryQuery}
								onChange={(e) => setCategoryQuery(e.target.value)}
								placeholder="Search..."
								aria-label="Search categories"
								className="search-input"
							/>
						</div>

						{effectiveCategories && effectiveCategories.length ? (
							<nav className="category-nav" aria-label="Category quick links">
								<button
									className={`category-link ${activeCategory === "*" ? "active" : ""}`}
									onClick={(e) => {
										e.preventDefault();
										setActiveCategory("*");
										document.getElementById("products-top")?.scrollIntoView({ behavior: "smooth" });
									}}
								>
									<span className="category-name">All Products</span>
									<span className="category-count">{effectiveProducts.length}</span>
								</button>

								{navCategories.map((c: any) => {
									const catId = getCategoryId(c);
									return (
										<button
											key={catId}
											className={`category-link ${activeCategory === catId ? "active" : ""}`}
											onClick={(e) => {
												e.preventDefault();
												setActiveCategory(catId);
												document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: "smooth" });
											}}
										>
											<span className="category-name">{getCategoryLabel(c)}</span>
											<span className="category-count">{(byCat[catId] || []).length}</span>
										</button>
									);
								})}
							</nav>
						) : (
							<div className="sidebar-empty">
								<p>No categories available</p>
							</div>
						)}
					</div>
				</div>

				<div id="products-top" className="col-lg-9">
					{/* View Controls */}
					<div className="content-controls">
						<div className="control-left">
							<span className="result-count">{effectiveProducts.length} Products</span>
						</div>
						<div className="control-right">
							<button
								className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
								onClick={() => setViewMode("grid")}
								aria-label="Grid view"
								title="Grid view"
							>
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
									<rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
									<rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
									<rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
									<rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
								</svg>
							</button>
							<button
								className={`view-btn ${viewMode === "list" ? "active" : ""}`}
								onClick={() => setViewMode("list")}
								aria-label="List view"
								title="List view"
							>
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
									<line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									<line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									<line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
							</button>
						</div>
					</div>

					{sortedCategories && sortedCategories.length ? (
						sortedCategories.map((c: any, idx: any) => {
							const catId = getCategoryId(c);
							return (
								<div
									key={c.id ?? c.slug}
									id={`cat-${catId}`}
									className="mb-5 category-section"
									style={{ animationDelay: `${idx * 0.1}s` }}
								>
									<div className="category-title-wrap">
										<h2 className="category-title">{getCategoryLabel(c)}</h2>
									</div>
									<div className={`product-grid ${viewMode === "list" ? "list-view" : ""}`}>
										{(byCat[catId] || []).map((p: any, pIdx: any) => (
											<article
												key={p.id ?? p.slug}
												className="product-item"
												style={{ animationDelay: `${pIdx * 0.05}s` }}
											>
												<a
													href={`/public/product/${p.slug ?? p.id}`}
													className="product-link-wrapper"
													aria-label={`View ${(p.name ?? p.title ?? p.slug ?? "product").toString()}`}
												>
													<div className="product-image-container">
														{p.image_url || p.image ? (
															// eslint-disable-next-line @next/next/no-img-element
															<img
																className="product-img"
																src={resolveImageUrl(p.image_url ?? p.image)}
																alt={p.name}
																loading="lazy"
																decoding="async"
															/>
														) : (
															<div className="product-img-placeholder">
																<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
																	<rect x="5" y="5" width="30" height="30" rx="2"/>
																	<circle cx="14" cy="14" r="3"/>
																	<path d="M5 27L13 19L20 26L27 19L35 27" strokeLinecap="round" strokeLinejoin="round"/>
																</svg>
															</div>
														)}
													</div>

													<div className="product-content">
														<div className="product-header">
															<h3 className="product-name">{p.name ?? p.title ?? p.slug}</h3>
															{p.price && (
																<span className="product-price">{formatPrice(p.price)}</span>
															)}
														</div>

														{(p.description || p.teaser || p.summary) && (
															<p className="product-description">
																{(p.description ?? p.teaser ?? p.summary ?? "").toString()}
															</p>
														)}

														<div className="product-meta-row">
															{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name ? (
																<span className="product-tag">
																	{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name}
																</span>
															) : null}
															{p.serving_size && (
																<span className="product-detail">{p.serving_size}</span>
															)}
														</div>
													</div>
												</a>
											</article>
										))}
									</div>
								</div>
							);
						})
					) : (
						effectiveProducts && effectiveProducts.length ? (
							<div className="mb-4">
								<div className="category-title-wrap">
									<h2 className="category-title">All Products</h2>
								</div>
								<div className={`product-grid ${viewMode === "list" ? "list-view" : ""}`}>
									{effectiveProducts.map((p: any, pIdx: any) => (
										<article
											key={p.id ?? p.slug}
											className="product-item"
											style={{ animationDelay: `${pIdx * 0.05}s` }}
										>
											<a
												href={`/public/product/${p.slug ?? p.id}`}
												className="product-link-wrapper"
												aria-label={`View ${(p.name ?? p.title ?? p.slug ?? "product").toString()}`}
											>
												<div className="product-image-container">
													{p.image_url || p.image ? (
														// eslint-disable-next-line @next/next/no-img-element
														<img
															className="product-img"
															src={resolveImageUrl(p.image_url ?? p.image)}
															alt={p.name}
															loading="lazy"
															decoding="async"
														/>
													) : (
														<div className="product-img-placeholder">
															<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
																<rect x="5" y="5" width="30" height="30" rx="2"/>
																<circle cx="14" cy="14" r="3"/>
																<path d="M5 27L13 19L20 26L27 19L35 27" strokeLinecap="round" strokeLinejoin="round"/>
															</svg>
														</div>
													)}
												</div>

												<div className="product-content">
													<div className="product-header">
														<h3 className="product-name">{p.name ?? p.title ?? p.slug}</h3>
														{p.price && (
															<span className="product-price">{formatPrice(p.price)}</span>
														)}
													</div>

													{(p.description || p.teaser || p.summary) && (
														<p className="product-description">
															{(p.description ?? p.teaser ?? p.summary ?? "").toString()}
														</p>
													)}

													<div className="product-meta-row">
														{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name ? (
															<span className="product-tag">
																{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name}
															</span>
														) : null}
														{p.serving_size && (
															<span className="product-detail">{p.serving_size}</span>
														)}
													</div>
												</div>
											</a>
										</article>
									))}
								</div>
							</div>
						) : (
							<div className="empty-content">
								<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
									<circle cx="32" cy="32" r="24"/>
									<path d="M32 24v16M32 44h.01" strokeLinecap="round"/>
								</svg>
								<h3>No products found</h3>
								<p>Check back later for new items</p>
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}

export async function getServerSideProps() {
	try {
		const pageRes = await getPublicPageBySlug("products");

		let products: any[] = [];
		try {
			const res = await productService.getProducts({ per_page: 1000 });
			const data = res?.data ?? res ?? [];
			products = Array.isArray(data) ? data : data?.items ?? data?.rows ?? data?.data ?? [];
		} catch (e: any) {
			// ignore
		}

		if (!products || products.length === 0) {
			const productEndpoints = ["/products"];
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
		}

		let categories: any[] = [];
		const catEndpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
		for (const ep of catEndpoints) {
			try {
				const cresp = await axiosInstance.get(ep, { params: { per_page: 1000 }, headers: { "X-No-Loading": true } });
				const cdata = cresp.data?.data ?? cresp.data ?? [];
				if (Array.isArray(cdata) && cdata.length) {
					categories = cdata;
					break;
				}
			} catch {
				// try next
			}
		}

		return {
			props: {
				pageData: pageRes.data,
				products,
				categories,
				layout: { fullWidth: true },
			},
		};
	} catch (error: any) {
		console.error("PUBLIC PRODUCTS SSR ERROR:", error?.response?.data || error);
		return {
			props: {
				pageData: null,
				products: [],
				categories: [],
				layout: { fullWidth: true },
			},
		};
	}
}

ProductsPublicPage.Layout = LandingPageLayout;
