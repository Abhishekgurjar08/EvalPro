const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const AnswerCopy = require('../src/models/AnswerCopy');
const answerCopyController = require('../src/controllers/answerCopyController');

async function updateCopy0051() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system');
  
  const copy = await AnswerCopy.findById('6ac75f48c0af598d20fe1cff');
  if (!copy) {
    console.log('Copy not found by ID, searching COPY-0051...');
    const altCopy = await AnswerCopy.findOne({ copyId: 'COPY-0051' });
    if (!altCopy) {
      console.log('COPY-0051 not found');
      process.exit(1);
    }
  }

  const targetCopy = copy || (await AnswerCopy.findOne({ copyId: 'COPY-0051' }));

  const physicsAnswers = [
    `In quantum physics, a particle is represented by a wave packet rather than by a single monochromatic wave. Two important velocities associated with a wave are phase velocity and group velocity. Phase velocity represents the speed at which a particular phase of the wave propagates (vp = omega / k = E / p = v / 2), whereas group velocity represents the speed at which the wave packet or group of waves travels (vg = d(omega) / dk = dE / dp = p / m = v). Hence, group velocity vg is identically equal to the particle velocity v.`,
    
    `Interference of light is the phenomenon of redistribution of luminous energy due to superposition of two coherent light waves.
Two main techniques are:
1. Division of Wavefront: A single wavefront is divided spatially into two coherent sources using slits or prisms (e.g., Young's Double Slit Experiment, Fresnel Biprism). Fringe width beta = lambda * D / d.
2. Division of Amplitude: The amplitude of incident wave is split by partial reflection and refraction at dielectric interfaces (e.g., Thin dielectric films, Newton's Rings). Path difference in thin film: Delta = 2 mu t cos(r) - lambda / 2 (accounting for Stokes' phase change of pi).
Conditions for sustained interference: monochromatic source, constant phase difference (coherence), and equal amplitudes for high fringe contrast.`,
    
    `LASER (Light Amplification by Stimulated Emission of Radiation):
Operating Principle involves three fundamental processes:
1. Stimulated Absorption: Atom absorbs photon of energy h*nu and transitions from lower state E1 to excited state E2.
2. Spontaneous Emission: Excited atom drops randomly after lifetime (~10^-8 s), emitting photon with random phase and direction.
3. Stimulated Emission: An incoming photon of energy h*nu triggers the excited atom to drop, emitting an identical twin photon with identical frequency, phase, polarization, and direction.
4. Population Inversion (N2 > N1): Essential non-equilibrium condition achieved via Optical or Electrical Pumping through a metastable state.
Optical Fibres: Work on Total Internal Reflection (TIR) at Core-Cladding interface (n1 > n2). Acceptance angle theta_0 = sin^-1(sqrt(n1^2 - n2^2)). Numerical Aperture NA = sqrt(n1^2 - n2^2) = n1 * sqrt(2 * Delta).`,
    
    `Maxwell's Electromagnetic Field Equations:
1. Gauss's Law for Electrostatics: div(D) = rho (Electric flux through closed surface equals enclosed charge).
2. Gauss's Law for Magnetism: div(B) = 0 (No magnetic monopoles exist; magnetic flux lines form closed continuous loops).
3. Faraday's Law of Induction: curl(E) = - dB/dt (Time-varying magnetic fields induce circulating electric fields).
4. Ampere-Maxwell Law: curl(H) = J + dD/dt (Magnetic fields are produced by both conduction currents J and displacement currents Jd = dD/dt = epsilon * dE/dt).
Boundary conditions at dielectric interface: tangential E is continuous (E1_t = E2_t) and normal B is continuous (B1_n = B2_n). Poynting vector S = E x H gives the directional power flow per unit area (W/m^2).`,
    
    `Solid State & Semiconductor Physics:
1. Crystal Structures: Simple Cubic (SC, APF = 52%), Body-Centered Cubic (BCC, APF = 68%), and Face-Centered Cubic (FCC, APF = 74%). Miller indices (hkl) denote orientation of crystal planes with interplanar spacing d = a / sqrt(h^2 + k^2 + l^2).
2. Energy Band Theory: Kronig-Penney Model explains periodic lattice potential causing splitting of energy levels into allowed Valence Band, Conduction Band, and forbidden Bandgap (Eg).
3. Semiconductors: Intrinsic (pure Si, n = p = ni) vs Extrinsic (n-type doped with pentavalent donors P/As, p-type doped with trivalent acceptors B/Al).
4. Direct vs Indirect Bandgap: Direct bandgap (e.g. GaAs) enables efficient photon emission (LEDs/lasers), whereas indirect bandgap (e.g. Si) requires phonon participation, releasing thermal energy.`
  ];

  targetCopy.answers.forEach((ans, idx) => {
    ans.studentAnswer = physicsAnswers[idx] || physicsAnswers[0];
  });

  await targetCopy.save();
  console.log('Successfully saved student answers on', targetCopy.copyId);

  const req = { params: { id: targetCopy._id }, body: { force: true } };
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(d) { console.log('Re-evaluation Status:', this.statusCode, 'Success:', d.success); }
  };
  await answerCopyController.evaluateSingleCopyAi(req, res, (err) => console.error(err));

  const final = await AnswerCopy.findById(targetCopy._id).lean();
  console.log('====================================================');
  console.log('COPY ID:', final.copyId);
  console.log('TOTAL MARKS:', final.aiTotal, '/', final.totalMaxMarks);
  final.answers.forEach((a) => {
    console.log(`Q${a.questionNumber} (Marks: ${a.aiMarks}/${a.maxMarks}):`);
    console.log(`  Candidate Text: "${a.studentAnswer.substring(0, 100)}..."`);
  });
  process.exit(0);
}

updateCopy0051().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
