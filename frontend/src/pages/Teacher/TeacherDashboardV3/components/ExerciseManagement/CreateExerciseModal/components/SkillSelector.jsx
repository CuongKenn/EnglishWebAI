import React from 'react';
import { SKILLS } from '../constants';

/**
 * Skill selector component
 * Radio buttons for selecting skill (listening, speaking, reading, writing)
 */
const SkillSelector = React.memo(({ selectedSkill, onSkillChange, show = true }) => {
  if (!show) return null;

  return (
    <div className="form-section-ex">
      <label className="form-label-ex">Kỹ năng đánh giá</label>
      <div className="skill-selector-ex">
        {SKILLS.map((skill) => (
          <label key={skill.value} className="skill-option-ex">
            <input
              type="radio"
              name="skill"
              value={skill.value}
              checked={selectedSkill === skill.value}
              onChange={(e) => onSkillChange(e.target.value)}
            />
            <span>{skill.emoji} {skill.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

SkillSelector.displayName = 'SkillSelector';

export default SkillSelector;
