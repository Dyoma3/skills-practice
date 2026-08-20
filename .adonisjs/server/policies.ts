export const policies = {
  AttemptPolicy: () => import('#policies/attempt_policy'),
  QuestionPolicy: () => import('#policies/question_policy'),
  RubricPolicy: () => import('#policies/rubric_policy'),
  SkillPolicy: () => import('#policies/skill_policy'),
}

