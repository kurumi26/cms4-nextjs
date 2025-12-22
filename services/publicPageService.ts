import { axiosInstance } from "./axios";

export interface PublicPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

export const getPublicPageBySlug = (slug: string) => {
  return axiosInstance.get<PublicPage>(`/public/pages/${slug}`);
};
