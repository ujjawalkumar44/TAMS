import { useState, useEffect } from 'react';

export default function StudentForm({ form, onChange, errors = {}, sections = [] }) {
  const branches = Array.from(new Set(sections.map((s) => s.branch).filter(Boolean)));
  if (!branches.includes("Computer Science")) {
    branches.unshift("Computer Science");
  }

  const [selectedBranch, setSelectedBranch] = useState("Computer Science");

  useEffect(() => {
    if (form.section_id && sections.length > 0) {
      const currentSec = sections.find((s) => s.id === +form.section_id);
      if (currentSec && currentSec.branch) {
        setSelectedBranch(currentSec.branch);
      }
    }
  }, [form.section_id, sections]);

  const filteredSections = sections.filter((s) => {
    const matchSem = !form.semester || s.semester === +form.semester;
    const matchAY = !form.academic_year || s.academic_year === form.academic_year;
    const matchBranch = !selectedBranch || s.branch === selectedBranch;
    return matchSem && matchAY && matchBranch;
  });

  useEffect(() => {
    if (form.section_id && filteredSections.length > 0) {
      const isAvailable = filteredSections.some((s) => s.id === +form.section_id);
      if (!isAvailable) {
        onChange((prev) => ({ ...prev, section_id: '' }));
      }
    }
  }, [form.semester, form.academic_year, selectedBranch, filteredSections, form.section_id, onChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...form, [name]: value });
  };

  const field = (name, label, type = 'text', options = null, required = true) => (
    <div>
      <label className="label">{label} {required && <span className="text-red-500">*</span>}</label>
      {options ? (
        <select name={name} value={form[name] ?? ''} onChange={handleChange} className={`input-field ${errors[name] ? 'border-red-500' : ''}`}>
          {options.map((opt) => <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name] ?? ''} onChange={handleChange} className={`input-field ${errors[name] ? 'border-red-500' : ''}`} />
      )}
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {field('name', 'Full Name')}
      {field('roll_number', 'Roll Number')}
      {field('registration_number', 'Registration Number')}
      {field('email', 'Email', 'email')}
      {field('phone', 'Phone')}
      {field('gender', 'Gender', 'text', [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }])}
      {field('academic_year', 'Academic Year')}
      {field('semester', 'Semester', 'number', Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` })))}
      <div>
        <label className="label">Branch <span className="text-red-500">*</span></label>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input-field">
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      {field('section_id', 'Section', 'text', [
        { value: '', label: filteredSections.length === 0 ? 'No matching sections' : 'Select section' },
        ...filteredSections.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester}, ${s.academic_year})` }))
      ])}
    </div>
  );
}
