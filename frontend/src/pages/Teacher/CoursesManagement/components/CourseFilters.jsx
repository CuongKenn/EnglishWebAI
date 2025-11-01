import React from 'react';
import { Search, Filter } from 'lucide-react';

/**
 * CourseFilters Component
 * Search and filter controls for courses
 */
const CourseFilters = ({
  searchQuery,
  onSearchChange,
  selectedSkill,
  onSkillChange,
  selectedGrade,
  onGradeChange,
  skills,
  grades,
}) => {
  return (
    <div className="filters-section">
      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm khóa học..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Skill Filter */}
      <div className="filter-group">
        <Filter size={18} />
        <select
          value={selectedSkill}
          onChange={(e) => onSkillChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tất cả kỹ năng</option>
          {skills.map((skill) => (
            <option key={skill.value} value={skill.value}>
              {skill.emoji} {skill.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Filter */}
      <div className="filter-group">
        <select
          value={selectedGrade}
          onChange={(e) => onGradeChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tất cả lớp</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              Lớp {grade}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default React.memo(CourseFilters);
