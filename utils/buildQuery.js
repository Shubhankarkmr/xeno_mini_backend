/**
 * Convert campaign rules into a MongoDB query object
 * @param {Array} rules - List of rules with fields: field, operator, value, condition
 * @returns {Object} MongoDB query
 */
const buildQuery = (rules) => {
  if (!rules || rules.length === 0) return {};

  const andConditions = [];
  const orConditions = [];

  rules.forEach((rule) => {
    const { field, operator, value, condition } = rule;

    let mongoOp;
    switch (operator) {
      case ">":
        mongoOp = { $gt: value };
        break;
      case "<":
        mongoOp = { $lt: value };
        break;
      case ">=":
        mongoOp = { $gte: value };
        break;
      case "<=":
        mongoOp = { $lte: value };
        break;
      case "!=":
        mongoOp = { $ne: value };
        break;
      case "=":
      default:
        mongoOp = value;
    }

    const condQuery = { [field]: mongoOp };

    if (condition === "OR") {
      orConditions.push(condQuery);
    } else {
      andConditions.push(condQuery);
    }
  });

  // Build final query
  let finalQuery = {};

  if (andConditions.length && orConditions.length) {
    finalQuery = {
      $and: [...andConditions, { $or: orConditions }],
    };
  } else if (andConditions.length) {
    finalQuery = { $and: andConditions };
  } else if (orConditions.length) {
    finalQuery = { $or: orConditions };
  }

  return finalQuery;
};

module.exports = buildQuery;

