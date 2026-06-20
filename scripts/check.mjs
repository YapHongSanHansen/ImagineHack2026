// Sanity check for the allocation engine + dataset (run: node scripts/check.mjs)
import { readFileSync } from 'node:fs';
import { runAllocation, parseGoalToVector, teamSizeFor, cosineSimilarity } from '../src/lib/engine.js';

const data = JSON.parse(readFileSync(new URL('../src/data/dataset.json', import.meta.url)));
const employees = data.employees;
const synergyOf = (a, b) =>
  data.synergy_matrix[`${a}_${b}`]?.sentiment_score ?? data.synergy_matrix[`${b}_${a}`]?.sentiment_score ?? 0;

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? (pass++, console.log('  ✓', msg)) : (fail++, console.log('  ✗', msg)));

console.log('DATA');
ok(employees.length === 16, `16 employees (got ${employees.length})`);
ok(employees.every((e) => Array.isArray(e.skill_vector) && e.skill_vector.length === 4), 'every employee has a 4-dim skill_vector');
ok(Object.keys(data.synergy_matrix).length === 26, `26 synergy edges (got ${Object.keys(data.synergy_matrix).length})`);

console.log('\nDYNAMIC SIZING');
ok(teamSizeFor(1) === 2, 'workload 1 -> team 2');
ok(teamSizeFor(6) === 4, 'workload 6 -> team 4');
ok(teamSizeFor(10) === 6, 'workload 10 -> team 6');

console.log('\nGOAL -> VECTOR');
const tech = parseGoalToVector('Launch a mobile payments app on a tight timeline');
console.log('   tech goal vector:', tech.vector, 'norm:', tech.normalized.map((n) => +n.toFixed(2)));
ok(tech.vector[0] >= tech.vector[2], 'tech goal weights Tech >= Design');
const design = parseGoalToVector('Redesign the onboarding UX with user research');
console.log('   design goal vector:', design.vector);
ok(design.vector[2] > 0, 'design goal registers Design dimension');

console.log('\nALLOCATION (tech goal, workload 6)');
const r = runAllocation({ goal: 'Launch a mobile payments app on a tight timeline', workload: 6, employees, synergyOf });
console.log('   team:', r.members.map((m) => `${m.employee.name} [${(m.capability).toFixed(2)} | ${m.task}]`));
ok(r.ids.length === 4, `drafted 4 members (got ${r.ids.length})`);
ok(new Set(r.ids).size === r.ids.length, 'no duplicate members');
ok(r.members[0].employee.skill_vector[0] >= 0.8, 'top pick is a strong Tech fit for a tech goal');
ok(r.avgCapability > 0 && r.avgCapability <= 1, `avg capability in range (${r.avgCapability.toFixed(2)})`);
ok(new Set(r.members.map((m) => m.employee.archetype)).size >= 2, 'team is cross-functional (>=2 archetypes)');
ok(new Set(r.members.map((m) => m.employee.department)).size >= 2, 'team spans >=2 departments');

console.log('\nALLOCATION (design goal, workload 4)');
const d = runAllocation({ goal: 'Redesign the onboarding UX with user research', workload: 4, employees, synergyOf });
console.log('   team:', d.members.map((m) => m.employee.name));
ok(d.ids.includes('e16'), 'design goal drafts Wesley (the UX designer)');

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES: ' + fail} (${pass} checks)`);
process.exit(fail === 0 ? 0 : 1);
