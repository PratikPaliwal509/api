const agenciesService = require('../services/agencies.service');
const { successResponse } = require('../utils/response');

// CREATE AGENCY
exports.createAgency = async (req, res, next) => {
  try {
    const agency = await agenciesService.createAgency(req.body);
    return successResponse(res, 'Agency created successfully', agency);
  } catch (error) {
    next(error);
  }
};

// GET AGENCY PROFILE
exports.getAgencyById = async (req, res, next) => {
  try {
    const agency = await agenciesService.getAgencyById(req.params.id);
    return successResponse(res, 'Agency fetched successfully', agency);
  } catch (error) {
    next(error);
  }
};

exports.getAgencies = async (req, res) => {
    try {
        const agencies = await agenciesService.getAllAgencies()

        return res.status(200).json(agencies)
    } catch (error) {
        console.error('Get agencies error:', error)
        return res.status(500).json({
            message: 'Failed to fetch agencies',
        })
    }
}
// UPDATE AGENCY
exports.updateAgency = async (req, res, next) => {
  try {
    const agency = await agenciesService.updateAgency(req.params.id, req.body);
    return successResponse(res, 'Agency updated successfully', agency);
  } catch (error) {
    next(error);
  }
};

// ACTIVATE / SUSPEND AGENCY
exports.updateAgencyStatus = async (req, res, next) => {
  try {
    const agency = await agenciesService.updateAgencyStatus(
      req.params.id,
      req.body.status
    );
    return successResponse(res, 'Agency status updated successfully', agency);
  } catch (error) {
    next(error);
  }
};
