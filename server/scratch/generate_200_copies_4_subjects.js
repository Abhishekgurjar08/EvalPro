const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const Examination = require('../src/models/Examination');
const Question = require('../src/models/Question');
const QuestionPaper = require('../src/models/QuestionPaper');
const AnswerCopy = require('../src/models/AnswerCopy');

// Pool of 100 first names and 50 last names for generating 200 unique student names
const firstNames = [
  'Aarav', 'Aditi', 'Advait', 'Akash', 'Amara', 'Amit', 'Ananya', 'Aniket', 'Anushka', 'Arjun',
  'Aryan', 'Ayush', 'Bhavna', 'Chetan', 'Devansh', 'Dhruv', 'Diya', 'Divyansh', 'Gaurav', 'Gayatri',
  'Harsh', 'Isha', 'Ishaan', 'Jaya', 'Kabir', 'Kavya', 'Khushi', 'Kiran', 'Kunal', 'Lakshay',
  'Madhav', 'Manish', 'Meera', 'Mohit', 'Nakul', 'Neha', 'Nikhil', 'Nisha', 'Nitin', 'Om',
  'Palak', 'Parth', 'Pooja', 'Pranav', 'Pranay', 'Prateek', 'Priya', 'Priyanshu', 'Rahul', 'Rajat',
  'Rajesh', 'Ramesh', 'Rhea', 'Riddhima', 'Rishabh', 'Rohan', 'Rohit', 'Sakshi', 'Sameer', 'Sanjay',
  'Sanjana', 'Sarthak', 'Saurabh', 'Shashank', 'Shikha', 'Shivam', 'Shreya', 'Shruti', 'Siddharth', 'Simran',
  'Sneha', 'Sourabh', 'Suhani', 'Sumit', 'Sunil', 'Suraj', 'Suresh', 'Swati', 'Tanmay', 'Tanvi',
  'Tanya', 'Tarun', 'Tejas', 'Uday', 'Utkarsh', 'Vaibhav', 'Varun', 'Vedant', 'Vidya', 'Vikas',
  'Vikram', 'Vinay', 'Vishal', 'Vivek', 'Yash', 'Yashika', 'Yogesh', 'Zoya', 'Alok', 'Deepak'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Mishra', 'Yadav', 'Joshi', 'Chauhan',
  'Mehta', 'Bhatia', 'Saxena', 'Tiwari', 'Nair', 'Iyer', 'Reddy', 'Agarwal', 'Malhotra', 'Kapoor',
  'Deshmukh', 'Kulkarni', 'Bose', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Dutta', 'Sengupta', 'Pillai', 'Menon',
  'Rao', 'Naidu', 'Shetty', 'Hegde', 'Gowda', 'Choudhury', 'Bora', 'Goswami', 'Barman', 'Das',
  'Chopra', 'Dhawan', 'Bhasin', 'Bakshi', 'Sethi', 'Garg', 'Bansal', 'Singhal', 'Goel', 'Mittal'
];

// Rich domain-specific student answer variations for all 4 subjects
const physicsAnswers = {
  q1: [
    `1. Phase Velocity vs Group Velocity in Quantum Mechanics:
A monochromatic de Broglie wave is described by Ψ(x,t) = A exp[i(kx - ωt)], where ω = E/ħ and k = p/ħ.
Phase Velocity (vp): The velocity with which the phase of a single sinusoidal wave propagates:
   vp = ω / k = E / p = (p² / 2m) / p = p / 2m = v / 2 (for non-relativistic free particle).
Group Velocity (vg): A localized physical particle is represented by a wave packet composed of a superposition of plane waves with varying frequencies and wave numbers:
   vg = dω / dk = dE / dp = d(p²/2m) / dp = 2p / 2m = p / m = v (particle velocity).
Thus, the group velocity of the de Broglie wave packet is identically equal to the classical particle velocity (vg = v_particle).
2. Relativistic Case:
   E² = p²c² + m0²c⁴ => 2E dE = 2pc² dp => dE/dp = pc² / E = (γ m0 v c²) / (γ m0 c²) = v.
   Therefore, vg = v holds universally in both classical and relativistic quantum mechanics.
3. Physical Significance: The envelope of the wave packet moves at vg, representing the probability density distribution |Ψ(x,t)|² of finding the particle in space, resolving the paradox of individual wavelets traveling at vp = c²/v.`,

    `In Quantum Mechanics, matter possesses dual wave-particle nature (de Broglie hypothesis: λ = h/p).
- A single harmonic wave cannot represent a localized particle because it extends infinitely in space (uncertainty Δx = ∞).
- Superposition of multiple waves forming a Wave Packet yields finite localization:
  Ψ(x,t) = ∫ A(k) exp[i(k x - ω(k) t)] dk.
Mathematical Derivation:
- Phase Velocity: vp = ω/k. For non-relativistic matter waves, E = ħω = ħ²k²/(2m), so ω = ħk²/(2m).
  Hence vp = ħk/(2m) = p/(2m) = v/2.
- Group Velocity: vg = dω/dk = d(ħk²/2m)/dk = ħk/m = p/m = v.
The group velocity corresponds to the velocity of the center of the wave packet envelope, exactly matching the velocity of the classical particle. Dispersion causes the packet to spread over time according to the Schrödinger wave equation.`,

    `Concept of Group and Particle Velocity:
- De Broglie proposed that moving particles are accompanied by pilot matter waves.
- Phase velocity vp = ω/k represents the phase speed of individual component waves. In relativistic terms, vp = E/p = mc²/(mv) = c²/v > c, which does not violate causality since individual phase peaks carry no energy or information.
- Group velocity vg = dω/dk = dE/dp represents the velocity of the modulation envelope where constructive interference occurs.
- Derivation: For relativistic particle E = √(p²c² + m₀²c⁴). Differentiating with respect to p:
  dE/dp = (2pc²) / (2√(p²c² + m₀²c⁴)) = pc²/E = (γm₀v c²)/(γm₀c²) = v.
- Hence, group velocity vg is equal to the particle velocity v. Information and energy propagate strictly at vg.`
  ],

  q2: [
    `1. Principles of Optical Interference:
Interference is the redistribution of light energy resulting from the superposition of two or more coherent light waves.
Conditions for Sustained Interference:
- Sources must be strictly coherent (constant phase difference Δφ).
- Sources must be monochromatic (identical wavelength λ).
- Waves must travel in approximately the same direction with equal or comparable amplitudes.
2. Division of Wavefront vs. Division of Amplitude:
a) Division of Wavefront:
   - The incident wavefront is geometrically divided into two or more parts using apertures, mirrors, or prisms.
   - Examples: Young's Double Slit Experiment (YDSE), Fresnel's Biprism, Lloyd's Mirror.
   - Source requirement: Point source or narrow slit source.
   - Fringe shape: Hyperbolic / straight parallel fringes. Path difference Δ = x d / D. Fringe width β = λ D / d.
b) Division of Amplitude:
   - The amplitude of the incident wave is split into reflected and transmitted components at the interface of different media.
   - Examples: Thin Film interference, Newton's Rings, Michelson Interferometer.
   - Source requirement: Broad, extended source can be used, giving high illumination and clear fringes.
   - Condition for constructive interference in thin film: 2 μ t cos(r) = (2n - 1) λ / 2 (accounting for Stokes' phase change of π on reflection at denser medium).
3. Modularity and Applications in Engineering:
- Anti-reflection coatings on camera lenses and solar panels (destructive interference in reflected light: t = λ / 4μ).
- Optical testing of surface flatness using Newton's rings with nanometer precision.`,

    `Comparison of Wave Optics Interference Strategies:
1. Division of Wavefront:
- Principle: Splits spatial wavefront using geometry (slits/prisms).
- Implementations: Young's Double Slit, Fresnel Biprism.
- Fringes: Non-localized, straight fringes with fringe width β = λD/d.
- Scalability & Limitations: Requires a spatial point source; optical intensity drops with distance.
2. Division of Amplitude:
- Principle: Splits the electromagnetic wave amplitude via partial reflection and transmission.
- Implementations: Thin dielectric films, Newton's Rings apparatus, Michelson Interferometer.
- Fringes: Localized fringes (fringes of equal thickness or equal inclination).
- Path Difference for thin film of thickness t and refractive index μ:
  Δ = 2μt cos(r) ± λ/2 (due to Stokes' phase reversal upon reflection at denser interface).
- Advantages: Works with broad extended sources, yielding superior fringe visibility and higher signal-to-noise ratio in metrology systems.`,

    `Interference in Wave Optics:
Interference phenomena occur when two electromagnetic wavefields superimpose: I = I₁ + I₂ + 2√(I₁I₂) cos(δ).
- Wavefront Division: Divides wavefront spatially. Path difference depends on slit separation d and screen distance D. Used in laboratory calibration of optical wavelengths.
- Amplitude Division: Divides light amplitude into two paths at partially reflective boundaries.
- Newton's Rings: Fringes of equal thickness formed between a plano-convex lens and glass plate. The diameter of the nth dark ring is Dn = √(4n R λ).
- Thin Films: Colors in soap bubbles and oil films arise due to path difference Δ = 2μt cos(r) - λ/2.
- Applications: Precision thickness measurement, optical interferometry, and anti-reflective optical coatings.`
  ],

  q3: [
    `1. Laser Fundamentals & Operating Principles:
LASER stands for Light Amplification by Stimulated Emission of Radiation.
Key Processes:
a) Absorption: Ground state atom absorbs photon hν and transitions to excited state (E₂ - E₁ = hν).
b) Spontaneous Emission: Excited atom drops randomly after lifetime (~10⁻⁸ s), emitting photon with random phase and direction. Rate = A₂₁ N₂.
c) Stimulated Emission: An incoming photon of energy hν triggers the excited atom to drop, emitting an identical second photon with identical frequency, phase, polarization, and direction. Rate = B₂₁ N₂ ρ(ν).
d) Population Inversion (N₂ > N₁): Essential non-equilibrium condition achieved via Optical/Electrical Pumping through a metastable state with longer lifetime (~10⁻³ s).
2. Laser Cavity Resonator:
- Consists of an active medium between two mirrors: one 100% reflective, one partially reflective (95-99%) for output beam extraction.
- Sustains standing electromagnetic waves satisfying 2L = m λ, amplifying the stimulated emission.
3. Optical Fibres & Wave Propagation:
- Principle: Total Internal Reflection (TIR) at core-cladding boundary (n_core > n_cladding).
- Acceptance Angle (θ₀): Maximum angle of launch: sin(θ₀) = √(n₁² - n₂²).
- Numerical Aperture (NA): Light gathering capability: NA = √(n₁² - n₂²) = n₁ √(2Δ).
- Types: Step-Index (Single-mode and Multi-mode) and Graded-Index (GRIN) fibers minimizing intermodal dispersion.
4. Domain Applications: High-speed optical telecommunications, endoscopic biomedical imaging, laser cutting, and LiDAR remote sensing.`,

    `Lasers and Fiber Optics in Modern Engineering:
1. Laser Principles:
- Einstein's Coefficients: B₁₂ = B₂₁ (stimulated emission equals absorption probability), and A₂₁/B₂₁ = 8πhν³/c³.
- 3-Level and 4-Level Laser Systems: 4-level systems (e.g., Nd:YAG, He-Ne) achieve population inversion much more easily because the terminal lower laser level is rapidly depopulated thermally.
- Properties of Laser Light: High monochromaticity (narrow Δλ), high spatial and temporal coherence, extreme directionality (low divergence), and high brightness/intensity.
2. Fiber Optic Architecture:
- Core (refractive index n₁) surrounded by Cladding (refractive index n₂), where n₁ > n₂.
- Critical Angle: θc = sin⁻¹(n₂/n₁).
- Fractional index change Δ = (n₁ - n₂)/n₁.
- Numerical Aperture: NA = sin(θa) = √(n₁² - n₂²).
- Attenuation factors: Rayleigh scattering, absorption bands, and waveguide bending losses. Used extensively for high-bandwidth backbone networking.`,

    `Overview of Lasers and Optical Fibers:
- Population Inversion is achieved when the number of atoms in the higher energy state exceeds the lower state (N₂ > N₁). Pumping mechanisms: optical pumping (Ruby), electrical discharge (He-Ne), and semiconductor diode injection.
- Optical Resonator provides positive optical feedback, selectively amplifying axial modes that satisfy constructive phase round-trip condition.
- Optical Fibers transmit optical pulses via total internal reflection.
  - Acceptance cone angle: θ_max = arcsin(√(n₁² - n₂²)).
  - V-number (normalized frequency) determines single-mode vs multimode cutoff: V = (2π a / λ) NA. For V < 2.405, only fundamental mode HE₁₁ propagates.
- Applications include fiber-optic transceivers, laser spectroscopy, and industrial laser processing.`
  ],

  q4: [
    `1. Maxwell's Electromagnetic Field Equations:
Maxwell unified electricity and magnetism into four fundamental partial differential equations:
1. Gauss's Law for Electrostatics: ∇ · D = ρ_v (or ∇ · E = ρ / ε₀). Total electric flux through closed surface equals enclosed charge.
2. Gauss's Law for Magnetism: ∇ · B = 0. No isolated magnetic monopoles exist; magnetic flux lines form closed continuous loops.
3. Faraday's Law of Induction: ∇ × E = - ∂B/∂t. Time-varying magnetic fields induce circulating electric fields.
4. Ampere-Maxwell Law: ∇ × H = J + ∂D/∂t. Magnetic fields are produced by both conduction currents (J) and displacement currents (J_d = ∂D/∂t = ε ∂E/∂t).
2. Boundary Conditions at Dielectric Interfaces:
- Tangential E-field is continuous: E₁_t = E₂_t (derived from ∮ E · dl = 0 across loop of infinitesimal height).
- Normal D-field is discontinuous by surface charge density: D₁_n - D₂_n = ρ_s (for charge-free boundary, D₁_n = D₂_n => ε₁ E₁_n = ε₂ E₂_n).
- Tangential H-field discontinuity: H₁_t - H₂_t = K × n̂ (for current-free interface, H₁_t = H₂_t).
- Normal B-field continuity: B₁_n = B₂_n.
3. Electromagnetic Energy & Poynting Vector:
- Poynting Vector: S = E × H (W/m²), representing the instantaneous directional power flow per unit area.
- Time-averaged Poynting vector: <S> = (1/2) Re{E × H*}.
- Wave Impedance in free space: η₀ = √(μ₀/ε₀) ≈ 377 Ω.`,

    `Electromagnetism and Maxwell's Equations:
- The missing link in Ampere's circuital law was resolved by Maxwell by introducing the Displacement Current Density: Jd = ε₀ (∂E/∂t). This ensures continuity of current: ∇ · (∇ × H) = ∇ · J + ∂(∇ · D)/∂t = ∇ · J + ∂ρ/∂t = 0.
- Wave Equation in Homogeneous Dielectric Media:
  ∇²E - μ ε (∂²E/∂t²) = 0 and ∇²B - μ ε (∂²B/∂t²) = 0.
- Propagation speed: v = 1/√(με) = c/√(μ_r ε_r).
- Boundary Conditions ensure field continuity:
  1. E_tangential continuous across interface.
  2. D_normal continuous if no free surface charge (ρs = 0).
  3. B_normal always continuous (no magnetic charge).
  4. H_tangential continuous for non-conducting boundary.
- Skin depth (δ) in conductors: δ = √(2 / (ω μ σ)), quantifying exponential attenuation of high-frequency fields.`,

    `Fundamental Electromagnetism and Field Theory:
- Maxwell's four equations describe all classical electrodynamic phenomena.
- Differential and Integral Forms:
  - ∮ E · dA = Q_enc / ε₀
  - ∮ B · dA = 0
  - ∮ E · dl = - dΦ_B / dt
  - ∮ B · dl = μ₀ I_enc + μ₀ ε₀ (dΦ_E / dt)
- Energy Conservation (Poynting's Theorem):
  - ∇ · (E × H) = - ∂/∂t [ (1/2) ε E² + (1/2) μ H² ] - J · E.
  The divergence of the Poynting vector equals the rate of decrease of stored EM energy density minus Joule heating losses (J · E).
- These equations govern antenna design, RF propagation, and optical waveguide systems.`
  ],

  q5: [
    `1. Crystal Structures and Solid State Physics:
- Crystal Lattice: An infinite periodic array of points in 3D space with translational symmetry: R = n₁ a + n₂ b + n₃ c.
- Unit Cell: Smallest repeating volume that possesses the full symmetry of the crystal.
- Seven Crystal Systems and 14 Bravais Lattices:
  - Simple Cubic (SC): Coordination Number = 6, Atomic Packing Factor (APF) = π/6 ≈ 0.52.
  - Body-Centered Cubic (BCC): CN = 8, APF = (√3 π)/8 ≈ 0.68.
  - Face-Centered Cubic (FCC): CN = 12, APF = (√2 π)/6 ≈ 0.74 (closed packed).
- Miller Indices (h k l): Reciprocal intercepts of lattice planes: h = a/x, k = b/y, l = c/z, cleared of fractions. Interplanar spacing: d_hkl = a / √(h² + k² + l²).
2. Energy Band Theory:
- Kronig-Penney Model: Periodic potential of crystal lattice splits discrete atomic energy levels into allowed energy bands separated by forbidden energy gaps (Bandgap Eg).
3. Semiconductor Classification:
- Intrinsic Semiconductor: Pure Si or Ge. Carrier concentration n = p = ni = √(Nc Nv) exp(-Eg / 2kT). Fermi level Ef lies at the center of bandgap.
- Extrinsic Semiconductors:
  - n-type (Doped with pentavalent P/As): Donor levels Ed lie just below conduction band; majority carriers are electrons.
  - p-type (Doped with trivalent B/Ga): Acceptor levels Ea lie just above valence band; majority carriers are holes.
- Direct vs Indirect Bandgap: In direct bandgap (e.g. GaAs), conduction band minimum and valence band maximum align in k-space (Δk = 0), enabling efficient photon emission (LEDs/lasers); in indirect bandgap (Si), phonon interaction is required.`,

    `Crystal Structures and Semiconductor Physics:
1. Lattice Systems:
- SC, BCC, FCC, and Diamond cubic structures.
- Interatomic distance for FCC: 2r = a / √2.
- Packing efficiency: SC (52%), BCC (68%), FCC (74%), Diamond (34%).
- Bragg's Law of X-ray Diffraction: 2d sin(θ) = n λ.
2. Band Theory & Fermi-Dirac Statistics:
- Probability of occupancy: f(E) = 1 / [ 1 + exp((E - Ef)/kT) ].
- At T = 0 K, all states below Ef are filled (f(E)=1) and all states above Ef are empty (f(E)=0).
- Electrical Conductivity: σ = q (n μ_n + p μ_p).
- Hall Effect: When magnetic field B is applied perpendicular to current flow, transverse Hall voltage VH is developed:
  Hall Coefficient: R_H = 1 / (n q) (for n-type) and 1 / (p q) (for p-type), allowing determination of carrier type and carrier density.`,

    `Solid State Semiconductor Physics:
- Crystal Geometry: Lattice points with a basis form the crystal structure. Miller indices (hkl) denote plane orientations.
- Kronig-Penney potential introduces Bloch waves: Ψ(x) = u(x) exp(ikx), resulting in Brillouin zones and energy gaps at zone boundaries (k = ±nπ/a).
- Semiconductors:
  - Energy gap Eg: Conductors (Eg ≈ 0 eV), Semiconductors (Eg ≈ 1.1 eV for Si, 1.42 eV for GaAs), Insulators (Eg > 5 eV).
  - Temperature dependence: Conductivity increases exponentially with temperature in semiconductors: σ ∝ exp(-Eg / 2kT).
  - Drift and Diffusion currents: J_total = q(n μ_n E + Dn dn/dx) + q(p μ_p E - Dp dp/dx).
  - Einstein's relation: Dn / μ_n = Dp / μ_p = kT / q.`
  ]
};

const mechanicalAnswers = {
  q1: [
    `1. Scope of Mechanical Engineering:
Mechanical Engineering encompasses the design, analysis, manufacturing, and maintenance of mechanical systems, thermal power cycles, robotics, aerospace structures, and automotive vehicles.
2. Engineering Materials Classification:
- Ferrous Metals: Steel (Mild steel, Medium carbon, High carbon, Stainless steel), Cast Iron (Grey, White, Ductile/Nodular). Characterized by high tensile strength and magnetic properties.
- Non-Ferrous Metals: Aluminium (lightweight, corrosion resistant), Copper (high thermal and electrical conductivity), Titanium, Brass, Bronze.
- Polymers: Thermoplastics (polyethylene, PVC - recyclable, ductile) and Thermosets (epoxy, bakelite - cross-linked, rigid, heat resistant).
- Ceramics: Alumina, Silicon Carbide, Zirconia (high hardness, refractory, brittle, chemical inertness).
- Composites: Fiber-reinforced polymers (CFRP, GFRP), Metal Matrix Composites (high strength-to-weight ratio).
3. Stress-Strain Curve for Ductile Materials (Mild Steel):
- Region OA (Proportional Limit): Stress is strictly proportional to strain (Hooke's Law: σ = E ε).
- Point B (Elastic Limit): Material returns to original dimensions upon unloading without permanent plastic deformation.
- Point C & D (Upper and Lower Yield Points): Significant plastic deformation occurs without increase in applied load.
- Point E (Ultimate Tensile Strength - UTS): Maximum nominal stress the material can sustain before localized necking begins.
- Point F (Fracture / Breaking Point): Complete rupture of the specimen.
4. Key Mechanical Properties: Tensile Strength, Yield Strength, Ductility (% elongation, % reduction in area), Hardness (Brinell/Rockwell resistance to indentation), Toughness (energy absorption before fracture), Creep (time-dependent deformation under constant elevated temperature), Fatigue (failure under cyclic fluctuating loads).`,

    `Overview of Engineering Materials and Mechanics:
1. Material Selection Framework:
- Mechanical properties: Modulus of Elasticity (E), Shear Modulus (G), Poisson's Ratio (ν), yield stress (σy), ultimate stress (σu).
- Physical properties: Density, thermal expansion coefficient, melting point.
- Manufacturing suitability: Machinability, weldability, castability, formability.
2. Stress-Strain Characteristics:
- Engineering Stress: σ = F / A₀ (initial cross-sectional area).
- True Stress: σ_true = F / A_instantaneous = σ (1 + ε).
- Ductile materials (e.g., mild steel, aluminum) exhibit distinct yielding, necking, and high percentage elongation (>15%).
- Brittle materials (e.g., cast iron, glass, ceramics) exhibit minimal plastic strain and fracture abruptly along cleavage planes perpendicular to maximum tensile stress.
3. Hooke's Law & Elastic Moduli:
- 1D: σ = E ε.
- 3D Generalized Hooke's Law relating strain tensor to stress tensor using Young's modulus E and Poisson's ratio ν.`,

    `Engineering Materials & Mechanical Fundamentals:
- Classification: Metals (Ferrous/Non-ferrous), Polymers, Ceramics, and Advanced Composites.
- The Universal Testing Machine (UTM) generates the standard Tensile Stress-Strain curve:
  1. Linear Elastic zone where Hooke's Law holds (E = stress/strain).
  2. Yield zone where dislocations glide along slip planes.
  3. Strain hardening zone where dislocation entanglement increases resistance.
  4. Necking zone where cross-sectional area reduces rapidly until cup-and-cone ductile fracture occurs.
- Fatigue and S-N Curve: Wohler's curve identifies the Endurance Limit (stress amplitude below which material survives infinite cycles, ~10⁶-10⁷ cycles for steels).`
  ]
};

// Add q2..q5 for mechanical
mechanicalAnswers.q2 = [
  `1. Laws of Thermodynamics:
- Zeroth Law: If bodies A and B are each in thermal equilibrium with a third body C, then A and B are in thermal equilibrium with each other. Forms the basis of temperature measurement (thermometers).
- First Law (Conservation of Energy): For a closed system undergoing a cycle: ∮ dQ = ∮ dW. For a process: dQ = dU + dW (where dU is the change in internal energy, a point function).
  - Steady Flow Energy Equation (SFEE) for open systems:
    h₁ + v₁²/2 + g z₁ + q = h₂ + v₂²/2 + g z₂ + w.
- Second Law: Governs the direction of natural spontaneous processes.
  - Kelvin-Planck Statement: It is impossible for any heat engine operating in a thermodynamic cycle to produce net work while exchanging heat with only a single thermal reservoir (Efficiency η < 100%).
  - Clausius Statement: It is impossible to construct a device that operates in a cycle and produces no effect other than the transfer of heat from a cooler body to a hotter body without external work input.
2. Thermodynamic Processes:
- Isochoric (V = const, W = 0, Q = ΔU = m Cv ΔT).
- Isobaric (P = const, W = P(V₂ - V₁), Q = m Cp ΔT = ΔH).
- Isothermal (T = const, ΔU = 0, Q = W = P₁V₁ ln(V₂/V₁)).
- Adiabatic / Isentropic (Q = 0, P V^γ = const, W = (P₁V₁ - P₂V₂)/(γ - 1)).
- Polytropic (P V^n = const, W = (P₁V₁ - P₂V₂)/(n - 1)).
3. Concept of Entropy (S):
- Clausius Inequality: ∮ dQ / T ≤ 0 (equality for reversible cycles, strict inequality for irreversible cycles).
- Principle of Increase of Entropy: For an isolated system, (dS)_isolated ≥ 0. Entropy quantifies molecular disorder and unavailability of thermal energy for work conversion.`,

  `Basic Thermodynamics Concepts & Laws:
1. Thermodynamic Systems:
- Closed System (Control Mass): Only energy (heat/work) crosses boundary, no mass transfer (e.g., piston-cylinder without valves).
- Open System (Control Volume): Both mass and energy cross control surface (e.g., turbine, compressor, nozzle, boiler).
- Isolated System: Neither mass nor energy crosses boundary (e.g., universe, perfectly insulated rigid vessel).
2. First and Second Law Analysis:
- First law establishes energy balance: Q - W = ΔE = ΔU + ΔKE + ΔPE.
- Second law introduces quality of energy, entropy generation S_gen ≥ 0, and limits on thermal efficiency:
  - Carnot Cycle: Maximum theoretical efficiency between reservoirs TH and TL: η_carnot = 1 - TL / TH.
  - Reversible processes are ideal benchmarks with zero entropy generation. Real processes contain internal friction, unrestrained expansion, and finite temperature difference heat transfer, rendering S_gen > 0.`,

  `Thermodynamic Foundations in Engineering:
- System properties: Intensive (independent of mass: P, T, density) vs Extensive (dependent on mass: V, U, H, S).
- Pure Substance Phase Diagram: P-v, T-s, and P-h Mollier diagrams depicting subcooled liquid, wet vapor mixture (dryness fraction x), saturated vapor, and superheated steam regions.
- Gas Power vs Vapor Power cycles: Air standard cycles (Otto, Diesel, Dual) vs Rankine steam cycles.
- Exergy / Availability: Maximum theoretical useful work obtainable from a system as it reaches thermal and mechanical dead state equilibrium with ambient surroundings.`
];

mechanicalAnswers.q3 = [
  `1. Internal Combustion (IC) Engines Classification:
IC engines convert chemical energy in fuel into mechanical work through controlled combustion inside the engine cylinder.
Classified by:
- Operating Cycle: 4-Stroke (Suction, Compression, Power/Expansion, Exhaust over 720° crank rotation) vs 2-Stroke (Completion in 360° crank rotation with scavenging ports).
- Ignition Method: Spark Ignition (SI - Petrol engines, Otto Cycle) vs Compression Ignition (CI - Diesel engines, Diesel Cycle).
- Cooling System: Air cooled (finned cylinders) vs Liquid/Water cooled (water jackets, radiator, thermostat).
2. Major Engine Components:
- Cylinder Block and Head: Cast iron/aluminum alloy housing containing combustion chamber and water jackets.
- Piston & Piston Rings: Compresses air-fuel charge; compression rings seal gas blow-by, oil control rings scrape lubricating oil.
- Connecting Rod: Converts reciprocating motion of piston into rotary motion of crankshaft via gudgeon pin and crank pin.
- Crankshaft & Flywheel: Delivers output torque; flywheel smooths out cyclic torque fluctuations.
- Valvetrain: Camshaft, pushrods, rocker arms, intake and exhaust poppet valves.
3. Air-Standard Cycles:
- Otto Cycle (Constant Volume heat addition): Efficiency η_otto = 1 - (1 / r^(γ-1)), where r = V₁/V₂ is compression ratio (typically 6-10).
- Diesel Cycle (Constant Pressure heat addition): Efficiency η_diesel = 1 - [ (rc^γ - 1) / (γ (rc - 1) r^(γ-1)) ], where rc is cut-off ratio (compression ratio r = 14-22).
- CI engines have higher compression ratios and thermal efficiencies, delivering superior fuel economy and torque output.`,

  `IC Engines - Working Principles and Component Design:
1. 4-Stroke SI Engine (Petrol) vs 4-Stroke CI Engine (Diesel):
- Fuel Induction: SI engines draw homogeneous air-fuel mixture via carburetor or multi-point fuel injection (MPFI); CI engines draw pure air during suction stroke and inject finely atomized diesel at high pressure (1500-2500 bar via CRDI) near TDC.
- Ignition: SI uses an electric spark plug (15-25 kV); CI uses auto-ignition caused by high temperature resulting from high compression (T > 600°C).
- Combustion: SI exhibits rapid flame front propagation; CI exhibits multi-point spontaneous ignition with physical and chemical delay periods.
2. Engine Performance Parameters:
- Indicated Power (IP): Power developed inside cylinder: IP = (P_m L A n k) / 60 (kW).
- Brake Power (BP): Usable shaft power at flywheel measured by dynamometer: BP = (2 π N T) / 60000.
- Mechanical Efficiency: η_mech = BP / IP (typically 80-90%).
- Brake Specific Fuel Consumption (BSFC): Fuel mass flow rate per unit brake power: BSFC = m_fuel / BP (g/kWh).`,

  `Design and Deployment of IC Engines:
- Valve Timing Diagrams: Illustrate intake valve opening (IVO advance), intake valve closing (IVC retard), ignition advance/fuel injection timing, and exhaust valve opening/closing (overlap period for effective scavenging).
- Modern Emission Control Technologies: Catalytic converters (Three-Way Catalysts for NOx, CO, and unburnt HC), Diesel Particulate Filters (DPF), Selective Catalytic Reduction (SCR with AdBlue/Urea injection), and Exhaust Gas Recirculation (EGR) to suppress peak combustion temperatures and NOx formation.`
];

mechanicalAnswers.q4 = [
  `1. Vapor Compression Refrigeration System (VCRS):
VCRS is the most widely adopted thermodynamic refrigeration cycle in domestic refrigerators, cold storage, and air conditioners.
Key Components and Thermodynamic Processes:
1. Compressor (Process 1-2): Reversible isentropic compression of low-pressure saturated vapor to high-pressure superheated vapor (Work input W_in = h₂ - h₁).
2. Condenser (Process 2-3): Constant-pressure heat rejection to ambient heat sink (cooling air/water), condensing refrigerant to saturated/subcooled liquid (Q_out = h₂ - h₃).
3. Expansion Valve / Capillary Tube (Process 3-4): Isenthalpic throttling process (h₃ = h₄) dropping refrigerant pressure and temperature via Joule-Thomson expansion.
4. Evaporator (Process 4-1): Constant-pressure heat absorption from refrigerated space, evaporating low-quality liquid-vapor mixture into dry saturated vapor (Refrigeration Effect RE = h₁ - h₄).
Coefficient of Performance (COP):
- COP_refrigeration = Desired Cooling Effect / Net Work Input = (h₁ - h₄) / (h₂ - h₁).
2. Refrigerants:
- Evolution: CFCs (R-12) -> HCFCs (R-22) -> HFCs (R-134a, R-410A) -> Eco-friendly Low GWP/ODP refrigerants (R-32, R-1234yf, Hydrocarbons R-290, R-600a).
3. Thermal Power Plant Rankine Cycle:
- Consists of Boiler (heat addition Q_in), Steam Turbine (expansion producing shaft work W_t = h₁ - h₂), Condenser (heat rejection Q_out = h₂ - h₃), and Boiler Feed Pump (isentropic work W_p = h₄ - h₃ = v_f (P_boiler - P_cond)).
- Thermal Efficiency: η_th = (W_t - W_p) / Q_in = [ (h₁ - h₂) - (h₄ - h₃) ] / (h₁ - h₄).
- Reheat and Regenerative feedwater heating cycles improve plant thermal efficiency and steam quality at turbine exhaust.`,

  `Refrigeration Systems and Power Plant Engineering:
1. Vapor Absorption Refrigeration System (VARS) vs VCRS:
- VARS replaces mechanical compressor with an absorber, generator, pump, and heat source (waste heat/solar thermal/steam), using NH₃-H₂O or LiBr-H₂O working pairs, reducing electricity consumption.
2. VCRS Performance Enhancement:
- Subcooling of liquid refrigerant before expansion increases refrigeration effect (RE' > RE) without increasing compressor work, enhancing COP.
- Superheating of suction vapor ensures dry compression, protecting compressor valves against liquid droplet slugging.
3. Power Plant Systems:
- Coal-fired thermal power plants operate on Supercritical Rankine Cycles (P > 22.1 MPa) reaching efficiencies > 42%.
- Gas Turbine Brayton Cycles combined with Steam Rankine Cycles (Combined Cycle Gas Turbine - CCGT) achieve overall thermal efficiencies exceeding 60%.`,

  `Fundamentals of Refrigeration & Power Generation:
- T-s and P-h Diagrams for VCRS: Clear illustration of subcooling, superheating, and throttling paths.
- Ton of Refrigeration (TR): Rate of heat removal required to freeze 1 US short ton (2000 lbs) of water at 0°C into ice in 24 hours: 1 TR = 3.517 kW (210 kJ/min).
- Power plant auxiliaries: Economizers (preheats feed water using flue gas), Air Preheaters (recovers flue gas heat to warm combustion air), Superheaters, Electrostatic Precipitators (ESP for fly ash removal), and Cooling Towers.`
];

mechanicalAnswers.q5 = [
  `1. Classification of Manufacturing Processes:
Manufacturing transforms raw materials into finished functional components through:
a) Primary Shaping (Casting): Pouring molten metal into mold cavities replicating the desired geometry.
   - Steps in Sand Casting: Pattern making (allowing for shrinkage, draft, machining allowances), core making, molding sand preparation (sand + bentonite clay + moisture), gating system design (pouring basin, sprue, runner, ingates, riser for shrinkage feeding), pouring, solidification, and fettling.
   - Special casting: Die casting, Investment/Lost-wax casting, Centrifugal casting.
b) Forming & Shaping (Plastic Deformation):
   - Hot working (above recrystallization temperature, lower yield strength, refined grain structure) vs Cold working (below recrystallization, strain hardening, superior surface finish).
   - Operations: Forging (open/closed die), Rolling (structural sections, plates), Extrusion (direct/indirect profiles), Wire/Tube Drawing.
c) Material Removal (Machining):
   - Traditional: Turning on Lathe, Milling (up-milling, down-milling), Drilling, Shaping, Grinding (abrasive finishing).
   - Single-point cutting tool geometry: Back rake angle, side rake angle, clearance angles, cutting edge angles, nose radius (ASA tool signature: α_b - α_s - θ_e - θ_s - C_e - C_s - R).
   - Taylor's Tool Life Equation: V T^n = C.
d) Joining Processes:
   - Welding: Fusion welding (Shielded Metal Arc Welding - SMAW, TIG/GTAW, MIG/GMAW, Submerged Arc) and Resistance welding (Spot, Seam).
   - Brazing (filler melts > 450°C, capillary action) and Soldering (filler < 450°C).`,

  `Manufacturing Science and Production Technology:
1. Metal Casting Analysis:
- Chvorinov's Rule for solidification time: t_s = B (V / A)^n (where n ≈ 2, ensuring riser solidifies last: t_riser > t_casting).
- Common casting defects: Blowholes, porosity, cold shuts, misruns, hot tears, sand inclusions.
2. Mechanics of Metal Cutting (Merchant's Circle Diagram):
- Relates cutting force (Fc), thrust force (Ft), shear force (Fs), normal shear force (Fn), friction force (F), and normal friction force (N).
- Shear angle relation: φ = 45° + (α/2) - (β/2) (where α is rake angle, β is friction angle).
- Chip formation modes: Continuous chips (ductile metals at high speed), Continuous with BUE (Built-Up Edge), and Discontinuous chips (brittle metals like cast iron).
3. Advanced Non-Traditional Machining:
- EDM (Electric Discharge Machining), ECM (Electrochemical Machining), LBM (Laser Beam Machining), and USM (Ultrasonic Machining) for superalloys and intricate dies.`,

  `Introduction to Modern Manufacturing Systems:
- Machine tools: Center Lathe construction (bed, headstock, tailstock, carriage, lead screw), CNC milling and turning centers with G-code and M-code programming.
- Metal joining physics: Heat Affected Zone (HAZ) metallurgy, shielding gas selection (Argon/Helium for TIG/MIG preventing oxidation), weld inspection using Non-Destructive Testing (NDT: Radiography, Ultrasonic testing, Magnetic particle inspection, Dye penetrant).`
];

const civilAnswers = {
  q1: [
    `1. Scope and Broad Disciplines of Civil Engineering:
Civil Engineering is the oldest engineering discipline responsible for the planning, design, construction, operation, and maintenance of built infrastructure and natural environment systems.
Core Branches:
1. Structural Engineering: Analyzes forces, moments, and stresses in buildings, bridges, towers, and dams to ensure structural stability, safety, and serviceability under gravity, wind, and seismic loads.
2. Geotechnical Engineering: Studies soil mechanics, rock mechanics, shear strength, bearing capacity, slope stability, and designs shallow and deep foundations (pile, caisson).
3. Transportation Engineering: Highway geometric design, traffic engineering, airport planning, railway alignment, and pavement layer design (flexible bituminous vs rigid concrete).
4. Environmental & Water Resources Engineering: Water supply networks, wastewater treatment plants, hydrology, flood control, irrigation channels, and pollution remediation.
5. Surveying & Geomatics: Topographic mapping, leveling, GIS/GPS integration, photogrammetry, and remote sensing.
6. Construction Technology & Management: Project scheduling (CPM/PERT), resource leveling, cost estimation, quality assurance, and building information modeling (BIM).
2. Interdisciplinary Role & Sustainability:
- Civil engineers drive urbanization while minimizing carbon footprints through green building standards (LEED/GRIHA), rainwater harvesting, and recycled construction materials.`,

    `Civil Engineering Domain and Infrastructure Development:
1. Branches and Functional Specializations:
- Structural Engineering: RCC design (IS 456), Steel structures (IS 800), seismic resistant design (IS 1893).
- Geotechnical Engineering: Subsurface investigation, Standard Penetration Test (SPT), Terzaghi's bearing capacity theory, retaining wall earth pressures (Rankine/Coulomb).
- Transportation & Highway Engineering: IRC design codes for horizontal curves, stopping sight distance (SSD), overtaking sight distance (OSD), superelevation e = v² / (225 R).
- Hydraulics and Water Resource Management: Open channel hydraulics, weir/barrage design, dam spillways, aquifer recharge.
- Surveying & Mapping: Setting out works, spatial data acquisition for civil infrastructure.
2. Societal Impact: Provides clean drinking water, sanitation systems, disaster-resilient shelter, transportation arteries, and sustainable urban mobility networks.`,

    `Overview of Civil Engineering and Infrastructure:
- Core role: Conceptualizing, detailing, constructing, and maintaining infrastructure for economic and societal development.
- Key disciplines: Structural mechanics, Fluid mechanics, Soil mechanics, Construction project management, and Environmental quality engineering.
- Modern innovations: Smart cities, precast modular concrete construction, Building Information Modeling (BIM) for 4D/5D clash detection, self-compacting and ultra-high-performance concrete (UHPC).`
  ]
};

civilAnswers.q2 = [
  `1. Building Materials - Bricks and Masonry Construction:
Bricks are fundamental structural building blocks manufactured from clay earth.
Composition of Good Brick Earth:
- Silica (50-60%): Prevents cracking, shrinking, and warping of raw bricks; imparts uniform shape.
- Alumina (20-30%): Imparts plasticity necessary for molding the clay into brick shapes.
- Lime (5%): Acts as a flux, binding silica particles during burning at ~1000-1100°C; prevents shrinkage.
- Iron Oxide (5-6%): Imparts characteristic red color and improves durability and impermeability.
- Magnesia (<1%): Imparts yellow tint and reduces shrinkage.
Harmful Ingredients: Excess lime (causes slaking and bursting), iron pyrites (causes crystallization and splitting), alkalis (cause efflorescence), pebbles/gravel, and organic matter.
2. Manufacturing Process of Bricks:
1. Preparation of clay (unsoiling, digging, weathering, blending, and tempering in a Pug Mill).
2. Molding (Hand molding using wooden/steel molds or Machine molding - wire cut bricks).
3. Drying (Air drying in open sheds for 3-8 days to remove free moisture).
4. Burning (in intermittent Kilns or continuous Bull's Trench / Hoffmann's Kiln at 900-1100°C).
3. Classification and Quality Testing:
- First Class Bricks: Compressive strength ≥ 10.5 N/mm², water absorption < 20% by dry weight after 24 hr immersion, clear ringing sound on striking, uniform sharp edges.
- Second Class Bricks: Compressive strength ≥ 7.0 N/mm², water absorption < 22%.
- Third Class Bricks: Underburnt, compressive strength ≥ 3.5 N/mm², used for temporary structures.
- Field/Lab Tests: Compressive strength test (in UTM), Water absorption test, Efflorescence test (checking soluble salts deposit), Hardness (finger nail scratch), Soundness, and Dimensional tolerance test.`,

  `Building Materials & Brick Technology:
1. Bricks Properties and Testing Standards (as per IS 3495 & IS 1077):
- Standard Modular Brick Size: 190 mm × 90 mm × 90 mm (with mortar joint: 200 mm × 100 mm × 100 mm).
- Frog Size: 100 mm × 40 mm × 10 mm indentation on top face, forming a shear key with mortar.
- Mortar Bonds in Brickwork:
  - English Bond: Alternate courses of headers and stretchers; queen closer placed next to quoin header to break vertical joint continuity. Strongest bond for load-bearing walls.
  - Flemish Bond: Alternate headers and stretchers in the same course (Single and Double Flemish bond). More aesthetically pleasing.
2. Alternative Modern Masonry Units:
- Fly Ash Clay Bricks (uses industrial waste, eco-friendly, higher compressive strength).
- Autoclaved Aerated Concrete (AAC) blocks: Lightweight (1/3rd weight of clay brick), superior thermal and acoustic insulation, fast construction.`,

  `Brick Engineering and Quality Assessment:
- Chemical balance in brick earth: Silica and Alumina maintain mechanical stiffness and plasticity.
- Burning stages: Dehydration (400-650°C), Oxidation (650-900°C), and Vitrification (900-1100°C). Overburnt bricks (Jhama) become brittle and distorted; underburnt bricks (Pila) remain soft and porous.
- Quality tests: Testing for efflorescence (Nil, Slight, Moderate, Heavy, Serious), compressive strength loading at 14 N/mm² per minute, and impact toughness.`
];

civilAnswers.q3 = [
  `1. Fundamentals of Surveying:
Surveying is the art and science of determining the relative spatial positions of points on, above, or beneath the Earth's surface by means of direct or indirect linear and angular measurements.
Fundamental Principles of Surveying:
1. Working from Whole to Part:
   - Establishing a primary framework of high-precision control points (triangulation/traversing) covering the entire area before filling in minor local details.
   - Prevents accumulation of measurement errors and localizes minor errors within individual sub-polygons.
2. Location of a Point by Measurement from at least Two Reference Points:
   - The position of any new point must be fixed by at least two independent measurements (e.g., two distances, two angles, or one distance and one angle like bearing and offset).
2. Primary Classifications:
- Plane Surveying: Earth's curvature is neglected; surface is treated as a flat plane (valid for areas < 250 km²).
- Geodetic Surveying: Earth's spheroidal curvature is explicitly accounted for; used for large national boundary surveys and geodetic networks.
3. Surveying Instruments and Workflows:
- Chain and Tape Surveying: Direct linear distance measurement, ranging, and taking perpendicular/oblique offsets.
- Compass Surveying: Prismatic compass measures magnetic bearings of lines based on Earth's magnetic meridian (Whole Circle Bearing 0-360°). Correcting for Local Attraction.
- Leveling (Dumpy Level / Auto Level / Digital Level): Measuring relative vertical elevations. Collimation method vs Rise and Fall method.
- Theodolite & Total Station: Total Station integrates electronic theodolite, EDM (Electronic Distance Meter), microprocessor, and memory to measure 3D coordinates (X, Y, Z) automatically.
- GPS/GNSS and GIS: Satellite-based positioning (RTK GPS) combined with Geographic Information Systems for spatial mapping and infrastructure asset management.`,

  `Surveying Principles and Field Deployments:
1. Principles:
- Whole to Part strategy guarantees error confinement.
- Reference measurements ensure geometric redundancy and blunder detection.
2. Leveling Methodologies:
- Height of Instrument (HI) Method: HI = Benchmark Elevation + Back Sight (BS); Reduced Level (RL) = HI - Intermediate Sight (IS) or Fore Sight (FS).
- Rise and Fall Method: Arithmetic check: ΣBS - ΣFS = ΣRise - ΣFall = Last RL - First RL. Provides complete check on all intermediate level calculations.
3. Modern Geomatics:
- Total Station operation: Laser EDM measures slope distance, optical encoders measure horizontal and vertical angles, internal firmware computes horizontal distance, vertical difference, and northing/easting/elevation coordinates.
- Aerial Photogrammetry & LiDAR: Drone-based photogrammetric contour mapping for highway alignments and reservoir submergence studies.`,

  `Overview of Surveying and Geomatics:
- Survey types: Topographical, Cadastral (property boundaries), Engineering, Hydrographic, and Astronomical surveys.
- Error classifications: Instrumental, Personal, and Natural errors categorized into Systematic (cumulative) and Random (compensating) errors.
- Traverse computations: Latitude (L = l cos θ) and Departure (D = l sin θ); balancing closed traverse using Bowditch's Rule and Transit Rule.`
];

civilAnswers.q4 = [
  `1. Classification of Civil Engineering Structures:
Structures transfer dead loads, live loads, wind loads, and seismic forces safely down to the supporting foundation soil.
Primary Types:
1. Load-Bearing Masonry Structures:
   - Roof slabs and beams rest directly on thick masonry walls (brick or stone).
   - Walls transfer loads vertically to continuous strip footings.
   - Suitable only for low-rise buildings (G+1 or G+2); limited architectural flexibility (walls cannot be removed easily).
2. Framed Structures (RCC / Steel):
   - Monolithic skeletal framework consisting of interconnected structural members: Slabs -> Beams -> Columns -> Footings -> Subsoil.
   - Walls act merely as non-load-bearing curtain/partition walls that can be repositioned.
   - Highly ductile and earthquake resistant; suitable for multi-story residential and commercial towers.
3. Special Structures: Trusses, Arches, Cable-Stayed & Suspension Bridges, Retaining Walls, Water Tanks, and Silos.
2. Structural Elements and Load Paths:
- Slabs: Planar flexural members carrying gravity surface loads (One-way: Ly/Lx > 2, Two-way: Ly/Lx ≤ 2).
- Beams: Linear flexural members resisting bending moments and shear forces.
- Columns: Vertical compression members subject to axial loads and biaxial bending moments.
- Footings: Isolated, Combined, Raft/Mat, or Piled foundations transferring loads without exceeding safe bearing capacity (SBC) of soil.
3. Transportation Infrastructure - Highway Pavements:
- Flexible Pavements: Bituminous surface, granular base, and sub-base layers transferring wheel loads to subgrade via grain-to-grain contact stress distribution.
- Rigid Pavements: Plain or reinforced cement concrete (PQC) slabs transferring wheel loads through beam/slab flexural action across a large area.`,

  `Structural Systems and Highway Engineering:
1. Structural Load Paths and Mechanics:
- Load Combination as per IS 875 & IS 1893: 1.5 (DL + LL), 1.2 (DL + LL ± EL/WL), 1.5 (DL ± EL/WL).
- Framed systems offer superior lateral stiffness against wind and seismic shaking through moment-resisting frames (SMRF) and concrete shear walls.
2. Foundation Systems Selection:
- Shallow Foundations: Isolated column footings, strap footings, and raft foundations used when topsoil has adequate bearing capacity.
- Deep Foundations: End-bearing and friction piles driven or bored down to hard rock strata when topsoil consists of soft expansive clays (e.g., Black Cotton Soil).
3. Pavement Engineering:
- California Bearing Ratio (CBR) method for designing flexible pavement layer thicknesses.
- Concrete pavement joint design: Expansion joints, Contraction joints with dowel bars for load transfer, and Longitudinal joints with tie bars.`,

  `Civil Engineering Structural Types and Transportation:
- Skeletal comparison: Load bearing (economical for small structures, thick walls) vs Framed RCC (slender columns, large column-free spans, seismic resistance).
- Deep foundation design: Pile load capacity Q_u = Q_b + Q_s (base resistance + skin friction).
- Highway cross-section elements: Right-of-Way, Carriageway width, Shoulders, Camber (for transverse stormwater drainage: 2-3%), Superelevation, and Gradient transitions.`
];

civilAnswers.q5 = [
  `1. Water Resources & Hydrological Cycle:
Water Resources Engineering manages the natural circulation, distribution, and quality of water.
The Hydrological Cycle involves: Evaporation -> Transpiration -> Evapotranspiration -> Condensation & Cloud formation -> Precipitation -> Surface Runoff & Infiltration -> Groundwater flow -> Discharge to oceans.
2. Natural Water Sources:
a) Surface Water Sources:
   - Rivers & Streams: Perennial or non-perennial; variable discharge and high seasonal turbidity/suspended solids.
   - Lakes & Ponds: Natural inland depressions; susceptible to thermal stratification and algae growth.
   - Storage Reservoirs: Formed by constructing dams across river valleys; provides sustained water supply, flood mitigation, and hydropower.
b) Subsurface / Groundwater Sources:
   - Infiltration Wells, Infiltration Galleries, Dug Wells, and Borewells/Tubewells.
   - Aquifers: Unconfined (water table aquifer) and Confined/Artesian aquifers bounded between impermeable aquicludes/aquitards.
   - Groundwater is naturally filtered through soil strata, exhibiting low turbidity, but may contain dissolved mineral hardness, iron, fluorides, or arsenic.
3. Water Treatment Plant (WTP) Flow Diagram:
1. Screening: Coarse and fine bar screens remove floating debris, rags, and leaves.
2. Aeration: Cascading aerators oxidize dissolved iron/manganese and strip volatile odorous gases (H₂S).
3. Coagulation & Flocculation: Adding alum (aluminum sulfate) destabilizes colloidal negatively charged particles; flash mixing followed by gentle paddle flocculation forms heavy settleable flocs.
4. Sedimentation: Clarifiers provide 2-4 hours detention time, allowing flocs to settle under gravity.
5. Rapid Sand Filtration: Multi-layer sand and gravel beds remove fine residual suspended matter and pathogens (filter rate: 3000-6000 L/m²/hr).
6. Disinfection: Chlorination (residual chlorine ~0.2 ppm) destroys enteric pathogenic bacteria, ensuring biostability throughout the distribution pipe network.`,

  `Environmental Engineering - Water Quality and Treatment:
1. Water Quality Standards (as per IS 10500: 2012):
- Physical Parameters: Turbidity (< 1 NTU), Color (< 5 Hazen), Taste & Odor, Total Dissolved Solids (TDS < 500 mg/L).
- Chemical Parameters: pH (6.5 - 8.5), Total Hardness (as CaCO₃ < 200 mg/L), Chlorides (< 250 mg/L), Sulfates (< 200 mg/L), Nitrate (< 45 mg/L, prevents Methemoglobinemia), Fluoride (1.0 - 1.5 mg/L, prevents dental caries).
- Biological Parameters: Total Coliform and E. coli count must be 0 per 100 mL sample.
2. Wastewater Treatment and Biochemical Oxygen Demand (BOD):
- Primary Treatment: Screens, Grit Chambers, and Primary Sedimentation Tank (PST).
- Secondary Biological Treatment: Activated Sludge Process (ASP) or Trickling Filters where aerobic microorganisms degrade dissolved organic matter.
- BOD₅: Biochemical oxygen demand over 5 days at 20°C measuring biodegradable organic pollution.
- COD: Chemical oxygen demand measuring total chemically oxidizable matter using potassium dichromate.`,

  `Water Resources and Environmental Systems:
- Hydrology: Hydrographs, Unit Hydrograph theory, Rational formula for peak runoff Q = C I A.
- Groundwater hydraulics: Darcy's Law v = K i, Dupuit-Thiem equilibrium equations for unconfined and confined aquifer well discharge.
- Advanced water treatment technologies: Dissolved Air Flotation (DAF), Granular Activated Carbon (GAC) adsorption, Membrane Filtration (Ultrafiltration, Reverse Osmosis for desalination), and UV disinfection.`
];

const discreteAnswers = {
  q1: [
    `1. Set Theory Fundamentals:
A Set is a well-defined collection of distinct mathematical objects.
Fundamental Operations on Sets A, B ⊆ U:
- Union (A ∪ B): {x | x ∈ A ∨ x ∈ B}
- Intersection (A ∩ B): {x | x ∈ A ∧ x ∈ B}
- Set Difference (A - B or A \\ B): {x | x ∈ A ∧ x ∉ B}
- Symmetric Difference (A ⊕ B): (A - B) ∪ (B - A) = (A ∪ B) - (A ∩ B)
- Absolute Complement (A'): {x | x ∈ U ∧ x ∉ A}
- Cartesian Product (A × B): {(a, b) | a ∈ A ∧ b ∈ B}, with cardinality |A × B| = |A| · |B|.
- Power Set P(A): Set of all subsets of A, with cardinality |P(A)| = 2^|A|.
2. Binary Relations and Properties:
A binary relation R from set A to set B is a subset of A × B (R ⊆ A × B).
Properties of a relation R on set A:
1. Reflexive: ∀x ∈ A, (x, x) ∈ R.
2. Irreflexive: ∀x ∈ A, (x, x) ∉ R.
3. Symmetric: ∀x, y ∈ A, (x, y) ∈ R => (y, x) ∈ R.
4. Anti-symmetric: ∀x, y ∈ A, ((x, y) ∈ R ∧ (y, x) ∈ R) => x = y.
5. Transitive: ∀x, y, z ∈ A, ((x, y) ∈ R ∧ (y, z) ∈ R) => (x, z) ∈ R.
3. Equivalence Relations & Partitions:
- A relation R is an Equivalence Relation if and only if R is Reflexive, Symmetric, and Transitive.
- Equivalence Classes: [a] = {x ∈ A | (a, x) ∈ R}.
- Fundamental Theorem of Equivalence Relations: The distinct equivalence classes of an equivalence relation on A form a Partition of A (pairwise disjoint non-empty sets whose union is A).
4. Partial Order Relations (Posets) & Hasse Diagrams:
- A relation R on A is a Partial Order if R is Reflexive, Anti-symmetric, and Transitive. The pair (A, R) is called a Poset.
- Hasse Diagram: A simplified directed acyclic graphical representation of a finite Poset where self-loops (reflexivity) and transitive edges are omitted, and directions are implied upwards.`,

    `Set Theory, Relations, and Order Theory:
1. Set Algebra and Laws:
- Idempotent Laws: A ∪ A = A, A ∩ A = A.
- Associative & Commutative Laws.
- Distributive Laws: A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C) and A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C).
- De Morgan's Laws: (A ∪ B)' = A' ∩ B' and (A ∩ B)' = A' ∪ B'.
- Principle of Duality: Interchanging ∪ with ∩, and ∅ with U preserves algebraic truth.
2. Relational Matrix & Closure Operations:
- Matrix representation: M_R where M_ij = 1 if (ai, aj) ∈ R else 0.
- Reflexive Closure: R ∪ Δ (where Δ is identity diagonal relation).
- Symmetric Closure: R ∪ R⁻¹.
- Transitive Closure: Computed using Warshall's Algorithm (R^+ = ⋃ R^k).
3. Lattices in Posets:
- A Poset (L, ≤) is a Lattice if every pair of elements a, b ∈ L has a unique Least Upper Bound (LUB / Join: a ∨ b = sup{a, b}) and a unique Greatest Lower Bound (GLB / Meet: a ∧ b = inf{a, b}).
- Distributive and Complemented Lattices form Boolean Algebras.`,

    `Foundations of Sets and Binary Relations:
- Definitions: Inclusion-Exclusion for two sets: |A ∪ B| = |A| + |B| - |A ∩ B|. For three sets: |A ∪ B ∪ C| = |A| + |B| + |C| - (|A∩B| + |B∩C| + |A∩C|) + |A∩B∩C|.
- Composition of Relations: If R ⊆ A × B and S ⊆ B × C, then S ∘ R = {(a, c) | ∃b ∈ B, (a,b) ∈ R ∧ (b,c) ∈ S}.
- Functions as special relations: Injective (one-to-one), Surjective (onto), and Bijective (one-to-one and onto invertible mapping).`
  ]
};

discreteAnswers.q2 = [
  `1. Propositional Logic:
A Proposition is a declarative statement that is either strictly True (T) or strictly False (F), but not both.
Logical Connectives and Truth Tables:
1. Negation (¬p / ~p): NOT p.
2. Conjunction (p ∧ q): True only when both p and q are True.
3. Disjunction (p ∨ q): False only when both p and q are False.
4. Implication / Conditional (p -> q): False only when p is True and q is False. Equivalent to ¬p ∨ q.
   - Converse: q -> p
   - Inverse: ¬p -> ¬q
   - Contrapositive: ¬q -> ¬p (logically equivalent to p -> q).
5. Biconditional (p <-> q): True when p and q have identical truth values. Equivalent to (p -> q) ∧ (q -> p).
2. Classification of Compound Propositions:
- Tautology: A statement formula that is True under all possible truth assignments to its atomic variables (e.g., p ∨ ¬p).
- Contradiction / Fallacy: A formula that is False under all truth assignments (e.g., p ∧ ¬p).
- Contingency: A formula that is neither a tautology nor a contradiction (True under some truth assignments, False under others).
3. Predicate Logic and Quantifiers:
- Predicate P(x): Statement containing variables asserting a property of x.
- Universal Quantifier (∀x P(x)): True if P(x) is true for all x in the domain of discourse.
- Existential Quantifier (∃x P(x)): True if there exists at least one x in the domain for which P(x) is true.
- Negation of Quantified Statements: ¬(∀x P(x)) ≡ ∃x ¬P(x) and ¬(∃x P(x)) ≡ ∀x ¬P(x).
4. Rules of Inference: Modus Ponens (p, p->q ⊢ q), Modus Tollens (¬q, p->q ⊢ ¬p), Hypothetical Syllogism (p->q, q->r ⊢ p->r), and Resolution principle.`,

  `Mathematical Logic and Formal Reasoning:
1. Logical Equivalences:
- Equivalence Laws: De Morgan's, Double Negation (¬¬p ≡ p), Absorption (p ∨ (p ∧ q) ≡ p), Exportation ((p ∧ q) -> r ≡ p -> (q -> r)).
- Normal Forms:
  - Conjunctive Normal Form (CNF): Product of sums (Conjunction of clauses).
  - Disjunctive Normal Form (DNF): Sum of products (Disjunction of minterms).
  - Principal DNF (PDNF) and Principal CNF (PCNF) uniquely identify truth-table rows.
2. Proof Techniques in Mathematics:
- Direct Proof: Assuming hypothesis P is true and showing Q follows through deduction.
- Proof by Contraposition: Proving ¬Q -> ¬P.
- Proof by Contradiction (Reductio ad absurdum): Assuming P ∧ ¬Q and deriving a logical contradiction (R ∧ ¬R).
- Mathematical Induction: Base Case P(1), Inductive Hypothesis P(k), and Inductive Step proving P(k+1).`,

  `Propositional and First-Order Predicate Logic:
- Validity of Arguments: An argument with premises P1, P2, ..., Pn and conclusion C is valid if and only if (P1 ∧ P2 ∧ ... ∧ Pn) -> C is a Tautology.
- Methods of testing validity: Truth table enumeration, algebraic simplification using equivalence laws, and natural deduction inference trees.
- Applications in Computer Science: Digital circuit design, automated theorem provers, database query optimization, and formal verification of concurrent algorithms.`
];

discreteAnswers.q3 = [
  `1. Algebraic Systems & Structures:
An Algebraic System is a non-empty set G equipped with one or more n-ary closed operations (G, *).
Hierarchy of Algebraic Structures:
1. Groupoid: A set G closed under binary operation * (∀a, b ∈ G, a * b ∈ G).
2. Semi-group: A groupoid where the operation * is Associative: ∀a, b, c ∈ G, (a * b) * c = a * (b * c).
3. Monoid: A semi-group that contains an Identity Element e ∈ G such that ∀a ∈ G, a * e = e * a = a.
4. Group: A monoid where every element a ∈ G has an Inverse a⁻¹ ∈ G such that a * a⁻¹ = a⁻¹ * a = e.
5. Abelian / Commutative Group: A group (G, *) that satisfies the Commutative Law: ∀a, b ∈ G, a * b = b * a.
2. Subgroups, Cosets, and Cyclic Groups:
- Subgroup: A non-empty subset H ⊆ G is a subgroup (H ≤ G) if (H, *) forms a group under the same operation.
  - Necessary & Sufficient Condition: ∀a, b ∈ H, a * b⁻¹ ∈ H.
- Cyclic Group: A group G is cyclic if every element in G can be generated as a power of a single generator element g ∈ G (G = <g> = {g^k | k ∈ ℤ}). Every cyclic group is Abelian.
- Cosets: Let H ≤ G and a ∈ G:
  - Left Coset: aH = {a * h | h ∈ H}.
  - Right Coset: Ha = {h * a | h ∈ H}.
3. Lagrange's Theorem for Finite Groups:
- Statement: The order of every subgroup H of a finite group G divides the order of G: |G| = |H| · [G : H], where [G : H] is the index of H in G (number of distinct cosets).
- Corollary: The order of every element in a finite group divides the order of the group (a^|G| = e).
4. Rings, Integral Domains, and Fields:
- Ring (R, +, ·): (R, +) is Abelian group, (R, ·) is semi-group, and · distributes over +.
- Field (F, +, ·): Commutative ring with unity where every non-zero element has a multiplicative inverse.`,

  `Algebraic Structures and Group Theory:
1. Axiomatic Formulations:
- Cayley Tables for finite groups (e.g., Klein 4-group V₄, Modulo addition (ℤn, +n), Modulo multiplication (ℤp*, ×p)).
- Order of an element: Smallest positive integer n such that a^n = e.
- Permutation Groups: Symmetric group S_n (order n!) consisting of bijections on n symbols. Decomposition into disjoint cycles and transpositions (even/odd permutations, Alternating group A_n of order n!/2).
2. Homomorphism and Isomorphism:
- A mapping f: (G, *) -> (G', ∘) is a Group Homomorphism if ∀a, b ∈ G, f(a * b) = f(a) ∘ f(b).
- Kernel of Homomorphism: Ker(f) = {x ∈ G | f(x) = e'}. Ker(f) is a normal subgroup of G.
- First Isomorphism Theorem: G / Ker(f) ≅ Im(f).
- Isomorphism: A bijective homomorphism proving structural equivalence between two algebraic systems.`,

  `Algebraic Systems in Discrete Mathematics:
- Binary operations: Closure, Associativity, Identity, Inverse, Distributivity.
- Normal Subgroups (N ⊲ G): g N g⁻¹ ⊆ N for all g ∈ G. Normal subgroups permit the construction of Quotient / Factor Groups (G/N, *).
- Applications in Computer Science: Error-correcting block codes (linear Hamming codes based on generator and parity-check matrices), cryptography (RSA public-key based on Euler's totient theorem and cyclic group arithmetic ℤn*).`
];

discreteAnswers.q4 = [
  `1. Graph Theory Fundamentals:
A Graph G = (V, E) consists of a non-empty set of vertices V and a set of edges E connecting vertex pairs.
Graph Terminology & Types:
- Degree of a Vertex deg(v): Number of edges incident on v.
  - Handshaking Lemma: In any undirected graph, the sum of degrees of all vertices equals twice the number of edges: ∑_{v∈V} deg(v) = 2 |E|.
  - Corollary: An undirected graph has an even number of vertices with odd degree.
- Graph Varieties:
  - Simple Graph (no loops or parallel edges).
  - Complete Graph Kn: Every pair of distinct vertices is joined by an edge; |E| = n(n-1)/2.
  - Bipartite Graph: V partitioned into V1, V2 such that every edge connects V1 to V2. A graph is bipartite if and only if it contains no odd cycles. Complete Bipartite graph Km,n has m · n edges.
  - Planar Graph: Can be drawn in a plane without intersecting edges.
    - Euler's Planar Formula: V - E + R = 2 (where R is the number of regions/faces).
    - For simple connected planar graph with V ≥ 3: E ≤ 3V - 6.
2. Eulerian vs Hamiltonian Graphs:
- Eulerian Path/Circuit: A closed walk that visits every edge in E exactly once. A connected graph G has an Eulerian circuit if and only if every vertex has an even degree.
- Hamiltonian Path/Cycle: A closed cycle that visits every vertex in V exactly once. (Dirac's Theorem: If deg(v) ≥ n/2 for all v, then G is Hamiltonian).
3. Graph Representations:
- Adjacency Matrix A: A_ij = 1 if (vi, vj) ∈ E else 0. Symmetric for undirected graphs.
- Adjacency List: Array of linked lists storing neighbors; space efficient for sparse graphs (O(V + E)).
4. Trees and Minimum Spanning Trees (MST):
- A Tree is a connected acyclic graph with |E| = |V| - 1.
- Kruskal's Algorithm (greedy edge-sorting using Union-Find disjoint sets) and Prim's Algorithm (priority queue vertex-growth) compute MST in O(E log V).`,

  `Graph Algorithms and Structural Theorems:
1. Graph Connectivity and Traversals:
- Breadth-First Search (BFS) computes shortest path in unweighted graphs using FIFO queue (O(V+E)).
- Depth-First Search (DFS) computes discovery/finishing times, classifying edges into Tree, Back, Forward, and Cross edges (detecting cycles and topological sorting).
2. Graph Coloring & Chromatic Number χ(G):
- Minimum number of colors needed to color vertices such that no two adjacent vertices share the same color.
- Four Color Theorem: Every planar graph is 4-colorable (χ(G) ≤ 4).
- Kuratowski's Theorem: A graph is planar if and only if it does not contain a subgraph homeomorphic to K5 or K3,3.
3. Network Flows:
- Max-Flow Min-Cut Theorem (Ford-Fulkerson algorithm): Maximum flow from source s to sink t equals the minimum capacity of an s-t cut.`,

  `Graph Theory Applications in Computing:
- Definitions: Paths, cycles, connectedness, components, isomorphism between graphs.
- Shortest Path Algorithms: Dijkstra's algorithm (single source, non-negative weights: O((V+E)log V)) and Bellman-Ford (handles negative weight cycles: O(V·E)).
- Applications: Network routing tables, dependency resolution in package managers, circuit PCB layout design, and social network relationship graphs.`
];

discreteAnswers.q5 = [
  `1. Principles of Combinatorics & Counting:
Combinatorics is the branch of discrete mathematics concerning counting, arrangement, and combinations of sets.
Fundamental Counting Principles:
- Sum Rule (Rule of Disjunction): If task A can be done in m ways and task B in n ways, and they are mutually exclusive, then doing either A or B can be done in m + n ways.
- Product Rule (Rule of Sequential Operations): If task A can be done in m ways, and for each way task B can be done in n ways, then doing both tasks sequentially can be done in m · n ways.
2. Permutations and Combinations:
- Permutations (order matters): P(n, r) = n! / (n - r)!.
  - Permutations with repetitions: n! / (n₁! n₂! ... nk!).
  - Circular Permutations: (n - 1)!.
- Combinations (order does not matter): C(n, r) = (n r) = n! / [r! (n - r)!].
  - Pascal's Identity: (n+1 r) = (n r-1) + (n r).
  - Binomial Theorem: (x + y)^n = ∑_{k=0}^n (n k) x^(n-k) y^k.
3. Pigeonhole Principle (PHP):
- Basic PHP: If k+1 or more objects are placed into k boxes, then at least one box must contain two or more objects.
- Generalized PHP: If N objects are placed into k boxes, then at least one box must contain at least ⌈N / k⌉ objects.
- Applications: Proving existence of matching birthdays, identical subsets, and Ramsey theory bounds without explicit construction.
4. Recurrence Relations:
- Linear Homogeneous Recurrence Relations with Constant Coefficients:
  an = c₁ an-1 + c₂ an-2 + ... + ck an-k.
- Solution Method using Characteristic Roots:
  - Form characteristic equation: r^k - c₁ r^(k-1) - ... - ck = 0.
  - If roots r₁, r₂, ..., rk are distinct, general solution: an = α₁ r₁^n + α₂ r₂^n + ... + αk rk^n.
  - If root r₁ has multiplicity m, corresponding terms: (α₁ + α₂ n + α₃ n² + ... + αm n^(m-1)) r₁^n.
  - Particular solutions for non-homogeneous terms (method of undetermined coefficients and Generating Functions G(x) = ∑ an x^n).`,

  `Advanced Combinatorics & Recurrence Formulations:
1. Principle of Inclusion-Exclusion (PIE):
- For finite sets A1, A2, ..., An:
  |⋃ Ai| = ∑ |Ai| - ∑ |Ai ∩ Aj| + ∑ |Ai ∩ Aj ∩ Ak| - ... + (-1)^(n-1) |⋂ Ai|.
- Derangements Dn (Permutations of n items where no element appears in its original position):
  Dn = n! ∑_{k=0}^n (-1)^k / k! ≈ n! / e.
2. Generating Functions:
- Ordinary Generating Function (OGF): A(x) = a₀ + a₁ x + a₂ x² + ... = ∑_{n=0}^∞ an x^n.
- Solves recurrence relations by converting discrete recurrence into continuous algebraic manipulation.
- Closed form for Fibonacci: F(n) = (1/√5) [ ((1+√5)/2)^n - ((1-√5)/2)^n ].
3. Catalan Numbers:
- Cn = (1 / (n+1)) (2n n) = (2n)! / [(n+1)! n!]. Counts number of valid parentheses expressions, distinct binary search trees with n nodes, and polygon triangulations.`,

  `Counting Principles, Combinatorics & Generating Series:
- Combinatorial Arguments: Proving algebraic identities using double-counting / bijection arguments.
- Pigeonhole Principle in discrete algorithms (hash collision analysis, graph degree matching).
- Master Theorem for divide-and-conquer recurrences: T(n) = a T(n/b) + f(n), characterizing asymptotic complexity in algorithm analysis.`
];

const subjectConfigs = [
  {
    code: 'CS 201',
    subjectMatch: 'Physics',
    prefix: 'PH',
    answers: physicsAnswers
  },
  {
    code: 'CS 202',
    subjectMatch: 'Mechanical Engineering',
    prefix: 'ME',
    answers: mechanicalAnswers
  },
  {
    code: 'CS 203',
    subjectMatch: 'Civil Engineering',
    prefix: 'CE',
    answers: civilAnswers
  },
  {
    code: 'CS 204',
    subjectMatch: 'Discrete',
    prefix: 'DM',
    answers: discreteAnswers
  }
];

async function generate200CopiesPerSubject() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/exam_eval_system';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  const adminUser = await User.findOne({ role: 'ADMIN' });

  for (const config of subjectConfigs) {
    console.log('\n===============================================================');
    console.log(`Processing Subject: ${config.subjectMatch} (${config.code})`);

    const exam = await Examination.findOne({
      $or: [{ code: config.code }, { subject: new RegExp(config.subjectMatch, 'i') }]
    });

    if (!exam) {
      console.error(`ERROR: Examination not found for ${config.subjectMatch} (${config.code})`);
      continue;
    }

    console.log(`Found Exam: '${exam.name}' | Subject: '${exam.subject}' | Code: '${exam.code}' | ID: ${exam._id}`);

    // Fetch approved question paper with populated questions
    let paper = null;
    if (exam.approvedQuestionPaper) {
      paper = await QuestionPaper.findById(exam.approvedQuestionPaper).populate('questions.question');
    }
    if (!paper) {
      paper = await QuestionPaper.findOne({ examination: exam._id, status: 'APPROVED' }).populate('questions.question');
    }
    if (!paper) {
      paper = await QuestionPaper.findOne({ examination: exam._id }).populate('questions.question');
    }

    if (!paper || !paper.questions || paper.questions.length === 0) {
      console.error(`ERROR: No question paper with questions found for exam ${exam.code}`);
      continue;
    }

    console.log(`Question Paper: '${paper.paperTitle}' with ${paper.questions.length} questions.`);

    // Clear any previous answer copies for this exam to ensure exactly 200 copies
    const delRes = await AnswerCopy.deleteMany({ examination: exam._id });
    console.log(`Cleared ${delRes.deletedCount} prior copies for ${exam.subject}.`);

    const copiesToInsert = [];
    const now = Date.now();

    for (let i = 1; i <= 200; i++) {
      const padIndex = String(i).padStart(3, '0');
      const copyId = `SCAN-${config.prefix}-${padIndex}`;
      const candidateRollNo = `2026-CS-${config.prefix}-${padIndex}`;

      // Unique student names across 200 copies
      const firstName = firstNames[(i - 1) % firstNames.length];
      const lastName = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length] || lastNames[(i - 1) % lastNames.length];
      const candidateName = `${firstName} ${lastName}`;
      const bookletNumber = `BK-${config.prefix}-${50000 + i}`;

      const answers = paper.questions.map((qItem, qIdx) => {
        const qNum = qItem.questionNumber || (qIdx + 1);
        const qKey = `q${qNum}`;
        const templateList = config.answers[qKey] || config.answers.q1 || [];
        const selectedTemplate = templateList[(i + qIdx) % templateList.length] || 'Standard detailed response covering core concepts, architectural diagrams, and mathematical formulations.';

        return {
          question: qItem.question?._id || qItem.question,
          questionNumber: qNum,
          maxMarks: qItem.marks || 14,
          studentAnswer: selectedTemplate,
          evaluationStatus: 'PENDING'
        };
      });

      const totalMarks = exam.maxMarks || paper.totalMarks || 70;

      copiesToInsert.push({
        copyId,
        examination: exam._id,
        subject: exam.subject,
        candidateRollNo,
        candidateName,
        bookletNumber,
        scannedDocument: {
          fileName: `${config.prefix}_${exam.code.replace(/\s+/g, '_')}_${padIndex}_${candidateName.replace(/\s+/g, '_')}.pdf`,
          fileUrl: `/uploads/scanned/${config.prefix}_${padIndex}.pdf`,
          fileType: 'application/pdf',
          fileSize: 2250000 + (i * 6200),
          scannedPages: [
            {
              pageNumber: 1,
              pageUrl: `/uploads/scanned/pages/${config.prefix}_${padIndex}_p1.jpg`,
              ocrText: `Examination: B.Tech ${exam.code} (${exam.subject})\nCandidate: ${candidateName} (${candidateRollNo})\nBooklet No: ${bookletNumber}\n\nQ1 Response:\n${answers[0]?.studentAnswer || ''}\n\nQ2 Response:\n${answers[1]?.studentAnswer || ''}`
            },
            {
              pageNumber: 2,
              pageUrl: `/uploads/scanned/pages/${config.prefix}_${padIndex}_p2.jpg`,
              ocrText: `Q3 Response:\n${answers[2]?.studentAnswer || ''}\n\nQ4 Response:\n${answers[3]?.studentAnswer || ''}`
            },
            {
              pageNumber: 3,
              pageUrl: `/uploads/scanned/pages/${config.prefix}_${padIndex}_p3.jpg`,
              ocrText: `Q5 Response:\n${answers[4]?.studentAnswer || ''}`
            }
          ]
        },
        status: 'SCANNED',
        scanStatus: 'PROCESSED',
        scannedAt: new Date(now - (200 - i) * 60000), // realistic staggered scan timestamps
        answers,
        totalMaxMarks: totalMarks,
        evaluationStatus: 'SCANNED',
        evaluationMode: exam.evaluationMode || 'AI_EVALUATION'
      });
    }

    console.log(`Inserting 200 copies into database for ${exam.subject}...`);
    const inserted = await AnswerCopy.insertMany(copiesToInsert, { ordered: false });
    console.log(` Successfully inserted ${inserted.length} scanned copies for ${exam.subject}!`);

    // Update Examination status and totalExpectedCopies
    exam.totalExpectedCopies = 200;
    exam.scanningStatus = 'SCANNING_COMPLETED';
    if (['DRAFT', 'SETTER_ASSIGNED', 'PAPER_APPROVED', 'SCHEDULED', 'NOT_STARTED'].includes(exam.status)) {
      exam.status = 'SCANNING_COMPLETED';
    }
    await exam.save();

    console.log(` Updated Examination '${exam.name}' (${exam.code})`);
    console.log(`   - Status: ${exam.status}`);
    console.log(`   - Scanning Status: ${exam.scanningStatus}`);
    console.log(`   - Total Expected Copies: ${exam.totalExpectedCopies}`);
  }

  console.log('\n===============================================================');
  console.log(' ALL 4 EXAMS PROCESSED: 200 COPIES CREATED PER SUBJECT (800 TOTAL)!');
  process.exit(0);
}

generate200CopiesPerSubject().catch((err) => {
  console.error(' Fatal error generating copies:', err);
  process.exit(1);
});
