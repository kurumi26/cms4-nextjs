import LandingPageLayout from "@/components/Layout/GuestLayout";
import { axiosInstance } from "@/services/axios";
import { getPublicPageBySlug } from "@/services/publicPageService";
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

	const title = useMemo(() => {
		const p = clientProduct;
		return (p?.name ?? p?.title ?? p?.slug ?? "Product").toString();
	}, [clientProduct]);

	useEffect(() => {
		const next = USE_DUMMY_PRODUCTS ? (getDummyProduct(slugOrId) ?? product ?? null) : (product ?? null);
		setClientProduct(next);
		setLoading(!next);
		setDidTryFetch(false);
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
	const price = formatPrice(clientProduct.price);
	const category =
		clientProduct?.category?.name ??
		clientProduct?.category?.title ??
		clientProduct?.category_name ??
		"";
	const description = (clientProduct.description ?? clientProduct.teaser ?? clientProduct.summary ?? "").toString();

	return (
		<div className="container">
			<div className="p-t-80 p-b-80">
				<div className="p-b-30">
					<a href="/public/products" className="txt4 color0-hov link-reset">← Back to products</a>
				</div>

				<div className="row">
					<div className="col-lg-6 p-b-40">
						<div className="blo4 bo-rad-10 of-hidden">
							<div className="hov-img-zoom">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={imageUrl || "/images/blog-01.jpg"}
									alt={title}
									style={{ width: "100%", height: "auto" }}
								/>
							</div>
						</div>
					</div>

					<div className="col-lg-6">
						<h3 className="txt33 p-b-10">{title}</h3>

						<div className="txt32 flex-w p-b-20">
							{price ? <span className="color0">{price}</span> : null}
							{price && (category || clientProduct.serving_size) ? <span className="m-r-6 m-l-4">|</span> : null}
							{category ? <span>{category}</span> : null}
							{(category && clientProduct.serving_size) ? <span className="m-r-6 m-l-4">|</span> : null}
							{clientProduct.serving_size ? <span>{clientProduct.serving_size}</span> : null}
						</div>

						<div className="blo4 bo-rad-10 p-30">
							{description ? (
								<p className="txt14" style={{ whiteSpace: "pre-line" }}>{description}</p>
							) : (
								<p className="txt14">No description.</p>
							)}
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
