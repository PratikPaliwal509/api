// src/ai/guard/permission.checker.js

/*
Assumption:
You have user roles like:
- admin
- manager
- user
*/

const ROLE_PERMISSIONS = {
  admin: ["CREATE", "READ", "UPDATE", "DELETE"],
  manager: ["CREATE", "READ", "UPDATE"],
  user: ["READ"],
};

exports.checkPermission = ({ userRole = "user", intent }) => {
  const { type, entity } = intent;

  const allowedActions = ROLE_PERMISSIONS[userRole] || [];

  // 1. Check action permission
  if (!allowedActions.includes(type)) {
    throw new Error(
      `Permission denied: ${userRole} cannot perform ${type}`
    );
  }

  // 2. Optional: entity-level restriction
  if (userRole === "user" && entity === "client" && type !== "READ") {
    throw new Error("Users can only view clients");
  }

  // 3. Optional: prevent deleting critical data
  if (type === "DELETE" && entity === "client" && userRole !== "admin") {
    throw new Error("Only admin can delete clients");
  }

  return true;
};