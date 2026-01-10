import { axiosInstance } from "@/services/axios";

export const websiteService = {
  /* ======================
     GET SETTINGS
  ====================== */
  async getSettings() {
    const { data } = await axiosInstance.get("/website-settings");
    return data.setting;
  },

  /* ======================
     WEBSITE TAB
  ====================== */
  async updateWebsite(payload: FormData) {
    return axiosInstance.post("/website-settings/website", payload);
  },

  /* ======================
     CONTACT TAB
  ====================== */
  async updateContact(payload: {
    company_address: string;
    mobile_no: string;
    fax_no?: string;
    tel_no: string;
    email: string;
  }) {
    return axiosInstance.post("/website-settings/contact", payload);
  },

  /* ======================
     PRIVACY TAB
  ====================== */
  async updatePrivacy(payload: {
    data_privacy_title: string;
    data_privacy_popup_content: string;
    data_privacy_content: string;
  }) {
    return axiosInstance.post("/website-settings/privacy", payload);
  },

  /* ======================
     SOCIAL MEDIA
  ====================== */
  async getSocials() {
    return axiosInstance.get("/website-settings/social");
  },

  async updateSocials(socials: any[]) {
    return axiosInstance.post("/website-settings/social", { socials });
  },
};
