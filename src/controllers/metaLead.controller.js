const metaLeadService = require("../services/metaLead.service");

const getLeadForms = async (req, res) => {
    try {
        const result = await metaLeadService.getLeadForms();

        return res.status(200).json(result);

    } catch (error) {
        console.error("Get Lead Forms Controller Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const fetchFormLeads = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: "Form ID is required",
      });
    }

    const leads = await metaLeadService.getFormLeads(formId);

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.response?.data || error.message,
    });
  }
};


const createLeadForm = async (req, res) => {
  try {
    const {
      name,
      privacy_policy_url,
      questions = [],
      thank_you_title,
      thank_you_description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Form name is required",
      });
    }

    if (!privacy_policy_url) {
      return res.status(400).json({
        success: false,
        message: "Privacy policy URL is required",
      });
    }

    const result = await metaLeadService.createMetaLeadForm({
      name,
      privacy_policy_url,
      questions,
      thank_you_title,
      thank_you_description,
    });

    return res.status(201).json({
      success: true,
      message: "Lead form created successfully",
      data: result,
    });
  } catch (error) {

    console.error(
        "Create Lead Form Error:",
        error.meta || error
    );

    return res.status(500).json({
        success: false,
        message: error.meta?.message || error.message,
        error: error.meta || error.message,
    });
}
};


// const deleteLeadForm = async (req, res) => {
//   try {
//     const { formId } = req.params;

//     if (!formId) {
//       return res.status(400).json({
//         success: false,
//         message: "Form ID is required",
//       });
//     }

//     const result = await metaLeadService.deleteMetaLeadForm(formId);

//     return res.status(200).json({
//       success: true,
//       message: "Lead form deleted successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error(
//       "Delete Lead Form Error:",
//       error.message
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete lead form",
//       error: error.message,
//     });
//   }
// };

// const archiveForm = async (req, res) => {
//   try {
//     const { formId } = req.params;

//     if (!formId) {
//       return res.status(400).json({
//         success: false,
//         message: "Form ID is required",
//       });
//     }

//     const form = await metaLeadService.archiveLeadForm(formId);

//     return res.status(200).json({
//       success: true,
//       message: "Lead form archived successfully",
//       data: form,
//     });
//   } catch (error) {
//     console.error("Archive Lead Form Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


module.exports = {
    getLeadForms,
    fetchFormLeads,
    createLeadForm,
    // archiveForm
    // deleteLeadForm
};