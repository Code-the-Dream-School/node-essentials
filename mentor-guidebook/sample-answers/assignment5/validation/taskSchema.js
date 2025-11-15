const Joi = require('joi');

const taskSchema = Joi.object({
  title: Joi.string().required(),
  isCompleted: Joi.boolean().default(false)
});

const patchTaskSchema = Joi.object({
  title: Joi.string().optional(),
  isCompleted: Joi.boolean().optional()
});

module.exports = { taskSchema, patchTaskSchema }; 