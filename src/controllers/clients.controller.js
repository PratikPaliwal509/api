const clientsService = require('../services/clients.service');
const { successResponse } = require('../utils/response');

// CREATE CLIENT
exports.createClient = async (req, res, next) => {
  try {
    const client = await clientsService.createClient(req.body);
    return successResponse(res, 'Client created successfully', client);
  } catch (error) {
    next(error);
  }
};

// LIST CLIENTS
exports.getClients = async (req, res, next) => {
  try {
    const clients = await clientsService.getClients();
    return successResponse(res, 'Clients fetched successfully', clients);
  } catch (error) {
    next(error);
  }
};

// CLIENT DETAILS
exports.getClientById = async (req, res, next) => {
  try {
    const client = await clientsService.getClientById(req.params.id);
    return successResponse(res, 'Client fetched successfully', client);
  } catch (error) {
    next(error);
  }
};

// UPDATE CLIENT
exports.updateClient = async (req, res, next) => {
  try {
    const client = await clientsService.updateClient(
      req.params.id,
      req.body
    );
    return successResponse(res, 'Client updated successfully', client);
  } catch (error) {
    next(error);
  }
};

// CHANGE CLIENT STATUS
exports.updateClientStatus = async (req, res, next) => {
  try {
    const client = await clientsService.updateClientStatus(
      req.params.id,
      req.body.status
    );
    return successResponse(res, 'Client status updated successfully', client);
  } catch (error) {
    next(error);
  }
};
