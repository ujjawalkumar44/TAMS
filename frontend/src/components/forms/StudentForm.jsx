export default function StudentForm({ form, onChange, errors = {}, sections = [] }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...form, [name]: value });
  };

  const field = (name, label, type = 'text', options = null, required = true) => (
    <div>
      <label className="label">{label} {required && <span className="text-red-500">*</span>}</label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange} className={`input-field ${errors[name] ? 'border-red-500' : ''}`}>
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
      {field('roll_number', 'Roll Number')}
      {field('registration_number', 'Registration Number')}
      {field('name', 'Full Name')}
      {field('email', 'Email', 'email')}
      {field('phone', 'Phone')}
      {field('gender', 'Gender', 'text', [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }])}
      {field('section_id', 'Section', 'text', [{ value: '', label: 'Select section' }, ...sections.map((s) => ({ value: s.id, label: s.name }))])}
      {field('semester', 'Semester', 'number', Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Semester ${i + 1}` })))}
      {field('academic_year', 'Academic Year')}
    </div>
  );
}
