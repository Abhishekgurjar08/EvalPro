const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputDir = path.resolve(__dirname, '../../physics_scanned_copies');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const fontsDir = path.resolve(__dirname, 'fonts');

// 50 realistic Indian student profiles
const students = [
  { rollNo: '2026-CS-PH-001', name: 'Aarav Sharma', bookletNo: 'BK-PH-80001', font: 'Kalam', color: '#1e3a8a', tier: 1 },
  { rollNo: '2026-CS-PH-002', name: 'Aditi Verma', bookletNo: 'BK-PH-80002', font: 'Caveat', color: '#0f2942', tier: 1 },
  { rollNo: '2026-CS-PH-003', name: 'Advait Gupta', bookletNo: 'BK-PH-80003', font: 'PatrickHand', color: '#18181b', tier: 2 },
  { rollNo: '2026-CS-PH-004', name: 'Akash Singh', bookletNo: 'BK-PH-80004', font: 'IndieFlower', color: '#1d4ed8', tier: 2 },
  { rollNo: '2026-CS-PH-005', name: 'Amara Patel', bookletNo: 'BK-PH-80005', font: 'ArchitectsDaughter', color: '#0369a1', tier: 1 },
  { rollNo: '2026-CS-PH-006', name: 'Amit Kumar', bookletNo: 'BK-PH-80006', font: 'Dekko', color: '#1e293b', tier: 3 },
  { rollNo: '2026-CS-PH-007', name: 'Ananya Mishra', bookletNo: 'BK-PH-80007', font: 'Pangolin', color: '#1e3a8a', tier: 2 },
  { rollNo: '2026-CS-PH-008', name: 'Aniket Yadav', bookletNo: 'BK-PH-80008', font: 'GochiHand', color: '#0f2942', tier: 4 },
  { rollNo: '2026-CS-PH-009', name: 'Anushka Joshi', bookletNo: 'BK-PH-80009', font: 'ShadowsIntoLight', color: '#18181b', tier: 2 },
  { rollNo: '2026-CS-PH-010', name: 'Arjun Chauhan', bookletNo: 'BK-PH-80010', font: 'Kalam', color: '#1d4ed8', tier: 1 },
  { rollNo: '2026-CS-PH-011', name: 'Aryan Mehta', bookletNo: 'BK-PH-80011', font: 'PatrickHand', color: '#0369a1', tier: 3 },
  { rollNo: '2026-CS-PH-012', name: 'Ayush Bhatia', bookletNo: 'BK-PH-80012', font: 'Caveat', color: '#1e293b', tier: 2 },
  { rollNo: '2026-CS-PH-013', name: 'Bhavna Saxena', bookletNo: 'BK-PH-80013', font: 'Dekko', color: '#1e3a8a', tier: 1 },
  { rollNo: '2026-CS-PH-014', name: 'Chetan Tiwari', bookletNo: 'BK-PH-80014', font: 'Pangolin', color: '#0f2942', tier: 4 },
  { rollNo: '2026-CS-PH-015', name: 'Devansh Nair', bookletNo: 'BK-PH-80015', font: 'ArchitectsDaughter', color: '#18181b', tier: 2 },
  { rollNo: '2026-CS-PH-016', name: 'Dhruv Iyer', bookletNo: 'BK-PH-80016', font: 'IndieFlower', color: '#1d4ed8', tier: 3 },
  { rollNo: '2026-CS-PH-017', name: 'Diya Reddy', bookletNo: 'BK-PH-80017', font: 'Kalam', color: '#0369a1', tier: 1 },
  { rollNo: '2026-CS-PH-018', name: 'Divyansh Agarwal', bookletNo: 'BK-PH-80018', font: 'Caveat', color: '#1e293b', tier: 2 },
  { rollNo: '2026-CS-PH-019', name: 'Gaurav Malhotra', bookletNo: 'BK-PH-80019', font: 'PatrickHand', color: '#1e3a8a', tier: 3 },
  { rollNo: '2026-CS-PH-020', name: 'Gayatri Kapoor', bookletNo: 'BK-PH-80020', font: 'Pangolin', color: '#0f2942', tier: 1 },
  { rollNo: '2026-CS-PH-021', name: 'Harsh Deshmukh', bookletNo: 'BK-PH-80021', font: 'Dekko', color: '#18181b', tier: 4 },
  { rollNo: '2026-CS-PH-022', name: 'Isha Kulkarni', bookletNo: 'BK-PH-80022', font: 'ArchitectsDaughter', color: '#1d4ed8', tier: 2 },
  { rollNo: '2026-CS-PH-023', name: 'Ishaan Bose', bookletNo: 'BK-PH-80023', font: 'GochiHand', color: '#0369a1', tier: 3 },
  { rollNo: '2026-CS-PH-024', name: 'Jaya Chatterjee', bookletNo: 'BK-PH-80024', font: 'ShadowsIntoLight', color: '#1e293b', tier: 1 },
  { rollNo: '2026-CS-PH-025', name: 'Kabir Banerjee', bookletNo: 'BK-PH-80025', font: 'Kalam', color: '#1e3a8a', tier: 2 },
  { rollNo: '2026-CS-PH-026', name: 'Kavya Mukherjee', bookletNo: 'BK-PH-80026', font: 'Caveat', color: '#0f2942', tier: 1 },
  { rollNo: '2026-CS-PH-027', name: 'Khushi Dutta', bookletNo: 'BK-PH-80027', font: 'PatrickHand', color: '#18181b', tier: 3 },
  { rollNo: '2026-CS-PH-028', name: 'Kiran Sengupta', bookletNo: 'BK-PH-80028', font: 'IndieFlower', color: '#1d4ed8', tier: 2 },
  { rollNo: '2026-CS-PH-029', name: 'Kunal Pillai', bookletNo: 'BK-PH-80029', font: 'Dekko', color: '#0369a1', tier: 4 },
  { rollNo: '2026-CS-PH-030', name: 'Lakshay Menon', bookletNo: 'BK-PH-80030', font: 'Pangolin', color: '#1e293b', tier: 2 },
  { rollNo: '2026-CS-PH-031', name: 'Madhav Rao', bookletNo: 'BK-PH-80031', font: 'ArchitectsDaughter', color: '#1e3a8a', tier: 1 },
  { rollNo: '2026-CS-PH-032', name: 'Manish Naidu', bookletNo: 'BK-PH-80032', font: 'Kalam', color: '#0f2942', tier: 3 },
  { rollNo: '2026-CS-PH-033', name: 'Meera Shetty', bookletNo: 'BK-PH-80033', font: 'Caveat', color: '#18181b', tier: 2 },
  { rollNo: '2026-CS-PH-034', name: 'Mohit Hegde', bookletNo: 'BK-PH-80034', font: 'PatrickHand', color: '#1d4ed8', tier: 4 },
  { rollNo: '2026-CS-PH-035', name: 'Nakul Gowda', bookletNo: 'BK-PH-80035', font: 'GochiHand', color: '#0369a1', tier: 2 },
  { rollNo: '2026-CS-PH-036', name: 'Neha Choudhury', bookletNo: 'BK-PH-80036', font: 'ShadowsIntoLight', color: '#1e293b', tier: 1 },
  { rollNo: '2026-CS-PH-037', name: 'Nikhil Bora', bookletNo: 'BK-PH-80037', font: 'Dekko', color: '#1e3a8a', tier: 3 },
  { rollNo: '2026-CS-PH-038', name: 'Nisha Goswami', bookletNo: 'BK-PH-80038', font: 'Pangolin', color: '#0f2942', tier: 2 },
  { rollNo: '2026-CS-PH-039', name: 'Nitin Barman', bookletNo: 'BK-PH-80039', font: 'ArchitectsDaughter', color: '#18181b', tier: 4 },
  { rollNo: '2026-CS-PH-040', name: 'Om Das', bookletNo: 'BK-PH-80040', font: 'IndieFlower', color: '#1d4ed8', tier: 1 },
  { rollNo: '2026-CS-PH-041', name: 'Palak Chopra', bookletNo: 'BK-PH-80041', font: 'Kalam', color: '#0369a1', tier: 2 },
  { rollNo: '2026-CS-PH-042', name: 'Parth Dhawan', bookletNo: 'BK-PH-80042', font: 'Caveat', color: '#1e293b', tier: 3 },
  { rollNo: '2026-CS-PH-043', name: 'Pooja Bhasin', bookletNo: 'BK-PH-80043', font: 'PatrickHand', color: '#1e3a8a', tier: 1 },
  { rollNo: '2026-CS-PH-044', name: 'Pranav Bakshi', bookletNo: 'BK-PH-80044', font: 'Dekko', color: '#0f2942', tier: 2 },
  { rollNo: '2026-CS-PH-045', name: 'Pranay Sethi', bookletNo: 'BK-PH-80045', font: 'Pangolin', color: '#18181b', tier: 4 },
  { rollNo: '2026-CS-PH-046', name: 'Prateek Garg', bookletNo: 'BK-PH-80046', font: 'ArchitectsDaughter', color: '#1d4ed8', tier: 2 },
  { rollNo: '2026-CS-PH-047', name: 'Priya Bansal', bookletNo: 'BK-PH-80047', font: 'GochiHand', color: '#0369a1', tier: 1 },
  { rollNo: '2026-CS-PH-048', name: 'Priyanshu Singhal', bookletNo: 'BK-PH-80048', font: 'ShadowsIntoLight', color: '#1e293b', tier: 3 },
  { rollNo: '2026-CS-PH-049', name: 'Rahul Goel', bookletNo: 'BK-PH-80049', font: 'Kalam', color: '#1e3a8a', tier: 2 },
  { rollNo: '2026-CS-PH-050', name: 'Rajat Mittal', bookletNo: 'BK-PH-80050', font: 'Caveat', color: '#0f2942', tier: 1 }
];

// Content variations corresponding strictly to the 5 questions in the Physics Exam
const answerBank = {
  q1: {
    // Quantum Physics: Group & particle velocity
    1: [
      `Ans 1. Quantum Physics: Group Velocity & Particle Velocity:
In quantum mechanics, a moving physical particle (mass m, momentum p) is associated with a wave packet rather than a single harmonic wave (de Broglie hypothesis: lambda = h/p).
1. Phase Velocity (vp):
   Speed of propagation of individual phase crests of a monochromatic wave:
   vp = omega / k = E / p = (p^2 / 2m) / p = p / (2m) = v / 2 (non-relativistic).
2. Group Velocity (vg):
   Speed with which the overall modulation envelope (wave packet) moves:
   vg = d(omega) / dk = dE / dp.
   Since E = p^2 / (2m), dE/dp = 2p / (2m) = p / m = v (particle velocity).
   Hence, vg = v_particle.
3. Relativistic Proof:
   E^2 = p^2 c^2 + m0^2 c^4.
   Differentiating: 2E dE = 2p c^2 dp => dE/dp = (p c^2) / E.
   Substituting p = gamma m0 v and E = gamma m0 c^2:
   vg = (gamma m0 v c^2) / (gamma m0 c^2) = v.
   Therefore, group velocity vg is universally equal to classical particle velocity v.`,
      
      `Ans 1. Group Velocity and Particle Velocity in Quantum Mechanics:
According to de Broglie, matter exhibits dual wave-particle properties. A localized particle is represented by superposition of plane waves forming a wave packet:
Psi(x, t) = Integral [ A(k) * exp(i(k*x - omega*t)) dk ].
- Phase velocity: vp = omega / k. For free particle, E = h_bar * omega = p^2 / 2m => omega = h_bar * k^2 / 2m.
  vp = h_bar * k / 2m = p / 2m = v / 2.
- Group velocity: vg = d(omega)/dk = d/dk [ h_bar * k^2 / (2m) ] = h_bar * k / m = p / m = v.
Significance: The probability density |Psi(x,t)|^2 envelope propagates at vg. Individual phase waves travel at vp = c^2/v > c in relativistic frames, but energy and information travel strictly at vg = v <= c.`
    ],
    2: [
      `Ans 1. Group Velocity & Particle Velocity:
- A moving particle is represented by a de Broglie wave packet.
- Phase Velocity (vp): Speed of a single wave = omega / k.
  Since omega = E/h_bar and k = p/h_bar, vp = E/p.
  For non-relativistic particle, E = p^2 / 2m => vp = p / 2m = v/2.
- Group Velocity (vg): Speed of the wave packet envelope:
  vg = d(omega) / dk = dE / dp.
  dE/dp = d(p^2 / 2m)/dp = p/m = v (particle velocity).
- Conclusion: Group velocity equals the particle velocity (vg = v).
The wave packet spreads over time due to dispersion, which is described by Schrodinger's equation.`
    ],
    3: [
      `Ans 1. De Broglie Waves - Group Velocity:
1. Matter waves have wavelength lambda = h / mv.
2. Phase velocity vp is the velocity of individual crests: vp = omega/k = E/p.
3. Group velocity vg is velocity of packet = d(omega)/dk.
4. Relation: For kinetic energy E = p^2/(2m), vg = dE/dp = p/m = v.
Thus group velocity is equal to the particle velocity. This confirms that the particle moves with the center of the wave packet.`
    ],
    4: [
      `Ans 1. Group and Phase Velocity:
- Phase velocity vp = w / k = E / p.
- Group velocity vg = dw / dk = dE / dp.
- For particle of mass m and velocity v:
  p = mv, E = 1/2 m v^2 = p^2 / 2m.
  vg = d(p^2/2m)/dp = 2p/2m = p/m = v.
- So group velocity = particle velocity.`
    ]
  },

  q2: {
    // Wave Optics: Interference
    1: [
      `Ans 2. Wave Optics - Interference of Light:
Interference is the redistribution of luminous energy due to superposition of two coherent wave trains:
I = I1 + I2 + 2*sqrt(I1*I2)*cos(delta).
Conditions for Sustained Interference:
1. Sources must be strictly coherent (constant phase difference).
2. Sources must be monochromatic (single wavelength lambda).
3. Equal or nearly equal amplitudes for maximum fringe contrast.
Division of Wavefront vs Division of Amplitude:
a) Division of Wavefront:
   - Original wavefront is divided into two parts by mirrors, prisms or slits.
   - Examples: Young's Double Slit, Fresnel Biprism, Lloyd's Mirror.
   - Requires a point or narrow slit source. Fringe width beta = lambda * D / d.
b) Division of Amplitude:
   - Incident wave amplitude is split by partial reflection and refraction at interfaces.
   - Examples: Thin dielectric films, Newton's Rings, Michelson Interferometer.
   - Can use broad extended sources, producing high intensity fringes.
   - Path difference in thin film: Delta = 2 * mu * t * cos(r) - lambda / 2 (Stokes' phase shift).
   - Applications: Anti-reflection optical coatings (t = lambda / 4mu) and optical surface testing.`
    ],
    2: [
      `Ans 2. Optical Interference & Alternative Strategies:
1. Basic Principle: Superposition of coherent light beams producing bright and dark fringes.
2. Two Main Methods:
   - Division of Wavefront: Incident wavefront is split spatially using two apertures.
     Example: Young's Double Slit (YDSE). Fringe separation: beta = lambda * D / d.
   - Division of Amplitude: Splitting amplitude via partial reflection and transmission.
     Example: Newton's Rings and Thin Films.
3. Thin Film Interference:
   Optical path difference = 2 * mu * t * cos(r) +/- lambda/2.
   Condition for constructive interference (Bright fringe): 2*mu*t*cos(r) = (2n - 1)*lambda/2.
   Condition for destructive interference (Dark fringe): 2*mu*t*cos(r) = n*lambda.
4. Newton's Rings: Fringes of equal thickness formed between plano-convex lens and glass plate.
   Diameter of nth dark ring: Dn = sqrt(4 * n * R * lambda).`
    ],
    3: [
      `Ans 2. Interference of Light:
Interference occurs when two coherent waves meet.
- Conditions: Coherent sources, monochromatic light, narrow slit sources.
- Division of Wavefront: Splits wavefront using slits (e.g. Young's Double Slit).
- Division of Amplitude: Splits amplitude by partial reflection (e.g. Newton's Rings, Thin films).
- In Thin films, path difference Delta = 2 mu t cos(r) - lambda/2.
- For constructive interference: 2 mu t cos(r) = (2n-1) lambda / 2.
- For destructive interference: 2 mu t cos(r) = n lambda.`
    ],
    4: [
      `Ans 2. Interference in Wave Optics:
- Superposition of light waves gives bright and dark fringes.
- Wavefront division: Young's Double slit experiment. Fringe width beta = lambda*D/d.
- Amplitude division: Thin film interference and Newton's rings.
- Essential condition: Source must be coherent and monochromatic.`
    ]
  },

  q3: {
    // Lasers & Fibre Optics
    1: [
      `Ans 3. Lasers and Fibre Optics:
1. Laser Principles (Light Amplification by Stimulated Emission of Radiation):
   - Stimulated Absorption: Ground atom absorbs h*nu and jumps to E2.
   - Spontaneous Emission: Random downward transition emitting photon: Rate = A21 * N2.
   - Stimulated Emission: Incident photon induces excited atom to emit an identical twin photon (same frequency, phase, direction): Rate = B21 * N2 * rho(nu).
   - Population Inversion (N2 > N1): Non-equilibrium state achieved via optical/electrical pumping in a 3-level or 4-level system with a metastable state (lifetime ~10^-3 s).
   - Optical Resonator: Pair of mirrors (100% and 95% reflection) creating standing waves: L = m * lambda / 2.
2. Fibre Optics Fundamentals:
   - Wave propagation occurs by Total Internal Reflection (TIR) at Core-Cladding interface (n1 > n2).
   - Critical Angle: theta_c = sin^-1(n2 / n1).
   - Acceptance Angle (theta_0): Maximum entry angle:
     sin(theta_0) = sqrt(n1^2 - n2^2) = NA (Numerical Aperture).
   - Fractional Refractive Index Change: Delta = (n1 - n2) / n1.
   - NA = n1 * sqrt(2 * Delta).
   - Types: Step Index (Single mode / Multimode) and Graded Index (GRIN) fibers with parabolic index profile reducing intermodal dispersion.`
    ],
    2: [
      `Ans 3. Lasers & Optical Fiber Technology:
A. Laser Fundamentals:
- Three processes: Absorption, Spontaneous Emission, Stimulated Emission.
- Einstein's relation: B12 = B21 and A21/B21 = 8*pi*h*nu^3 / c^3.
- Population inversion: N2 > N1 achieved using an optical pumping source and metastable state.
- Laser characteristics: High coherence, monochromaticity, directionality, and high brightness.
B. Optical Fibres:
- Structure: Cylindrical dielectric waveguide with Core (n1) and Cladding (n2), n1 > n2.
- Total Internal Reflection guides light along the core.
- Numerical Aperture: NA = sqrt(n1^2 - n2^2) = sin(theta_max).
- Applications: Telecommunication backbones, medical endoscopes, optical sensing.`
    ],
    3: [
      `Ans 3. Lasers & Optical Fibres:
1. Laser Basics:
- Stimulated emission produces coherent photons.
- Population inversion is necessary where excited atoms exceed ground atoms (N2 > N1).
- Main components: Active medium, Pumping source, Optical cavity.
2. Optical Fibres:
- Work on Total Internal Reflection (TIR).
- Core refractive index n1 is higher than Cladding n2.
- Numerical Aperture NA = sqrt(n1^2 - n2^2).
- Acceptance angle theta_a = arcsin(NA).`
    ],
    4: [
      `Ans 3. Lasers and Fibre Optics:
- LASER = Light Amplification by Stimulated Emission of Radiation.
- Population Inversion: N2 > N1 using pumping.
- Optical fibers transmit light using Total Internal Reflection (TIR).
- Core has index n1, cladding has n2 (n1 > n2).
- Numerical aperture NA = sqrt(n1^2 - n2^2).`
    ]
  },

  q4: {
    // Electromagnetism: Maxwell's Equations
    1: [
      `Ans 4. Electromagnetism - Maxwell's Equations & Boundary Conditions:
1. Maxwell's Four Fundamental Equations:
   a) Gauss's Law for Electrostatics:
      Differential: div(D) = rho_v  |  Integral: oiint D . dA = Q_enclosed
      Physical meaning: Electric flux through closed surface equals total enclosed charge.
   b) Gauss's Law for Magnetism:
      Differential: div(B) = 0       |  Integral: oiint B . dA = 0
      Physical meaning: Magnetic monopoles do not exist; magnetic lines form continuous loops.
   c) Faraday's Law of Electromagnetic Induction:
      Differential: curl(E) = - dB/dt  |  Integral: oint E . dl = - d(Phi_B)/dt
      Physical meaning: Time-varying magnetic fields induce circulating electric fields.
   d) Ampere-Maxwell Law:
      Differential: curl(H) = J + dD/dt |  Integral: oint H . dl = I_cond + d(Phi_E)/dt
      Displacement current density: Jd = dD/dt = epsilon * dE/dt, resolving continuity equation div(J) + drho/dt = 0.
2. Boundary Conditions at Dielectric Interfaces:
   - Tangential E-field is continuous: E1_t = E2_t.
   - Normal D-field discontinuity: D1_n - D2_n = rho_s (if rho_s = 0, D1_n = D2_n).
   - Tangential H-field continuity (for non-conducting boundary): H1_t = H2_t.
   - Normal B-field is always continuous: B1_n = B2_n.
3. Poynting Vector: S = E x H (W/m^2), representing instantaneous directional power flow per unit area.`
    ],
    2: [
      `Ans 4. Electromagnetism and Maxwell's Field Equations:
1. Maxwell's Equations in Differential Form:
   - 1. div(D) = rho (Gauss Law for Electric field)
   - 2. div(B) = 0 (Gauss Law for Magnetic field)
   - 3. curl(E) = - dB/dt (Faraday's Induction Law)
   - 4. curl(H) = J + dD/dt (Ampere's Law modified with Displacement Current Jd)
2. Displacement Current: Jd = epsilon0 * dE/dt. Maxwell added this term to maintain conservation of charge across capacitor charging cycles.
3. Boundary Conditions:
   - E1_t = E2_t (Tangential electric field continuous)
   - D1_n - D2_n = rho_s (Normal displacement field)
   - B1_n = B2_n (Normal magnetic flux density continuous)
   - H1_t - H2_t = K (Tangential magnetic field)
4. Poynting Vector S = E x H gives the rate of energy transport by EM wave.`
    ],
    3: [
      `Ans 4. Maxwell's Equations:
Maxwell unified electricity and magnetism into four equations:
1. div D = rho (Electric charges produce electric flux)
2. div B = 0 (No magnetic monopoles)
3. curl E = - dB/dt (Faraday's Law)
4. curl H = J + dD/dt (Ampere-Maxwell Law with displacement current Jd = dD/dt)
Boundary conditions:
- Tangential E field is continuous across interface: E1t = E2t.
- Normal B field is continuous: B1n = B2n.
- Normal D field: D1n - D2n = surface charge density.
- Poynting vector S = E x H represents power density.`
    ],
    4: [
      `Ans 4. Electromagnetism Basics:
- Maxwell's 4 Equations:
  1. div E = rho / epsilon
  2. div B = 0
  3. curl E = - dB/dt
  4. curl B = mu*J + mu*epsilon*dE/dt
- Displacement current Jd = epsilon * dE/dt.
- Tangential E-field is continuous at boundary (E1t = E2t).
- Poynting Vector S = E x H (Energy flow in W/m^2).`
    ]
  },

  q5: {
    // Solid State / Semiconductor Physics
    1: [
      `Ans 5. Solid State & Semiconductor Physics:
1. Crystal Structures and Lattice Geometry:
   - Simple Cubic (SC): Atoms at 8 corners, Coordination No (CN) = 6, Atomic Packing Factor (APF) = 52%.
   - Body Centered Cubic (BCC): Atoms at corners + body center, CN = 8, APF = 68%.
   - Face Centered Cubic (FCC): Atoms at corners + face centers, CN = 12, APF = 74%.
   - Miller Indices (h k l): Reciprocal of planar intercepts cleared of fractions. Interplanar distance: d = a / sqrt(h^2 + k^2 + l^2).
2. Energy Band Theory:
   - Kronig-Penney Model explains periodic lattice potential causing splitting of energy levels into allowed bands and forbidden gaps (Eg).
   - Conductors (Eg = 0 eV), Semiconductors (Eg ~ 1.1 eV for Si), Insulators (Eg > 5 eV).
3. Intrinsic vs Extrinsic Semiconductors:
   - Intrinsic (pure Si): ni = pi = sqrt(Nc * Nv) * exp(-Eg / 2kT). Fermi level Ef lies in middle of bandgap.
   - n-type: Doped with pentavalent donors (P, As); majority carriers electrons; Ef shifts close to conduction band.
   - p-type: Doped with trivalent acceptors (B, Al); majority carriers holes; Ef shifts close to valence band.
4. Direct vs Indirect Bandgap:
   - Direct (e.g. GaAs): Conduction band minimum & valence band maximum align at k = 0 (Delta k = 0); efficient radiative recombination (ideal for LEDs/lasers).
   - Indirect (e.g. Si): Peak and valley are misaligned; requires phonon participation, releasing heat.`
    ],
    2: [
      `Ans 5. Semiconductor Physics & Crystal Structure:
1. Crystal Lattices:
   - SC (APF = 0.52), BCC (APF = 0.68), FCC (APF = 0.74).
   - Miller Indices (hkl): Interplanar spacing d_hkl = a / sqrt(h^2 + k^2 + l^2).
   - Bragg's Law: 2 * d * sin(theta) = n * lambda.
2. Band Theory:
   - Periodic potential creates Valence Band, Conduction Band, and Energy Gap Eg.
3. Carrier Concentration:
   - Total current density: J = q * (n * mu_e + p * mu_h) * E.
   - Fermi-Dirac distribution: f(E) = 1 / [ 1 + exp((E - Ef)/kT) ].
4. Direct vs Indirect Bandgap:
   - Direct bandgap semiconductors (GaAs, InP) emit light efficiently upon electron-hole recombination.
   - Indirect bandgap semiconductors (Si, Ge) involve lattice vibrations (phonons).`
    ],
    3: [
      `Ans 5. Solid State Physics:
1. Crystal Structures:
- SC: 1 atom/cell, packing fraction = 52%.
- BCC: 2 atoms/cell, packing fraction = 68%.
- FCC: 4 atoms/cell, packing fraction = 74%.
- Miller indices (hkl) denote crystal planes.
2. Semiconductors:
- Intrinsic: Pure silicon with equal electrons and holes (n = p).
- Extrinsic: Doped with impurities (n-type with donors, p-type with acceptors).
- Fermi level Ef is the highest filled energy level at 0 Kelvin.
- Direct bandgap emits photons (GaAs), indirect emits phonons/heat (Si).`
    ],
    4: [
      `Ans 5. Semiconductor Physics:
- Crystals: SC (52%), BCC (68%), FCC (74% packing).
- Band theory: Valence band and Conduction band separated by bandgap Eg.
- Intrinsic semiconductor: pure Si, n = p = ni.
- n-type (donor doping, electrons majority), p-type (acceptor doping, holes majority).
- Direct bandgap used for LEDs and optical devices.`
    ]
  }
};

// Helper: Draw ruled paper background on any page
function drawRuledBackground(doc, pageNumber) {
  const width = doc.page.width;
  const height = doc.page.height;

  // Subtle warm paper background
  doc.save();
  doc.rect(0, 0, width, height).fill('#faf9f5');

  // Draw ruled blue lines
  const startY = pageNumber === 1 ? 260 : 70;
  const lineSpacing = 24;

  doc.strokeColor('#dbeafe').lineWidth(0.6);
  for (let y = startY; y < height - 50; y += lineSpacing) {
    doc.moveTo(35, y).lineTo(width - 35, y).stroke();
  }

  // Draw vertical left margin line in soft coral
  doc.strokeColor('#fca5a5').lineWidth(1.2);
  doc.moveTo(85, 45).lineTo(85, height - 40).stroke();

  // Draw outer page border / punch holes simulation
  doc.strokeColor('#cbd5e1').lineWidth(0.5);
  doc.rect(25, 25, width - 50, height - 50).stroke();

  // Punch holes simulation on left
  doc.fillColor('#e2e8f0');
  doc.circle(18, 120, 5).fill();
  doc.circle(18, height / 2, 5).fill();
  doc.circle(18, height - 120, 5).fill();

  // Page number footer
  doc.font('Helvetica').fontSize(8).fillColor('#64748b');
  doc.text(`Page ${pageNumber}`, width / 2 - 20, height - 35);
  doc.text(`Subject Code: CS 201 (Physics)`, 90, height - 35);
  doc.text(`Confidential Exam Sheet`, width - 180, height - 35);

  doc.restore();
}

// Helper: Draw University Answer Booklet Header on Page 1
function drawCoverHeader(doc, student) {
  const width = doc.page.width;

  doc.save();
  // Header Box
  doc.strokeColor('#1e3a8a').lineWidth(1.5);
  doc.rect(35, 35, width - 70, 210).stroke();

  // Header Banner
  doc.fillColor('#1e3a8a');
  doc.rect(36, 36, width - 72, 38).fill();

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff');
  doc.text('STATE TECHNICAL UNIVERSITY', 45, 42, { align: 'center', width: width - 90 });
  doc.fontSize(9).font('Helvetica');
  doc.text('END SEMESTER EXAMINATION 2025-2026 | ANSWER BOOKLET', 45, 59, { align: 'center', width: width - 90 });

  // Candidate Details Table
  doc.strokeColor('#94a3b8').lineWidth(0.8);
  doc.rect(45, 82, 340, 110).stroke();

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e293b');
  doc.text('CANDIDATE ROLL NO:', 52, 90);
  doc.text('CANDIDATE NAME:', 52, 110);
  doc.text('EXAMINATION / COURSE:', 52, 130);
  doc.text('SUBJECT & CODE:', 52, 150);
  doc.text('BOOKLET SERIAL NO:', 52, 170);

  // Handwritten Student Profile Details
  doc.font('Kalam').fontSize(11).fillColor(student.color);
  doc.text(student.rollNo, 175, 87);
  doc.text(student.name, 175, 107);
  doc.text('B.Tech Semester II', 175, 127);
  doc.text('Physics (CS 201)', 175, 147);
  doc.text(student.bookletNo, 175, 167);

  // Barcode simulation box
  doc.strokeColor('#94a3b8').lineWidth(0.8);
  doc.rect(395, 82, 155, 60).stroke();
  doc.font('Helvetica').fontSize(7).fillColor('#475569');
  doc.text('BARCODE SCAN TRACKING', 402, 86);

  // Draw fake vertical barcode bars
  doc.fillColor('#0f172a');
  let bx = 405;
  const barWidths = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 3];
  for (const bw of barWidths) {
    doc.rect(bx, 97, bw, 32).fill();
    bx += bw + 2;
  }
  doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
  doc.text(`*${student.bookletNo}*`, 415, 133);

  // Marks Table Grid
  doc.rect(395, 146, 155, 46).stroke();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b');
  doc.text('Q.No', 400, 150);
  doc.text('Q1', 425, 150);
  doc.text('Q2', 450, 150);
  doc.text('Q3', 475, 150);
  doc.text('Q4', 500, 150);
  doc.text('Q5', 525, 150);
  doc.moveTo(395, 160).lineTo(550, 160).stroke();
  doc.text('Max', 400, 164);
  doc.text('14', 425, 164);
  doc.text('14', 450, 164);
  doc.text('14', 475, 164);
  doc.text('14', 500, 164);
  doc.text('14', 525, 164);
  doc.moveTo(395, 174).lineTo(550, 174).stroke();
  doc.text('Marks', 400, 178);

  // Instruction Banner
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#dc2626');
  doc.text('START WRITING YOUR ANSWERS BELOW. DO NOT WRITE IN THE MARGINS.', 45, 202);
  doc.restore();
}

// Generate single PDF Answer Copy
async function generateStudentCopy(student, index) {
  const padIdx = String(index + 1).padStart(2, '0');
  const fileName = `Physics_Copy_${padIdx}_${student.name.replace(/\s+/g, '_')}.pdf`;
  const filePath = path.join(outputDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      autoFirstPage: true
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Register all downloaded handwriting fonts
    const fontNames = [
      'Caveat', 'Kalam', 'Kalam-Bold', 'PatrickHand', 'IndieFlower',
      'ArchitectsDaughter', 'ShadowsIntoLight', 'GochiHand', 'Dekko', 'Pangolin'
    ];
    for (const fName of fontNames) {
      const fPath = path.join(fontsDir, `${fName}.ttf`);
      if (fs.existsSync(fPath)) {
        doc.registerFont(fName, fPath);
      }
    }

    const primaryFont = fs.existsSync(path.join(fontsDir, `${student.font}.ttf`)) ? student.font : 'Helvetica';
    const boldFont = fs.existsSync(path.join(fontsDir, 'Kalam-Bold.ttf')) ? 'Kalam-Bold' : primaryFont;

    // Pick student answer responses from bank based on Tier
    const tier = student.tier || 2;
    const q1List = answerBank.q1[tier] || answerBank.q1[2];
    const q2List = answerBank.q2[tier] || answerBank.q2[2];
    const q3List = answerBank.q3[tier] || answerBank.q3[2];
    const q4List = answerBank.q4[tier] || answerBank.q4[2];
    const q5List = answerBank.q5[tier] || answerBank.q5[2];

    const ans1 = q1List[index % q1List.length];
    const ans2 = q2List[index % q2List.length];
    const ans3 = q3List[index % q3List.length];
    const ans4 = q4List[index % q4List.length];
    const ans5 = q5List[index % q5List.length];

    // Page 1: Header + Question 1 Answer
    drawRuledBackground(doc, 1);
    drawCoverHeader(doc, student);

    // Q.No margin tag
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626');
    doc.text('Q.1', 52, 272);

    // Q1 Handwritten content
    doc.font(primaryFont).fontSize(10.5).fillColor(student.color);
    doc.text(ans1, 95, 270, { width: 445, lineGap: 6.5 });

    // Page 2: Question 2 Answer (Wave Optics)
    doc.addPage();
    drawRuledBackground(doc, 2);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626');
    doc.text('Q.2', 52, 85);
    doc.font(primaryFont).fontSize(10.5).fillColor(student.color);
    doc.text(ans2, 95, 83, { width: 445, lineGap: 6.5 });

    // Page 3: Question 3 Answer (Lasers & Fiber Optics)
    doc.addPage();
    drawRuledBackground(doc, 3);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626');
    doc.text('Q.3', 52, 85);
    doc.font(primaryFont).fontSize(10.5).fillColor(student.color);
    doc.text(ans3, 95, 83, { width: 445, lineGap: 6.5 });

    // Page 4: Question 4 Answer (Electromagnetism)
    doc.addPage();
    drawRuledBackground(doc, 4);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626');
    doc.text('Q.4', 52, 85);
    doc.font(primaryFont).fontSize(10.5).fillColor(student.color);
    doc.text(ans4, 95, 83, { width: 445, lineGap: 6.5 });

    // Page 5: Question 5 Answer (Solid State / Semiconductors) + End Signature
    doc.addPage();
    drawRuledBackground(doc, 5);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dc2626');
    doc.text('Q.5', 52, 85);
    doc.font(primaryFont).fontSize(10.5).fillColor(student.color);
    doc.text(ans5, 95, 83, { width: 445, lineGap: 6.5 });

    // End of answer booklet signature line
    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b');
    doc.text('--- End of Answer Booklet (All 5 questions attempted) ---', 95, doc.y + 15, { align: 'center', width: 445 });
    doc.font(primaryFont).fontSize(11).fillColor(student.color);
    doc.text(`Candidate Sign: ${student.name.split(' ')[0]}`, 380, doc.y + 12);

    doc.end();

    writeStream.on('finish', () => resolve(fileName));
    writeStream.on('error', reject);
  });
}

async function run() {
  console.log(`Starting generation of 50 Physics scanned answer copies in: ${outputDir}...`);
  const startTime = Date.now();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const file = await generateStudentCopy(student, i);
    console.log(`[${i + 1}/50] Generated: ${file} (Student: ${student.name}, Tier: ${student.tier}, Font: ${student.font})`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n========================================================================`);
  console.log(` SUCCESSFULLY GENERATED 50 PHYSICS HANDWRITTEN EXAM COPIES!`);
  console.log(` Output Folder: ${outputDir}`);
  console.log(` Total Time: ${duration}s`);
  console.log(`========================================================================\n`);
}

run().catch((err) => {
  console.error('Fatal error generating copies:', err);
  process.exit(1);
});
