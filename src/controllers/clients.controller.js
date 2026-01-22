const clientsService = require('../services/clients.service');
const { successResponse } = require('../utils/response');

// CREATE CLIENT
exports.createClient = async (req, res, next) => {
  try {
    const clientData = {
      ...req.body,
      created_by: req.user.user_id, // add logged-in user here
    };

    const client = await clientsService.createClient(clientData);
    return successResponse(res, 'Client created successfully', client);
  } catch (error) {
    next(error);
  }
};

// LIST CLIENTS
// controllers/clients.controller.js
exports.getClients = async (req, res, next) => {
  try {
    const user = req.user;

    const clients = await clientsService.getClientsByScope(user);

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

exports.getAllClients = async (req, res) => {
  try {
    const { agency_id } = req.query

    const clients = await clientsService.getAllClients(agency_id)

    res.status(200).json({
      success: true,
      clients,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getAllClients = async (req, res) => {
  try {
    const { agency_id } = req.query

    const clients = await clientsService.getAllClients(agency_id)

    res.status(200).json({
      success: true,
      clients,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

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

exports.deleteClient = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id)
    const userId = req.user?.user_id   // from auth middleware

    if (!clientId) {
      throw new Error('CLIENT_ID_REQUIRED')
    }

    const result = await clientsService.deleteClient(clientId, userId)

    return successResponse(res, 'Client deleted successfully', result)
  } catch (error) {
    next(error)
  }
}

exports.getClientNotes = async (req, res) => {
  try {
    const notes = await clientsService.fetchClientNotesService(req.user)
    res.status(200).json(notes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch client notes" })
  }
}

exports.getClientsWithoutNotes = async (req, res) => {
  try {
    const agency_id = req.user.agency_id // from auth middleware

    const clients = await clientsService.getClientsWithoutNotesService(agency_id)

    return res.status(200).json({
      success: true,
      data: clients,
    })
  } catch (error) {
    console.error("Get clients without notes error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients without notes",
    })
  }
}