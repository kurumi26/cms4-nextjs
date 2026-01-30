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
	const [clientProduct, setClientProduct] = useState<any | null>(product ?? null);
	const [loading, setLoading] = useState<boolean>(!product);
	const [didTryFetch, setDidTryFetch] = useState<boolean>(false);

	const title = useMemo(() => {
		const p = clientProduct;
		return (p?.name ?? p?.title ?? p?.slug ?? "Product").toString();
	}, [clientProduct]);

	useEffect(() => {
		setClientProduct(product ?? null);
		setLoading(!product);
		setDidTryFetch(false);
	}, [product]);

	useEffect(() => {
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
			<section className="products-section product-detail">
				<div className="container">
					<div className="card border-0 shadow-sm">
						<div className="card-body">Loading product…</div>
					</div>
				</div>
			</section>
		);
	}

	if (!clientProduct) {
		return (
			<section className="products-section">
				<div className="container">
					<div className="card border-0 shadow-sm">
						<div className="card-body">{didTryFetch ? "Product not found." : "Unable to load product."}</div>
					</div>
				</div>
			</section>
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
		<section className="products-section product-detail">
			<div className="container">
				<div className="product-detail__top">
					<a href="/public/products" className="product-detail__back">
						← Back to products
					</a>
				</div>

				<div className="row g-4 align-items-start">
					<div className="col-lg-6">
						<div className="product-detail__media shadow-sm">
							{imageUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={imageUrl} alt={title} className="product-detail__image" />
							) : (
								<div className="product-detail__placeholder" />
							)}
							{price ? <span className="badge bg-primary product-detail__price">{price}</span> : null}
						</div>
					</div>

					<div className="col-lg-6">
						<div className="product-detail__card shadow-sm">
							<h1 className="product-detail__title">{title}</h1>
							<div className="product-detail__meta">
								{category ? <span className="product-detail__chip">{category}</span> : null}
								{clientProduct.serving_size ? (
									<span className="product-detail__chip product-detail__chip--muted">{clientProduct.serving_size}</span>
								) : null}
							</div>

							{description ? (
								<p className="product-detail__desc">{description}</p>
							) : (
								<p className="product-detail__desc text-muted">No description.</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export async function getServerSideProps(context: any) {
	const slugOrId = String(context?.params?.slug ?? "");
	if (!slugOrId) return { notFound: true };

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
