const prisma = require('../config/db');

/**
 * Fetch full user hierarchy
 * Departments -> Manager -> Teams -> Team Lead -> Users
 */
const getUserHierarchy = async () => {
  try {
    const departments = await prisma.department.findMany({
      where: { is_active: true },
      include: {
        manager: true,   // Department manager
        teams: {
          include: {
            team_lead: true, // Team lead
            users: true,   // Team members
          }
        }
      }
    })

    return departments
  } catch (error) {
    console.error('Hierarchy Service Error:', error)
    throw new Error('Failed to fetch user hierarchy')
  }
}

module.exports = { getUserHierarchy }