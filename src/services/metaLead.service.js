const axios = require("axios");

const GRAPH_API = `https://graph.facebook.com/${
    process.env.META_API_VERSION || "v23.0"
}`;
const META_API_VERSION = process.env.META_API_VERSION || "v23.0";
const META_PAGE_ID = process.env.META_PAGE_ID || "";
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "";
const getLeadForms = async () => {
    try {
        const pageId = String(
            process.env.META_PAGE_ID || ""
        ).trim();

        const pageAccessToken = String(
            process.env.META_PAGE_ACCESS_TOKEN || ""
        ).trim();

        if (!pageId) {
            throw new Error("META_PAGE_ID is missing");
        }

        if (!pageAccessToken) {
            throw new Error("META_PAGE_ACCESS_TOKEN is missing");
        }

        const response = await axios.get(
            `${GRAPH_API}/${pageId}/leadgen_forms`,
            {
                params: {
                    fields: "id,name,status,created_time",
                    access_token: pageAccessToken
                }
            }
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error(
            "Meta Lead Forms Error:",
            error.response?.data || error.message
        );

        throw new Error(
            error.response?.data?.error?.message ||
            error.message ||
            "Failed to fetch lead forms"
        );
    }
};

const getFormLeads = async (formId) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v26.0/${formId}/leads`,
      {
        params: {
          access_token: process.env.META_PAGE_ACCESS_TOKEN,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Meta Lead API Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

const createMetaLeadForm = async ({
    name,
    privacy_policy_url,
    questions,
    thank_you_title,
    thank_you_description,
}) => {

    // ================= CHECK DUPLICATE FORM =================

    const existingFormsUrl =
        `https://graph.facebook.com/${META_API_VERSION}` +
        `/${META_PAGE_ID}/leadgen_forms` +
        `?fields=id,name,status&access_token=${META_PAGE_ACCESS_TOKEN}`;

    const existingResponse = await fetch(existingFormsUrl);

    const existingData = await existingResponse.json();

    if (existingData.error) {
        throw new Error(
            existingData.error.message ||
            "Failed to check existing Meta forms"
        );
    }

    const duplicateForm = existingData.data?.find(
        (form) =>
            form.name?.trim().toLowerCase() ===
            name.trim().toLowerCase()
    );

    if (duplicateForm) {

        const error = new Error(
            `A lead form with the name "${name}" already exists.`
        );

        error.code = "DUPLICATE_FORM";
        error.existingForm = duplicateForm;

        throw error;
    }

    // ================= CREATE FORM =================

    const url =
        `https://graph.facebook.com/${META_API_VERSION}` +
        `/${META_PAGE_ID}/leadgen_forms`;

    const body = {
        access_token: META_PAGE_ACCESS_TOKEN,

        name,

        privacy_policy: JSON.stringify({
            url: privacy_policy_url,
        }),

        questions: JSON.stringify(questions),
    };

    if (thank_you_title || thank_you_description) {
        body.thank_you_page = JSON.stringify({
            title: thank_you_title,
            body: thank_you_description,
            button_text: "Visit Website",
            button_type: "VIEW_WEBSITE",
            website_url: "https://techleela.com",
        });
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {

        const error = new Error(
            data.error?.message ||
            "Meta API failed to create lead form"
        );

        error.meta = data.error;

        throw error;
    }

    return data;
};


// const archiveLeadForm = async (formId) => {
//   const form = await LeadForm.findOne({ formId });

//   if (!form) {
//     throw new Error("Lead form not found in CRM");
//   }

//   form.status = "ARCHIVED";
//   form.archivedAt = new Date();

//   await form.save();

//   return form;
// };
// const deleteMetaLeadForm = async (formId) => {
//   const url =
//     `https://graph.facebook.com/${META_API_VERSION}/${formId}`;

//   const response = await fetch(url, {
//     method: "DELETE",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       access_token: META_PAGE_ACCESS_TOKEN,
//     }),
//   });

//   const data = await response.json();

//   if (!response.ok || data.error) {
//     throw new Error(
//       data.error?.message || "Meta API failed to delete lead form"
//     );
//   }

//   return data;
// };


module.exports = {
    getLeadForms,
    getFormLeads,
    createMetaLeadForm,
    // archiveLeadForm
    // deleteMetaLeadForm
};