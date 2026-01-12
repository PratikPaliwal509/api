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

// controllers/users.controller.js
exports.getUsersBySameAgency = async (req, res, next) => {
  try {
    // 1️⃣ Get userId from token
    const userId = req.user.user_id
console.log("userId"+userId)
// 2️⃣ Fetch logged-in user to get agency_id
const loggedInUser = await usersService.getUserById(userId)
console.log("loggedInUser"+loggedInUser)

    if (!loggedInUser || !loggedInUser.agency_id) {
      return res.status(400).json({
        message: 'Agency not found for this user',
      })
    }

    // 3️⃣ Fetch users with SAME agency_id
    const users = await usersService.getUsersByAgencyId(
      loggedInUser.agency_id
    )

    return res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

// users.controller.js
exports.getUsersWithoutTeam = async (req, res, next) => {
  try {
    const userId = req.user.user_id
const loggedInUser = await usersService.getUserById(userId)
console.log("loggedInUser"+loggedInUser)

    if (!loggedInUser || !loggedInUser.agency_id) {
      return res.status(400).json({
        message: 'Agency not found for this user',
      })
    }
    const users = await usersService.getUsersWithoutTeam(loggedInUser.agency_id)

    res.json({
      success: true,
      data: users,
    })
  } catch (err) {
    next(err)
  }
}
