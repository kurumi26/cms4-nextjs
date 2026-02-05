import LandingPageLayout from "@/components/Layout/GuestLayout";
import { axiosInstance } from "@/services/axios";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { toast } from "@/lib/toast";
import { useEffect, useMemo, useState } from "react";

type Props = {
	product: any | null;
	slugOrId: string;
	pageData?: any;
	layout?: {
		fullWidth?: boolean;
	};
};

export const USE_DUMMY_PRODUCTS = true;

export const DUMMY_PRODUCTS: any[] = [
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
		description: "Shrimp saut in a rich butter and garlic sauce.",
		image_url: "/images/butteredshrimp.jpg",
		category_id: 4,
		category: { id: 4, name: "Seafoods" },
	},
];

export const DUMMY_CATEGORIES: any[] = [
	{ id: 1, name: "Appetizers" },
	{ id: 2, name: "Chicken Dishes" },
	{ id: 3, name: "Pasta & Noodles" },
	{ id: 4, name: "Seafoods" },
];

export function getDummyProduct(slugOrId: string): any | null {
	const needle = String(slugOrId || "");
	if (!needle) return null;
	return DUMMY_PRODUCTS.find((p) => String(p?.id) === needle || String(p?.slug) === needle) ?? null;
}

type CartItem = {
	key: string;
	id?: string;
	slug?: string;
	name: string;
	price?: number;
	qty: number;
	image?: string;
};

const CART_STORAGE_KEY = "public_cart";

function safeParseJSON<T>(value: string | null): T | null {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

function readCart(): CartItem[] {
	if (typeof window === "undefined") return [];
	const parsed = safeParseJSON<CartItem[]>(window.localStorage.getItem(CART_STORAGE_KEY));
	return Array.isArray(parsed) ? parsed : [];
}

function writeCart(items: CartItem[]) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function upsertCartItem(nextItem: CartItem) {
	const cart = readCart();
	const idx = cart.findIndex((c) => c.key === nextItem.key);
	if (idx >= 0) {
		cart[idx] = { ...cart[idx], ...nextItem, qty: (cart[idx].qty || 0) + (nextItem.qty || 0) };
	} else {
		cart.push(nextItem);
	}
	writeCart(cart);
}

function unwrapPayload(payload: any): any {
	if (!payload) return null;
	let data: any = payload?.data ?? payload;
	if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
		data = (data as any).data;
		if (data && typeof data === "object" && !Array.isArray(data) && "data" in data) {
			data = (data as any).data;
		}
	}
	return data;
}

function extractArray(payload: any): any[] {
	const data = unwrapPayload(payload);
	if (Array.isArray(data)) return data;
	const candidates = [
		(data as any)?.items,
		(data as any)?.rows,
		(data as any)?.results,
		(data as any)?.products,
	];
	for (const c of candidates) {
		if (Array.isArray(c)) return c;
		if (c && typeof c === "object" && Array.isArray((c as any).data)) return (c as any).data;
	}
	return [];
}

function formatPrice(value: any): string {
	if (value === null || value === undefined || value === "") return "";
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num)) return String(value);
	return `$${num.toFixed(2)}`;
}

function resolveImageUrl(src: any): string | undefined {
	if (!src) return undefined;
	let s = String(src).trim();
	if (!s) return undefined;
	// Normalize backslashes (Windows paths) to URL slashes
	s = s.replace(/\\/g, "/");
	if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;

	// If a Windows absolute path leaks in (e.g. C:/.../public/images/x.jpg)
	// convert it to a public /images/* URL.
	if (/^[a-zA-Z]:\//.test(s)) {
		const lowered = s.toLowerCase();
		const publicImagesIdx = lowered.lastIndexOf("/public/images/");
		if (publicImagesIdx >= 0) {
			return `/images/${s.slice(publicImagesIdx + "/public/images/".length)}`;
		}
		const basename = s.split("/").pop() || "";
		if (basename) return `/images/${basename}`;
	}

	// If it includes /public/images/ (from server responses), strip it.
	if (s.includes("/public/images/")) {
		return `/images/${s.split("/public/images/").pop()}`;
	}

	// Normalize common relative public paths
	// e.g. "images/foo.jpg" => "/images/foo.jpg"
	if (
		s.startsWith("images/") ||
		s.startsWith("img/") ||
		s.startsWith("icons/") ||
		s.startsWith("favicon")
	) {
		return `/${s}`;
	}
	if (s.startsWith("./images/") || s.startsWith("./img/") || s.startsWith("./icons/")) {
		return s.slice(1);
	}

	// If it points to a Next.js public asset, keep it as-is.
	// (e.g. dummy data uses /images/* which should not be rewritten to the API domain)
	if (
		s.startsWith("/images/") ||
		s.startsWith("/img/") ||
		s.startsWith("/icons/") ||
		s.startsWith("/favicon") ||
		s.startsWith("/_next/")
	) {
		return s;
	}

	const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
	if (!base) return s;
	if (s.startsWith("/storage/")) return `${base}${s}`;
	if (s.startsWith("storage/")) return `${base}/${s}`;
	if (s.startsWith("/uploads/")) return `${base}${s}`;
	if (s.startsWith("uploads/")) return `${base}/${s}`;

	// If it's a plain filename (common API payload), prefer local /images in dummy mode
	// so refresh/SSR doesn't try to fetch it from the API storage.
	if (USE_DUMMY_PRODUCTS && !s.includes("/") && /\.(png|jpe?g|webp|gif|svg)$/i.test(s)) {
		if (/\.webp$/i.test(s)) return `/images/${s.replace(/\.webp$/i, ".jpg")}`;
		return `/images/${s}`;
	}

	// Any other root-relative URL is assumed to be a local/public path.
	if (s.startsWith("/")) return s;
	return `${base}/storage/${s.replace(/^\.\/?/, "")}`;
}

async function fetchProductBySlugOrId(slugOrId: string): Promise<any | null> {
	const tryGet = async (url: string, params?: any) => {
		const resp = await axiosInstance.get(url, {
			params,
			headers: { "X-No-Loading": true },
		});
		return resp.data;
	};

	const isNumericId = /^\d+$/.test(slugOrId);

	// If it's numeric, try the real detail endpoint first.
	if (isNumericId) {
		try {
			const payload = await tryGet(`/products/${encodeURIComponent(slugOrId)}`);
			const data = unwrapPayload(payload);
			if (data && typeof data === "object" && !Array.isArray(data)) return data;
		} catch {
			// fall through to list fetch
		}
	}

	// Otherwise (or if id lookup failed), fetch list once and match by id/slug.
	try {
		const payload = await tryGet("/products", { per_page: 1000 });
		const arr = extractArray(payload);
		const needle = String(slugOrId);
		const found = arr.find((p: any) => {
			const pid = String(p?.id ?? p?.product_id ?? "");
			const pslug = String(p?.slug ?? "");
			return pid === needle || pslug === needle;
		});
		if (found) return found;
	} catch {
		// ignore
	}

	return null;
}

export default function PublicProductDetail({ product, slugOrId }: Props) {
	const initial = USE_DUMMY_PRODUCTS ? (getDummyProduct(slugOrId) ?? product ?? null) : (product ?? null);
	const [clientProduct, setClientProduct] = useState<any | null>(initial);
	const [loading, setLoading] = useState<boolean>(!initial);
	const [didTryFetch, setDidTryFetch] = useState<boolean>(false);
	const [qty, setQty] = useState<number>(1);
	const [activeImage, setActiveImage] = useState<string>("");
	const FALLBACK_IMAGE = "/images/logo.png";

	const title = useMemo(() => {
		const p = clientProduct;
		return (p?.name ?? p?.title ?? p?.slug ?? "Product").toString();
	}, [clientProduct]);

	useEffect(() => {
		const next = USE_DUMMY_PRODUCTS ? (getDummyProduct(slugOrId) ?? product ?? null) : (product ?? null);
		setClientProduct(next);
		setLoading(!next);
		setDidTryFetch(false);
		setQty(1);
		setActiveImage("");
	}, [product, slugOrId]);

	useEffect(() => {
		if (USE_DUMMY_PRODUCTS) return;
		if (clientProduct) return;
		if (!slugOrId) return;

		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const p = await fetchProductBySlugOrId(slugOrId);
				if (!cancelled) {
					setClientProduct(p);
					setDidTryFetch(true);
				}
			} catch {
				if (!cancelled) {
					setClientProduct(null);
					setDidTryFetch(true);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [clientProduct]);

	if (loading) {
		return (
			<div className="container">
				<div className="p-t-80 p-b-80">
					<p className="txt14">Loading product…</p>
				</div>
			</div>
		);
	}

	if (!clientProduct) {
		return (
			<div className="container">
				<div className="p-t-80 p-b-80">
					<p className="txt14">{didTryFetch ? "Product not found." : "Unable to load product."}</p>
					<a href="/public/products" className="txt4 color0-hov link-reset">← Back to products</a>
				</div>
			</div>
		);
	}

	const imageUrl = resolveImageUrl(clientProduct.image_url ?? clientProduct.image ?? "") ?? "";
	const gallery = (() => {
		const raw =
			clientProduct?.images ??
			clientProduct?.gallery ??
			clientProduct?.media ??
			clientProduct?.photos ??
			[];
		const fromArray = Array.isArray(raw)
			? raw
				.map((x: any) => {
					if (typeof x === "string") return x;
					return x?.url ?? x?.src ?? x?.path ?? x?.image_url ?? x?.image ?? "";
				})
				.filter(Boolean)
			: [];
		const all = [imageUrl, ...fromArray]
			.map((x) => resolveImageUrl(x) ?? "")
			.filter(Boolean);
		return Array.from(new Set(all));
	})();
	const selectedImage = activeImage || gallery[0] || imageUrl || FALLBACK_IMAGE;
	const [displayImage, setDisplayImage] = useState<string>(selectedImage);

	useEffect(() => {
		setDisplayImage(selectedImage);
	}, [selectedImage]);
	const price = formatPrice(clientProduct.price);
	const priceNumber = (() => {
		const v = clientProduct.price;
		if (v === null || v === undefined || v === "") return undefined;
		const n = typeof v === "number" ? v : Number(v);
		return Number.isFinite(n) ? n : undefined;
	})();
	const category =
		clientProduct?.category?.name ??
		clientProduct?.category?.title ??
		clientProduct?.category_name ??
		"";
	const description = (clientProduct.description ?? clientProduct.teaser ?? clientProduct.summary ?? "").toString();
	const sku = (clientProduct.sku ?? clientProduct.code ?? clientProduct.product_code ?? "").toString();
	const inStock = clientProduct?.in_stock ?? clientProduct?.available ?? clientProduct?.stock !== 0;
	const key = String(clientProduct?.id ?? clientProduct?.slug ?? slugOrId ?? "");

	const clampQty = (n: number) => {
		if (!Number.isFinite(n)) return 1;
		return Math.max(1, Math.min(99, Math.floor(n)));
	};

	const handleAddToCart = () => {
		const finalQty = clampQty(qty);
		upsertCartItem({
			key,
			id: clientProduct?.id ? String(clientProduct.id) : undefined,
			slug: clientProduct?.slug ? String(clientProduct.slug) : undefined,
			name: title,
			price: priceNumber,
			qty: finalQty,
			image: selectedImage,
		});
		toast.success(`Added ${finalQty} to cart`);
	};

	const handleBuyNow = () => {
		handleAddToCart();
		toast.info("Checkout is coming soon. Item added to cart.");
	};

	return (
		<div className="container">
			<div className="p-t-80 p-b-80">
				<div className="p-b-30">
					<a href="/public/products" className="txt4 color0-hov" style={{ textDecoration: "none" }}>
						← Back to products
					</a>
				</div>

				<div className="row g-4">
					<div className="col-lg-7">
						<div className="blo4 bo-rad-10 of-hidden" style={{ border: "1px solid #eee" }}>
							<div className="hov-img-zoom" style={{ aspectRatio: "16 / 10", width: "100%", overflow: "hidden", position: "relative" }}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={displayImage}
									alt={title}
									onError={() => {
										if (displayImage !== FALLBACK_IMAGE) setDisplayImage(FALLBACK_IMAGE);
									}}
									style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
								/>
								{price ? (
									<div
										style={{
											position: "absolute",
											top: 16,
											right: 16,
											background: "rgba(255,255,255,0.95)",
											border: "1px solid #eee",
											borderRadius: 10,
											padding: "10px 14px",
											fontWeight: 700,
										}}
									>
										{price}
									</div>
								) : null}
							</div>
						</div>

						{gallery.length > 1 ? (
							<div className="d-flex flex-wrap" style={{ gap: 10, marginTop: 14 }}>
								{gallery.slice(0, 6).map((src) => {
									const isActive = src === selectedImage;
									return (
										<button
											key={src}
											type="button"
											onClick={() => setActiveImage(src)}
											aria-label="Select image"
											style={{
												width: 86,
												height: 64,
												borderRadius: 10,
												overflow: "hidden",
												border: isActive ? "2px solid #ec1d25" : "1px solid #eee",
												padding: 0,
												background: "#fff",
												cursor: "pointer",
											}}
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
									</button>
									);
								})}
							</div>
						) : null}
					</div>

					<div className="col-lg-5">
						<div className="blo4 bo-rad-10" style={{ border: "1px solid #eee" }}>
							<div className="p-30" style={{ padding: 40 }}>
								<h3 className="txt33 p-b-10" style={{ margin: 0, marginBottom: 6 }}>{title}</h3>

								<div className="txt32 flex-w p-b-20">
									{price ? <span className="color0">{price}</span> : null}
									{price && (category || clientProduct.serving_size) ? <span className="m-r-6 m-l-4">|</span> : null}
									{category ? <span>{category}</span> : null}
									{category && clientProduct.serving_size ? <span className="m-r-6 m-l-4">|</span> : null}
									{clientProduct.serving_size ? <span>{clientProduct.serving_size}</span> : null}
								</div>

								<div className="flex-w" style={{ gap: 10, marginBottom: 22 }}>
									{sku ? (
										<span style={{ border: "1px solid #eee", borderRadius: 10, padding: "6px 10px", fontSize: 12, color: "#666" }}>
											SKU: {sku}
										</span>
									) : null}
									<span
										style={{
											border: `1px solid ${inStock ? "rgba(25,135,84,0.25)" : "rgba(220,53,69,0.25)"}`,
											background: inStock ? "rgba(25,135,84,0.08)" : "rgba(220,53,69,0.06)",
											color: inStock ? "#198754" : "#dc3545",
											borderRadius: 10,
											padding: "6px 10px",
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										{inStock ? "In stock" : "Check availability"}
									</span>
								</div>

								{description ? (
									<p className="txt14" style={{ whiteSpace: "pre-line", marginTop: 6 }}>{description}</p>
								) : (
									<p className="txt14">No description.</p>
								)}

								<hr style={{ opacity: 0.12, margin: "22px 0" }} />

								<div className="bo-rad-10" style={{ border: "1px solid #eee", padding: 16 }}>
									<div className="d-flex align-items-center justify-content-between" style={{ gap: 12 }}>
										<span className="txt14" style={{ fontWeight: 600, margin: 0 }}>Quantity</span>
										<div className="d-flex align-items-center" style={{ gap: 8 }}>
											<button
												type="button"
												onClick={() => setQty((q) => clampQty(q - 1))}
												className="btn2 flex-c-m txt10 trans-0-4"
												style={{ width: 40, height: 40, border: "1px solid #eee" }}
												aria-label="Decrease quantity"
											>
												−
											</button>
											<input
												type="number"
												inputMode="numeric"
												min={1}
												max={99}
												value={qty}
												onChange={(e) => setQty(clampQty(Number(e.target.value)))}
												className="txt14"
												style={{ width: 64, height: 40, borderRadius: 10, border: "1px solid #eee", textAlign: "center" }}
												aria-label="Quantity"
											/>
											<button
												type="button"
												onClick={() => setQty((q) => clampQty(q + 1))}
												className="btn2 flex-c-m txt10 trans-0-4"
												style={{ width: 40, height: 40, border: "1px solid #eee" }}
												aria-label="Increase quantity"
											>
												+
											</button>
										</div>
									</div>

									<div className="d-flex flex-wrap" style={{ gap: 12, marginTop: 14 }}>
										<button
											type="button"
											onClick={handleAddToCart}
											className="btn3 flex-c-m size31 txt11 trans-0-4"
										>
											Add to cart
										</button>
										<button
											type="button"
											onClick={handleBuyNow}
											className="btn2 flex-c-m size31 txt10 trans-0-4"
											style={{ border: "1px solid #eee" }}
										>
											Buy now
										</button>
									</div>

									<p className="txt14" style={{ color: "#888", marginTop: 12, marginBottom: 0, fontSize: 12 }}>
										Secure checkout • Fast support • Easy returns
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export async function getServerSideProps(context: any) {
	const slugOrId = String(context?.params?.slug ?? "");
	if (!slugOrId) return { notFound: true };

	if (USE_DUMMY_PRODUCTS) {
		let productsPageData: any = null;
		try {
			const pageRes = await getPublicPageBySlug("products");
			productsPageData = pageRes.data;
		} catch {
			productsPageData = null;
		}

		return {
			props: {
				product: getDummyProduct(slugOrId),
				slugOrId,
				pageData: productsPageData ?? { title: "Products", album: null },
				layout: { fullWidth: true },
			},
		};
	}

	try {
		// Match the Products page banner (title + album)
		let productsPageData: any = null;
		try {
			const pageRes = await getPublicPageBySlug("products");
			productsPageData = pageRes.data;
		} catch {
			// If this fails server-side, we still render the page.
		}

		const product = await fetchProductBySlugOrId(slugOrId);
		// Never hard-404 on SSR: backend/baseURL/auth can differ server-side.
		// If we don't have it yet, the client will fetch it.
		return {
			props: {
				product: product ?? null,
				slugOrId,
				pageData: productsPageData ?? { title: "Products", album: null },
				layout: { fullWidth: true },
			},
		};
	} catch {
		return {
			props: {
				product: null,
				slugOrId,
				pageData: { title: "Products", album: null },
				layout: { fullWidth: true },
			},
		};
	}
}

PublicProductDetail.Layout = LandingPageLayout;
