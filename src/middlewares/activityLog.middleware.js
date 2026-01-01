const { createActivityLog } = require('../services/activityLog.service');

const logActivity = ({
  action,
  entityType,
  getEntityId,
  getEntityName,
  getDescription,
  getChanges
}) => {
  return async (req, res, next) => {
    const oldJson = res.json;

    res.json = async function (responseBody) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const user = req.user || {};

          // 🔥 IMPORTANT: Use responseBody
          const entity_id = getEntityId
            ? getEntityId(req, res, responseBody)
            : null;

          if (entity_id) {
            await createActivityLog({
              user_id: user.user_id,
              user_email: user.email || 'unknown',
              user_name: user.full_name || 'unknown',
              action,
              entity_type: entityType,
              entity_id,
              entity_name: getEntityName
                ? getEntityName(req, res, responseBody)
                : 'unknown',
              description: getDescription
                ? getDescription(req, res, responseBody)
                : `${action} ${entityType}`,
              changes: getChanges
                ? JSON.stringify(getChanges(req, res, responseBody))
                : null,
              ip_address: req.ip,
              user_agent: req.headers['user-agent']
            });
          }
        }
      } catch (err) {
        console.error('Activity log error:', err);
      }

      return oldJson.call(this, responseBody);
    };

    next();
  };
};

module.exports = logActivity;
