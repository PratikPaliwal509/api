const hierarchyService = require('../services/hierarchyService')

/**
 * GET /api/hierarchy
 */
const getHierarchy = async (req, res) => {
  try {
    const hierarchy = await hierarchyService.getUserHierarchy()
    res.status(200).json({
      success: true,
      data: hierarchy
    })
  } catch (err) {
    console.error('Hierarchy Controller Error:', err)
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch hierarchy'
    })
  }
}

module.exports = { getHierarchy }