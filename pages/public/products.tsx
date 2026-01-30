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
	// Absolute URLs or data/blob URLs
	if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;
	// Normalize to a usable absolute URL for files coming from the API
	const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
	if (!base) return s;
	// If API returns '/storage/..' or 'storage/..' or just a filename, serve from /storage
	if (s.startsWith("/storage/")) return `${base}${s}`;
	if (s.startsWith("storage/")) return `${base}/${s}`;
	if (s.startsWith("/")) return `${base}${s}`;
	return `${base}/storage/${s.replace(/^\.\/?/, "")}`;
}

export default function ProductsPublicPage({ products, categories, pageData }: Props) {
	const [clientProducts, setClientProducts] = useState<any[]>(products || []);
	const [clientCategories, setClientCategories] = useState<any[]>(categories || []);
	const [categoryQuery, setCategoryQuery] = useState<string>("");

	useEffect(() => {
		setClientProducts(products || []);
		setClientCategories(categories || []);
	}, [products, categories]);

	useEffect(() => {
		// If SSR couldn't fetch (often due to auth token only available in localStorage), try in the browser.
		if ((products && products.length) || (categories && categories.length)) return;

		let cancelled = false;
		const run = async () => {
			const tryInstance = async (ep: string, params?: any) => {
				const resp = await axiosInstance.get(ep, { params, headers: { "X-No-Loading": true } });
				return resp.data;
			};

			try {
				// Products (backend supports /products; public-* routes 404 in this environment)
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

				// Categories (backend supports /fetch-product-categories and /product-categories)
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
					<div className="card products-sidebar shadow-sm">
						<div className="card-body">
							<div className="products-sidebar__header">
								<h5 className="products-sidebar__title">Categories</h5>
								<div className="products-sidebar__subtitle">Quick links to jump to a section</div>
							</div>

							<div className="products-sidebar__search">
								<input
									type="search"
									value={categoryQuery}
									onChange={(e) => setCategoryQuery(e.target.value)}
									placeholder="Search categories…"
									aria-label="Search categories"
								/>
							</div>

							{effectiveCategories && effectiveCategories.length ? (
								<nav className="products-sidebar__links" aria-label="Category quick links">
									<a className="category-chip category-chip--all" href="#products-top">
										<span className="chip-label">All products</span>
										<span className="chip-count">{effectiveProducts.length}</span>
									</a>

									{navCategories.map((c: any) => {
										const catId = getCategoryId(c);
										return (
											<a key={catId} className="category-chip" href={`#cat-${catId}`}>
											<span className="chip-label">{getCategoryLabel(c)}</span>
											<span className="chip-count">{(byCat[catId] || []).length}</span>
										</a>
									);
									})}
								</nav>
							) : (
								<div className="text-muted">No categories</div>
							)}
						</div>
					</div>
				</div>

				<div id="products-top" className="col-lg-9">
					{sortedCategories && sortedCategories.length ? (
						sortedCategories.map((c: any) => {
							const catId = getCategoryId(c);
							return (
							<div key={c.id ?? c.slug} id={`cat-${catId}`} className="mb-4 category-section">
								<h4 className="mb-3 category-heading">{getCategoryLabel(c)}</h4>
								<div className="row g-3">
									{(byCat[catId] || []).map((p: any) => (
										<div key={p.id ?? p.slug} className="col-md-6 col-xl-4">
											<div className="card h-100 border-0 shadow-sm product-card">
												<div className="product-media">
														{p.image_url || p.image ? (
															// eslint-disable-next-line @next/next/no-img-element
															<img
																className="product-image"
																src={resolveImageUrl(p.image_url ?? p.image)}
																alt={p.name}
																loading="eager"
																fetchPriority="high"
																decoding="async"
															/>
														) : (
														<div className="product-placeholder" />
														)}
													{p.price ? (
														<span className="badge bg-primary price-badge">{formatPrice(p.price)}</span>
													) : null}
													</div>
													<div className="card-body d-flex flex-column">
														<a
															href={`/public/product/${p.slug ?? p.id}`}
															className="stretched-link"
															aria-label={`Open ${(p.name ?? p.title ?? p.slug ?? "product").toString()}`}
														/>
														<h5 className="product-title">{p.name ?? p.title ?? p.slug}</h5>
														<div className="product-meta">{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name ?? ""}</div>
													<p className="product-desc">{(p.description ?? p.teaser ?? p.summary ?? "").toString()}</p>
													<div className="product-actions mt-auto">
														{p.serving_size ? <small className="product-serving">{p.serving_size}</small> : null}
														</div>
													</div>
												</div>
											</div>
									))}
								</div>
							</div>
							);
						})
					) : (
						effectiveProducts && effectiveProducts.length ? (
							<div className="mb-4">
								<h4 className="mb-3">Products</h4>
								<div className="row g-3">
									{effectiveProducts.map((p: any) => (
										<div key={p.id ?? p.slug} className="col-md-6 col-xl-4">
											<div className="card h-100 border-0 shadow-sm product-card">
												<div className="product-media">
													{p.image_url || p.image ? (
														// eslint-disable-next-line @next/next/no-img-element
														<img
															className="product-image"
															src={resolveImageUrl(p.image_url ?? p.image)}
															alt={p.name}
															loading="eager"
															fetchPriority="high"
															decoding="async"
														/>
													) : (
														<div className="product-placeholder" />
													)}
													{p.price ? (
														<span className="badge bg-primary price-badge">{formatPrice(p.price)}</span>
													) : null}
												</div>
												<div className="card-body d-flex flex-column">
													<a
														href={`/public/product/${p.slug ?? p.id}`}
														className="stretched-link"
														aria-label={`Open ${(p.name ?? p.title ?? p.slug ?? "product").toString()}`}
													/>
													<h5 className="product-title">{p.name ?? p.title ?? p.slug}</h5>
													<div className="product-meta">{(p.category && (p.category.name ?? p.category.title)) ?? p.category_name ?? ""}</div>
													<p className="product-desc">{(p.description ?? p.teaser ?? p.summary ?? "").toString()}</p>
													<div className="product-actions mt-auto">
														{p.serving_size ? <small className="product-serving">{p.serving_size}</small> : null}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="card">
								<div className="card-body">No products found.</div>
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
		// Attempt to fetch a public page config (optional)
		const pageRes = await getPublicPageBySlug("products");

		// Fetch products via productService (robust client used by admin) and fall back to common public endpoints
		let products: any[] = [];
		try {
			const res = await productService.getProducts({ per_page: 1000 });
			const data = res?.data ?? res ?? [];
			products = Array.isArray(data) ? data : data?.items ?? data?.rows ?? data?.data ?? [];
		} catch (e: any) {
			// ignore and fall back to endpoint tries
		}

		if (!products || products.length === 0) {
			// This backend does not expose public-* routes; use /products only.
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

		// Categories: try several endpoints and absolute fallbacks
		let categories: any[] = [];
		const catEndpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
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

