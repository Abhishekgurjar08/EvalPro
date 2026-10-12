require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const Examination = require('./src/models/Examination');
const AnswerCopy = require('./src/models/AnswerCopy');
const QuestionPaper = require('./src/models/QuestionPaper');
const Question = require('./src/models/Question');
const User = require('./src/models/User');

const studentNames = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Iyer', 'Vikram Singh',
  'Sneha Reddy', 'Aditya Joshi', 'Kavita Nair', 'Rahul Verma', 'Pooja Bhatia',
  'Siddharth Malhotra', 'Ishita Sen', 'Amitabh Roy', 'Neha Choudhury', 'Karan Mehra',
  'Deepika Pillai', 'Manoj Kumar', 'Sunita Deshmukh', 'Rajesh Rao', 'Divya Menon',
  'Varun Aggarwal', 'Tanvi Kapoor', 'Arjun Saxena', 'Ritu Saxena', 'Kunal Mukherjee',
  'Swati Bose', 'Naveen Mishra', 'Preeti Tiwari', 'Suresh Pandey', 'Meera Nambiar',
  'Harsh Vardhan', 'Ankita Das', 'Gaurav Kulkarni', 'Simran Kaur', 'Akash Tripathi',
  'Ritika Agarwal', 'Manish Pandey', 'Shreya Ghosh', 'Vikas Dubey', 'Megha Jain',
  'Ayush Singhania', 'Bhavna Chauhan', 'Chirag Sethi', 'Dolly Sharma', 'Eshan Trivedi',
  'Farhan Akhtar', 'Gitali Roy', 'Himanshu Rawat', 'Ira Chatterjee', 'Jatin Bajaj',
  'Khushi Goyal', 'Lakshay Mittal', 'Monika Bishnoi', 'Nikhil Sengupta', 'Ojasvi Tyagi'
];

const answersPoolByQ = {
  1: [
    'De Broglie hypothesis proposes matter waves where moving particles exhibit wave-like characteristics with wavelength λ = h/p = h/(mv). This was experimentally verified by Davisson and Germer by scattering electrons off a nickel crystal target, demonstrating diffraction peaks analogous to X-ray diffraction. In quantum mechanics, particle state is described by wave function Ψ(x,t). The probability density P(x) = |Ψ(x,t)|² satisfies the continuity equation. Trade-off considerations involve spatial localization versus momentum uncertainty governed by Heisenberg Uncertainty Principle (Δx · Δp ≥ ℏ/2).',
    'The wave nature of particles originates from Louis de Broglies postulate that symmetry in nature demands matter to possess wave attributes similar to radiation. The phase velocity and group velocity of matter wave packets represent the wave-particle equivalence, where group velocity vg equals classical particle velocity v. Electron microscopy exploits this extremely short de Broglie wavelength to achieve sub-nanometer resolving power far exceeding optical diffraction limits.',
    'Wave-particle duality postulates that microscopic particles like electrons, neutrons, and atoms exhibit both corpuscular and wave-like dynamics. The de Broglie relation connects momentum p to wave vector k via p = ℏk. In quantum mechanical analysis, normalization ∫|Ψ|² dx = 1 preserves total probability. Experimental confirmation through electron biprism and double-slit interference proves wave nature without requiring classical trajectory assumptions.'
  ],
  2: [
    'The Time-Dependent Schrödinger Equation (TDSE) is given by iℏ ∂Ψ/∂t = ĤΨ, where Ĥ = - (ℏ²/2m)∇² + V(r) is the Hamiltonian operator. For stationary states with time-independent potential V(r), separation of variables yields the Time-Independent Schrödinger Equation (TISE): -(ℏ²/2m) d²ψ/dx² + V(x)ψ = Eψ. Boundary conditions require Ψ to be continuous, single-valued, and square-integrable. For an infinite square well of width L, energy eigenvalues are quantized as En = (n²π²ℏ²)/(2mL²), demonstrating energy quantization from spatial confinement.',
    'Schrödingers wave equation serves as the fundamental equation of motion in non-relativistic quantum physics. Applying the energy conservation principle E = p²/2m + V and substituting quantum operators (E → iℏ ∂/∂t, p → -iℏ ∇) yields the governing differential equation. In 1D barrier penetration (quantum tunneling), the wave function exhibits exponential decay within the classically forbidden region V > E: ψ(x) ∝ exp(-κx) where κ = √(2m(V-E))/ℏ, which enables modern devices like Tunnel Diodes and Scanning Tunneling Microscopes.',
    'The structural formulation of the Schrödinger equation models quantum eigenstates and probability flow. Separation of temporal and spatial components Ψ(x,t) = ψ(x)e^(-iEt/ℏ) converts the partial differential equation into an eigenvalue problem Ĥψ = Eψ. For the quantum harmonic oscillator, Hermite polynomial solutions lead to equally spaced energy levels En = (n + 1/2)ℏω with non-zero zero-point energy.'
  ],
  3: [
    'Wave optics models light propagation through the superposition principle of electromagnetic wavefronts. When two coherent light waves y1 = a1 sin(ωt) and y2 = a2 sin(ωt + φ) overlap, the resultant intensity is I = I1 + I2 + 2√(I1 I2) cos φ. Maximum intensity I_max = (a1 + a2)² occurs when phase difference φ = 2nπ (path difference Δ = nλ), producing constructive interference. Minimum intensity I_min = (a1 - a2)² occurs for φ = (2n+1)π (path difference Δ = (2n+1)λ/2), producing complete destructive interference if amplitudes are equal.',
    'Interference of light requires two fundamental coherence criteria: temporal coherence (constant phase relationship over time) and spatial coherence (well-defined wavefronts). Practical deployment includes anti-reflective thin-film coatings (destructive interference of reflected beams at optical interfaces where film thickness d = λ/(4n)) and Fabry-Pérot interferometers utilized as high-finesse optical cavity resonators.',
    'Division of wavefront (Fresnel biprism, Youngs slits) and division of amplitude (thin films, Michelson interferometer) are the primary optical interference architectures. In thin dielectric films, path difference includes Stokes phase change of π upon reflection from an optically denser medium: Δ = 2μt cos(r) ± λ/2, resulting in alternate bright and dark interference fringes depending on film thickness and angle of incidence.'
  ],
  4: [
    'Youngs Double-Slit Experiment demonstrates wave nature through division of wavefront. Monochromatic light of wavelength λ passes through two narrow parallel slits S1 and S2 separated by distance d. The interference pattern forms on a screen at distance D (where D >> d). Path difference between waves arriving at point P at distance y from central axis is Δ = yd/D. Bright fringe condition: yd/D = nλ => yn = nλD/d. Dark fringe condition: yd/D = (2n-1)λ/2 => yn = (2n-1)λD/(2d). Fringe width β = yn+1 - yn = λD/d, which is constant across the interference pattern.',
    'In Youngs experiment, coherent secondary wavelets emerge from slits S1 and S2 based on Huygens principle. The intensity distribution follows I(θ) = 4I0 cos²(π d sin θ / λ), modulated by single-slit diffraction envelope sinc²(π a sin θ / λ). Constraints for sustained interference: slits must be coherent, extremely narrow compared to wavelength, placed closely together, and monochromatic light must be employed to avoid chromatic dispersion overlap.',
    'Youngs Double Slit illustrates quantum complementarity and classical wave interference. At path difference Δ = d sin θ ≈ yd/D, phase difference δ = (2π/λ)Δ. Fringes are hyperbolic in 3D space but appear as straight equidistant parallel bands on a distant planar screen. Fringe spacing β = λD/d provides an accurate method for measuring light wavelength in laboratory optics.'
  ],
  5: [
    'LASER (Light Amplification by Stimulated Emission of Radiation) operates on three key processes: absorption, spontaneous emission, and stimulated emission. Einsteins transition relations govern rate equations: dN2/dt = -A21 N2 - B21 N2 ρ(ν). Population inversion (N2 > N1) is mandatory for amplification over absorption, achieved in three- or four-level systems through active pumping (optical, electrical, or chemical) into a metastable state. The optical resonator cavity provides positive optical feedback selecting axial longitudinal modes.',
    'A laser system comprises three core subsystems: 1. Active gain medium (solid state, gas, or semiconductor); 2. Pumping mechanism to supply excitation energy; 3. Optical resonator cavity consisting of 100% reflective mirror and partially transmissive output coupler. In a He-Ne laser, collision-induced resonant energy transfer between helium and neon atoms creates population inversion between 3s and 2p levels, emitting coherent 632.8 nm radiation.',
    'Stimulated emission produces photons with identical frequency, phase, polarization, and directional k-vector as the incident stimulating photon. Key constraints include maintaining threshold gain condition g_th = α - (1/2L) ln(R1 R2) where mirror losses and scattering absorption are overcome by medium amplification gain.'
  ],
  6: [
    'Optical fibres guide electromagnetic waves based on Total Internal Reflection (TIR) within a high-index core (n1) surrounded by low-index cladding (n2 < n1). Critical angle is θc = sin⁻¹(n2/n1). Acceptance angle θa and Numerical Aperture NA = sin θa = √(n1² - n2²) define light-gathering capability. Step-index multimode fibres experience modal dispersion (intermodal time delay Δt = L/c · n1(n1-n2)/n2), whereas graded-index (GRIN) fibres parabolic profile minimizes dispersion, and single-mode fibres (SMF) eliminate modal dispersion entirely.',
    'Comparing Single Mode Fiber (SMF, V-number < 2.405) and Multimode Fiber (MMF): SMF features core diameter ~8-10 μm, enabling high-bandwidth, long-haul telecommunications (1310 nm / 1550 nm zero dispersion and attenuation windows) with low loss ~0.2 dB/km. MMF features larger core ~50-62.5 μm, accommodating inexpensive LED sources but restricted in distance due to intermodal pulse broadening.',
    'Optical fibre transmission architectures utilize normalized frequency parameter V = (2πa/λ) √(n1² - n2²) to govern supported propagation modes. Material dispersion and waveguide dispersion can be engineered via dispersion-flattened designs to support dense wavelength division multiplexing (DWDM) with high bit-rate reliability.'
  ],
  7: [
    'Crystalline solids feature periodic 3D spatial translation symmetry defined by Bravais lattice vector R = n1 a1 + n2 a2 + n3 a3, combined with a basis of atoms. The 14 Bravais lattices span 7 crystal systems (Cubic, Tetragonal, Orthorhombic, Monoclinic, Triclinic, Hexagonal, Rhombohedral). Comparing cubic systems: Simple Cubic (SC) has coordination number 6, packing fraction 52%; Body-Centered Cubic (BCC) has coordination number 8, packing fraction 68%; Face-Centered Cubic (FCC) has coordination number 12, packing fraction 74% (close-packed).',
    'Crystal structure classification categorizes atomic arrangements into Bravais lattices. In FCC crystals (e.g., Cu, Al, Au), nearest neighbor distance is a/√2, atomic radius r = a√2/4, with atomic packing factor APF = (4 × 4/3 π r³) / a³ ≈ 0.74. In Diamond cubic structures, each atom forms four tetrahedral sp³ covalent bonds with APF of only 0.34, leading to high mechanical hardness and distinct electronic bandgaps.',
    'Unit cells are classified into primitive cells (containing 1 lattice point, e.g., Wigner-Seitz cell) and conventional unit cells illustrating full crystal symmetry. Translation vectors generate the direct lattice, while the corresponding reciprocal lattice b_i = 2π (a_j × a_k) / (a_1 · (a_2 × a_3)) defines Brillouin zones governing electron energy bands and phononic dispersions.'
  ],
  8: [
    'Miller indices (h k l) describe crystal plane orientations: taking intercepts with basis axes (x/a, y/b, z/c), taking reciprocals, and clearing fractions. The interplanar spacing for cubic systems is d_hkl = a / √(h² + k² + l²). X-ray diffraction follows Braggs Law: 2d sin θ = nλ. Edge cases involve systematic absences (structure factor extinction rules): in BCC crystals, reflections occur only when (h + k + l) is even; in FCC crystals, reflections occur only when h, k, l are all unmixed (all even or all odd).',
    'Real crystal lattices deviate from idealized infinite periodicity due to point defects (Schottky vacancies, Frenkel interstitial-vacancy pairs) and line dislocations (edge and screw dislocations). Burgers vector b characterizes dislocation displacement. Structural stability and plastic deformation mechanisms in metallurgy are explained by dislocation glide along close-packed slip planes (such as {111} in FCC).',
    'Crystal lattice analysis involves calculating geometric structure factor S_hkl = Σ fj exp[-2πi(h xj + k yj + l zj)]. When constructive interference condition is evaluated, zero structure factor indicates destructive interference between basis atoms within the unit cell, explaining why reflection peaks like (100) vanish in BCC lattices.'
  ],
  9: [
    'Maxwell resolved the inconsistency in Ampere circuital law ∇ × B = μ0 J by taking divergence: ∇ · (∇ × B) = 0, but ∇ · J = -∂ρ/∂t by continuity equation. This required introducing displacement current density Jd = ε0 ∂E/∂t. Ampere-Maxwell law becomes ∇ × B = μ0 J + μ0 ε0 ∂E/∂t. This critical term explains electromagnetic induction in vacuum and guarantees conservation of electric charge across time-varying capacitor charging circuits.',
    'Electromagnetic boundary conditions handle discontinuities at interfaces between dielectric and conductive media: 1. Normal D: D1n - D2n = σ_free; 2. Normal B: B1n - B2n = 0 (no magnetic monopoles); 3. Tangential E: E1t - E2t = 0; 4. Tangential H: H1t - H2t = K_free. These relations govern wave transmission, reflection coefficients, Brewster angle calculations, and electromagnetic shielding.',
    'In time-harmonic electromagnetic fields, electrodynamics is formulated using scalar and vector potentials (V, A) where B = ∇ × A and E = -∇V - ∂A/∂t. Applying Lorenz gauge condition ∇ · A + μ0 ε0 ∂V/∂t = 0 uncouples Maxwell equations into inhomogeneous wave equations for potentials with retarded Greens function solutions.'
  ],
  10: [
    'Maxwells four differential equations synthesize classical electrodynamics: 1. ∇ · E = ρ/ε0 (Gausss Law for electricity); 2. ∇ · B = 0 (Gausss Law for magnetism); 3. ∇ × E = -∂B/∂t (Faradays Law of Induction); 4. ∇ × B = μ0 J + μ0 ε0 ∂E/∂t (Ampere-Maxwell Law). In vacuum (ρ = 0, J = 0), taking curl of curl equations yields the EM wave equation: ∇²E = μ0 ε0 ∂²E/∂t² and ∇²B = μ0 ε0 ∂²B/∂t², demonstrating transverse EM wave propagation with speed c = 1/√(μ0 ε0) ≈ 3 × 10⁸ m/s, unifying optics with electromagnetism.',
    'Energy transport in electromagnetic waves is quantified by the Poynting vector S = (1/μ0) (E × B), representing instantaneous power flow per unit area in W/m². Time-averaged intensity is ⟨S⟩ = 1/2 c ε0 E0². Electromagnetic radiation exerts radiation pressure Pr = ⟨S⟩/c on absorbing surfaces and 2⟨S⟩/c on perfectly reflecting surfaces, validating momentum conservation in electromagnetic radiation.',
    'Maxwells equations exhibit relativistic invariance under Lorentz transformations, leading directly to Einsteins special theory of relativity. In covariant 4-vector notation, the electromagnetic field strength tensor F^μν = ∂^μ A^ν - ∂^ν A^μ satisfies ∂_μ F^μν = μ0 J^ν and ∂_[λ F_μν] = 0, ensuring seamless physical consistency across all inertial frames.'
  ]
};

const scannedPdfUrls = [
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'
];

async function seedPhysics200Copies() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // 1. Locate the Physics Examination
  let exam = await Examination.findOne({
    $or: [
      { code: 'CS 201' },
      { code: 'CS-201' },
      { subject: { $regex: /^physics$/i } }
    ]
  });

  if (!exam) {
    console.error('❌ Physics examination not found!');
    process.exit(1);
  }

  console.log(`✓ Found Examination: "${exam.name}" (Code: ${exam.code}, ID: ${exam._id})`);

  // 2. Locate the Question Paper for this examination
  const qp = await QuestionPaper.findOne({ examination: exam._id }).populate('questions.question');
  if (!qp || !qp.questions || qp.questions.length === 0) {
    console.error('❌ No Question Paper or questions found for Physics exam!');
    process.exit(1);
  }

  console.log(`✓ Found Question Paper with ${qp.questions.length} questions`);

  // Prepare questions mapping
  const questionsList = qp.questions.map((q, idx) => ({
    questionId: q.question?._id || q.question,
    questionNumber: q.questionNumber || (idx + 1),
    marks: q.marks || q.question?.marks || 7
  }));

  // 3. Clear existing copies for this examination if any to ensure exactly 200 copies
  const del = await AnswerCopy.deleteMany({ examination: exam._id });
  console.log(`✓ Cleared ${del.deletedCount} prior answer copies for Physics.`);

  // 4. Update Examination status to EVALUATION and SCANNING_COMPLETED
  exam.status = 'EVALUATION';
  exam.scanningStatus = 'SCANNING_COMPLETED';
  exam.totalExpectedCopies = 200;
  await exam.save();
  console.log(`✓ Updated Examination status to EVALUATION, SCANNING_COMPLETED, totalExpectedCopies = 200.`);

  // 5. Generate 200 Scanned Copies
  console.log('Generating exactly 200 Scanned Answer Copies for Physics (CS 201)...');
  const copiesToInsert = [];

  for (let i = 1; i <= 200; i++) {
    const padNum = String(i).padStart(3, '0');
    const copyId = `COPY-PHY-${padNum}`;
    const candidateRollNo = `26PHY${padNum}`;
    const bookletNumber = `BK-PHY-${padNum}`;
    const candidateName = studentNames[(i - 1) % studentNames.length] + (i > studentNames.length ? ` (${Math.floor((i - 1) / studentNames.length) + 1})` : '');
    const fileName = `physics_cs201_booklet_${padNum}.pdf`;

    // Map the 10 questions with realistic answers
    const answers = questionsList.map((qItem) => {
      const qNum = qItem.questionNumber;
      const pool = answersPoolByQ[qNum] || answersPoolByQ[((qNum - 1) % 10) + 1];
      const studentAnswer = pool[(i + qNum) % pool.length];

      return {
        question: qItem.questionId,
        questionNumber: qNum,
        maxMarks: qItem.marks,
        studentAnswer: studentAnswer,
        evaluationStatus: 'PENDING',
        aiMarks: null,
        finalMarks: null,
        marksAwarded: null
      };
    });

    copiesToInsert.push({
      copyId,
      candidateRollNo,
      candidateName,
      bookletNumber,
      scannedDocument: {
        fileName,
        fileUrl: scannedPdfUrls[(i - 1) % scannedPdfUrls.length],
        fileType: 'application/pdf',
        fileSize: 2150000 + (i * 1150),
        scannedPages: [
          {
            pageNumber: 1,
            pageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
            ocrText: `B.Tech Semester II Examination (CS 201 Physics) - Booklet No: ${bookletNumber} - Roll No: ${candidateRollNo} - Section A: Quantum Mechanics & Wave Nature`
          },
          {
            pageNumber: 2,
            pageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800',
            ocrText: `Section B: Schrödinger Equation derivations, wave optics interference, and Young's double-slit experiment calculations.`
          },
          {
            pageNumber: 3,
            pageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
            ocrText: `Section C: Lasers, optical fibre numerical aperture derivations, and solid state physics crystal structures.`
          },
          {
            pageNumber: 4,
            pageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
            ocrText: `Section D: Electromagnetism, Maxwell's field equations, and Poynting vector radiation pressure derivations.`
          }
        ]
      },
      status: 'UNASSIGNED',
      scanStatus: 'PROCESSED',
      scannedAt: new Date(Date.now() - (201 - i) * 30000), // staggered scanning timestamps
      examination: exam._id,
      subject: 'Physics',
      answers,
      totalMaxMarks: exam.maxMarks || 70,
      evaluationStatus: 'PENDING',
      evaluationMode: 'MANUAL',
      assignedEvaluator: null,
      assignedAt: null
    });
  }

  // Insert in chunks of 50 for smooth batching
  const chunkSize = 50;
  for (let c = 0; c < copiesToInsert.length; c += chunkSize) {
    const chunk = copiesToInsert.slice(c, c + chunkSize);
    await AnswerCopy.insertMany(chunk);
    console.log(`  -> Inserted copies ${c + 1} to ${Math.min(c + chunkSize, copiesToInsert.length)}...`);
  }

  const totalCopies = await AnswerCopy.countDocuments({ examination: exam._id });

  console.log('\n================================================================');
  console.log('✓ SUCCESS: 200 SCANNED COPIES OF PHYSICS CREATED!');
  console.log('================================================================');
  console.log(`Examination Name:     ${exam.name}`);
  console.log(`Subject:              ${exam.subject}`);
  console.log(`Course Code:          ${exam.code}`);
  console.log(`Total Scanned Copies: ${totalCopies}`);
  console.log(`Exam Status:          ${exam.status}`);
  console.log(`Scanning Status:      ${exam.scanningStatus}`);
  console.log(`Total Expected:       ${exam.totalExpectedCopies}`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedPhysics200Copies().catch((err) => {
  console.error('Fatal error seeding copies:', err);
  process.exit(1);
});
