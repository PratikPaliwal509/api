// const { verifyToken } = require('../utils/jwt');

// const authMiddleware = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authorization token missing'
//       });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = verifyToken(token);

//     req.user = decoded; // { user_id }
//     next();
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token'
//     });
//   }
// };

// module.exports = authMiddleware;
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Fetch full user
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: {            // ✅ JOIN
          select: {
            role_id: true,
            role_name: true,
            permissions:true
          }
        },
        department: {            // ✅ JOIN
          select: {
            department_id: true,
            department_name: true,
          }
        },
        team: {            // ✅ JOIN
          select: {
            team_id: true,
            team_name: true,
          }
        },
        agency: {            // ✅ JOIN
          select: {
            agency_id: true,
            agency_name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // ✅ FULL USER OBJECT
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
