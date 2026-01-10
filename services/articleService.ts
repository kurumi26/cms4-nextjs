import { axiosInstance } from "@/services/axios";

export interface CreateArticleCategoryPayload {
  name: string;
}

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  user_id: number;
  created_at?: string;
}

export const createArticleCategory = async (
  payload: CreateArticleCategoryPayload
): Promise<ArticleCategory> => {
  const res = await axiosInstance.post("/article-categories", payload);
  return res.data.data;
};

export const fetchArticleCategories = async (): Promise<ArticleCategory[]> => {
  const res = await axiosInstance.get("/fetch-article-categories");
  return res.data.data;
};

// fetch categories

export interface NewsCategoryRow {
  id: number;
  name: string;
  slug: string;
  articles_count?: number;
  created_at?: string;
}

interface FetchCategoriesParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export const getArticleCategories = async (
  params: FetchCategoriesParams
) => {
  const res = await axiosInstance.get("/article-categories", {
    params,
  });

  return res.data;
};

//update category

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}

export const getArticleCategory = async (id: number) => {
  const res = await axiosInstance.get(`/article-categories/${id}`);
  return res.data.data;
};

export const updateArticleCategory = async (
  id: number,
  payload: { name: string }
) => {
  const res = await axiosInstance.put(`/article-categories/${id}`, payload);
  return res.data.data;
};

export interface CreateArticlePayload {
  title: string;
  date: string;
  category_id: number;
  content: string;
  teaser: string;
  status: "private" | "published";
  is_featured: boolean;

  banner?: File | null;
  thumbnail?: File | null;

  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
}

export const createArticle = async (payload: CreateArticlePayload) => {
  const formData = new FormData();

  formData.append("name", payload.title);
  formData.append("date", payload.date);
  formData.append("category_id", payload.category_id.toString());
  formData.append("contents", payload.content);
  formData.append("teaser", payload.teaser);
  formData.append("status", payload.status);
  formData.append("is_featured", payload.is_featured ? "1" : "0");

  if (payload.banner) formData.append("banner", payload.banner);
  if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);

  if (payload.meta_title) formData.append("meta_title", payload.meta_title);
  if (payload.meta_keyword) formData.append("meta_keyword", payload.meta_keyword);
  if (payload.meta_description)
    formData.append("meta_description", payload.meta_description);

  const res = await axiosInstance.post("/articles", formData);

  return res.data;
};

export interface ArticleRow {
  id: number;
  title: string;
  category: string;
  is_featured: boolean;
  visibility: string;
  updated: string;
}

interface GetArticlesParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export const getArticles = async (params: GetArticlesParams) => {
  const res = await axiosInstance.get("/articles", { params });
  return res.data; // 🔥 RAW Laravel pagination
};


export const getArticle = async (id: number) => {
  const res = await axiosInstance.get(`/articles/${id}`);
  return res.data.data;
};

export const updateArticle = async (
  id: number,
  payload: any
) => {
  const formData = new FormData();

  formData.append("name", payload.title);
  formData.append("date", payload.date);
  formData.append("category_id", payload.category_id.toString());
  formData.append("contents", payload.content);
  formData.append("teaser", payload.teaser);
  formData.append("status", payload.status);
  formData.append("is_featured", payload.is_featured ? "1" : "0");

  if (payload.banner) formData.append("banner", payload.banner);
  if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);

  if (payload.meta_title)
    formData.append("meta_title", payload.meta_title);
  if (payload.meta_keyword)
    formData.append("meta_keyword", payload.meta_keyword);
  if (payload.meta_description)
    formData.append("meta_description", payload.meta_description);

  const res = await axiosInstance.post(
    `/articles/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
};



// news page endpoints
export const getPublicArticles = (params?: any) =>
  axiosInstance.get("/public-articles", { params });

export const getCategories = () =>
  axiosInstance.get("/public-article-categories");

export const getArchive = () =>
  axiosInstance.get("/public-articles-archive");

export const getArticleBySlug = (slug: string) =>
  axiosInstance.get(`/public-articles/${slug}`);
