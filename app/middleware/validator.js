const Joi = require("joi");
const Subscription = require("../models/subscription");
const Plan = require("../models/plan");
const ValidationError = require("../errors/validation-error");

"use strict"  //using JS strict mode

let validators = {
  "Subscription": {
    scopes: {
      default: Subscription.SubscriptionValidationSchema
    }
  },
  "Plan": Plan.PlanValidationSchema
}

function scopeExists(validator, scope) {
  return Object.keys(validator.scope).find(key => key == scope) != undefined;
}

function getSchema(model, scope) {
  let validator = validators[model];
  if(!validator) {
    throw new Error(`No Validator exists for model ${model}`)
  }

  //First check if the given validator has multiple scopes
  if(validator.scopes) {
    //if the caller has passed a value for scope
    if(scope) {
      if(!scopeExists(validator, scope)) {
        throw new Error(`scope ${scope} does not exist in ${model} validator`);
      }
      else {
        return validator.scopes[scope];
      }
    }
    else {
      return validator.scopes.default;
    }
  }
  else {
    return validator;
  }
}

function validate(model, object, scope) {
  return Joi.validate(object, getSchema(model,scope), {
    allowUnknown: true
  });
}

// Actual middleware factory
module.exports = function ValidationMiddleware(model, scope) {
  return(req, res, next) => {
    const validationResult = validate(model, req.body, scope);
    if(validationResult.error) {
      throw new ValidationError(validationResult.error.message, model);
    }
    else {
      next();
    }
  }
}