import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ShieldAlert, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ArchetypeBadge from '../components/ArchetypeBadge';
import { ARCHETYPES } from '../lib/archetypes';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Operations', 'Marketing'];

// Infer the best-fit archetype from the skill sliders (MLBB-meta model).
const calculateInferred = (t, m, d, o) => {
  const max = Math.max(t, m, d, o);
  if (max === t) return d > m ? 'EXP' : 'JUNGLER';
  if (max === m) return o > d ? 'MID' : 'GOLD';
  if (max === d) return 'EXP';
  return 'ROAM';
};

export default function Roster() {
  const { employees, addEmployee, editEmployee, deleteEmployee } = useApp();

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [tech, setTech] = useState(0.5);
  const [mgmt, setMgmt] = useState(0.5);
  const [design, setDesign] = useState(0.5);
  const [ops, setOps] = useState(0.5);
  const [archetype, setArchetype] = useState('JUNGLER');

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Automatically infer archetype based on highest skill vector dimension
  const inferredArchetype = useMemo(() => calculateInferred(tech, mgmt, design, ops), [tech, mgmt, design, ops]);

  const handleTechChange = (val) => {
    setTech(val);
    if (!editingId) setArchetype(calculateInferred(val, mgmt, design, ops));
  };
  const handleMgmtChange = (val) => {
    setMgmt(val);
    if (!editingId) setArchetype(calculateInferred(tech, val, design, ops));
  };
  const handleDesignChange = (val) => {
    setDesign(val);
    if (!editingId) setArchetype(calculateInferred(tech, mgmt, val, ops));
  };
  const handleOpsChange = (val) => {
    setOps(val);
    if (!editingId) setArchetype(calculateInferred(tech, mgmt, design, val));
  };

  // Set form values when starting to edit
  const startEdit = (emp) => {
    setEditingId(emp.id);
    setName(emp.name);
    setJobTitle(emp.job_title);
    if (DEPARTMENTS.includes(emp.department)) {
      setDepartment(emp.department);
      setCustomDept('');
    } else {
      setDepartment('Custom');
      setCustomDept(emp.department);
    }
    setYearsOfExperience(emp.years_of_experience);
    setTech(emp.skill_vector[0]);
    setMgmt(emp.skill_vector[1]);
    setDesign(emp.skill_vector[2]);
    setOps(emp.skill_vector[3]);
    setArchetype(emp.archetype);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setJobTitle('');
    setDepartment(DEPARTMENTS[0]);
    setCustomDept('');
    setYearsOfExperience(3);
    setTech(0.5);
    setMgmt(0.5);
    setDesign(0.5);
    setOps(0.5);
    setArchetype('JUNGLER');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !jobTitle.trim()) return;

    const finalDept = department === 'Custom' ? customDept.trim() : department;
    const skillVector = [
      Math.round(tech * 100) / 100,
      Math.round(mgmt * 100) / 100,
      Math.round(design * 100) / 100,
      Math.round(ops * 100) / 100,
    ];

    const data = {
      name: name.trim(),
      job_title: jobTitle.trim(),
      department: finalDept || 'Unassigned',
      years_of_experience: Number(yearsOfExperience),
      skill_vector: skillVector,
      archetype,
      knowledge_tags: finalDept ? [finalDept.toLowerCase()] : [],
    };

    if (editingId) {
      editEmployee(editingId, data);
      setEditingId(null);
    } else {
      addEmployee(data);
    }

    cancelEdit();
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.job_title.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'All' || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, search, deptFilter]);

  const uniqueDepartments = useMemo(() => ['All', ...new Set(employees.map((e) => e.department))], [employees]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-text-hi">Workforce Roster</h1>
        <p className="text-sm text-text-dim">Manage the organizational personnel database, set skill distributions, and assign roles.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        {/* Roster database list */}
        <Card
          title="Personnel Directory"
          subtitle={`Displaying ${filteredEmployees.length} employees`}
          right={
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="rounded-lg border border-stroke bg-panel2/40 px-3 py-1 text-xs text-text-hi outline-none focus:border-cyan/50"
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-lg border border-stroke bg-panel2/40 px-2 py-1 text-xs text-text-hi outline-none focus:border-cyan/50"
              >
                {uniqueDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          }
        >
          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="panel-2 flex items-center justify-between border-stroke p-3 transition hover:border-cyan/30">
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-hi">{emp.name}</span>
                      <span className="text-[10px] text-text-dim">({emp.id})</span>
                    </div>
                    <div className="text-xs text-text-dim">{emp.job_title} · {emp.department}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-text-dim">{emp.years_of_experience} yrs exp</span>
                      <span className="text-[10px] text-text-dim">·</span>
                      <span className="text-[10px] font-semibold text-text-mid">{emp.utilization}% util</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ArchetypeBadge archetype={emp.archetype} showCorp={false} />
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(emp)}
                      className="rounded-lg border border-stroke bg-panel2/50 p-1.5 text-text-mid transition hover:border-cyan/40 hover:text-cyan"
                      title="Edit employee skills"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${emp.name}?`)) {
                          deleteEmployee(emp.id);
                          if (editingId === emp.id) cancelEdit();
                        }
                      }}
                      className="rounded-lg border border-stroke bg-panel2/50 p-1.5 text-text-mid transition hover:border-bad/40 hover:text-bad"
                      title="Delete employee profile"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="py-10 text-center text-sm text-text-dim">No employees match filters.</p>
            )}
          </div>
        </Card>

        {/* Create / Edit Form */}
        <Card
          title={editingId ? 'Edit Profile' : 'Add New Employee'}
          subtitle={editingId ? `Update variables for ${name}` : 'Create a new team member'}
          right={null}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-xs">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rachel Tan"
                className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
              />
            </div>

            <div>
              <label className="label-xs">Job Title</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior DevOps Specialist"
                className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-xs">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="Custom">Custom...</option>
                </select>
              </div>
              <div>
                <label className="label-xs">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
                />
              </div>
            </div>

            {department === 'Custom' && (
              <div>
                <label className="label-xs">Custom Department Name</label>
                <input
                  type="text"
                  required
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="e.g. HR / Finance"
                  className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
                />
              </div>
            )}

            <div className="space-y-3 border-t border-stroke pt-3">
              <label className="label-xs flex items-center gap-1.5">Skill Vector Dimensions</label>

              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-text-mid">Tech Strength</span>
                    <span className="font-bold text-cyan">{Math.round(tech * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={tech} onChange={(e) => handleTechChange(Number(e.target.value))} className="w-full accent-cyan" />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-text-mid">Management Strength</span>
                    <span className="font-bold text-cyan">{Math.round(mgmt * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={mgmt} onChange={(e) => handleMgmtChange(Number(e.target.value))} className="w-full accent-cyan" />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-text-mid">Design Strength</span>
                    <span className="font-bold text-cyan">{Math.round(design * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={design} onChange={(e) => handleDesignChange(Number(e.target.value))} className="w-full accent-cyan" />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-text-mid">Operations Strength</span>
                    <span className="font-bold text-cyan">{Math.round(ops * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={ops} onChange={(e) => handleOpsChange(Number(e.target.value))} className="w-full accent-cyan" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-stroke pt-3 sm:grid-cols-2 sm:items-end">
              <div>
                <label className="label-xs">Role Archetype</label>
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stroke bg-panel2/60 px-3 py-2 text-sm text-text-hi outline-none focus:border-cyan/50"
                >
                  {ARCHETYPES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm">
                  {editingId ? <Check size={14} /> : <Plus size={14} />}
                  {editingId ? 'Save' : 'Create'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary px-3 py-2 text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {!editingId && inferredArchetype !== archetype && (
              <div className="flex items-start gap-1.5 rounded-lg border border-stroke bg-panel2/30 p-2 text-[10px] text-text-dim">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-warn" />
                <p>
                  You overrode the automatic recommendation: based on the skill sliders, the ideal role is{' '}
                  <span className="font-semibold text-text-hi">{inferredArchetype}</span>.
                </p>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
