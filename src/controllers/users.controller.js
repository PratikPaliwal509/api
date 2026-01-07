const usersService = require('../services/users.service')

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await usersService.getAllUsers()

    return res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Get all users error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    })
  }
}

exports.getAgencyUsers = async (req, res) => {
     try {
        const { agency_id } = req.query

        console.log('Agency ID:', agency_id)

        if (!agency_id) {
            return res.status(400).json({
                success: false,
                message: 'agency_id is required'
            })
        }

        const users = await usersService.getUsersByAgencyId(agency_id)

        return res.status(200).json({
            success: true,
            data: users
        })
    } catch (error) {
        console.error('❌ Get Users By Agency Error:', error)

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch users'
        })
    }
}

exports.getManagersByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params

    const users = await usersService.getManagersByAgencyId(
      Number(agencyId)
    )

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers',
    })
  }
}

