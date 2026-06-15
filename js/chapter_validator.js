/**
 * Chapter Recognition System for STUDY.LOG
 * Maps user input to standardized Subject and Chapter titles.
 */

if (typeof window !== 'undefined' && !window.escapeHTML) {
    window.escapeHTML = function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
}

const ChapterDatabase = {
    "Physics": [
        "Units and Measurements", "Kinematics", "Laws of Motion", "Work Energy and Power", 
        "Rotational Motion", "Gravitation", "Properties of Solids and Fluids", "Thermal Physics", 
        "Thermodynamics", "Kinetic Theory of Gases", "Oscillations", "Waves", "Electrostatics", 
        "Current Electricity", "Magnetic Effects of Current and Magnetism", 
        "Electromagnetic Induction and Alternating Currents", "Electromagnetic Waves", "Optics", 
        "Dual Nature of Matter and Radiation", "Atoms and Nuclei", "Electronic Devices", "Communication Systems"
    ],
    "Chemistry": [
        "Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties", 
        "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", 
        "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements", 
        "Organic Chemistry - Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry", 
        "Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", 
        "General Principles and Processes of Isolation of Elements", "d- and f-Block Elements", 
        "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols Phenols and Ethers", 
        "Aldehydes Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"
    ],
    "Mathematics": [
        "Sets Relations and Functions", "Trigonometric Functions", "Inverse Trigonometric Functions", 
        "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations", 
        "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", 
        "Introduction to Three-Dimensional Geometry", "Limits and Derivatives", "Mathematical Reasoning", 
        "Statistics", "Probability", "Matrices", "Determinants", "Continuity and Differentiability", 
        "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", 
        "Vector Algebra", "Three-Dimensional Geometry", "Linear Programming"
    ]
};

const ChapterValidator = {
    /**
     * Returns a flat array of all chapter names.
     */
    getAllChapters: function() {
        return Object.values(ChapterDatabase).flat();
    },

    /**
     * Identifies a chapter and its subject based on input.
     * Performs a case-insensitive exact or partial match.
     */
    identify: function(input) {
        if (!input) return null;
        const query = input.trim().toLowerCase();
        
        // 1. Try Exact/Direct Match first
        for (const [subject, chapters] of Object.entries(ChapterDatabase)) {
            const found = chapters.find(ch => ch.toLowerCase() === query);
            if (found) return { subject, chapter: found };
        }

        // 2. Try Partial/Fuzzy Match (if query is a significant part of the chapter title)
        if (query.length > 2) {
            for (const [subject, chapters] of Object.entries(ChapterDatabase)) {
                // Return the first chapter that contains the query string
                const found = chapters.find(ch => ch.toLowerCase().includes(query));
                if (found) return { subject, chapter: found };
            }
        }

        // 3. Fallback: If no match found in DB, return as "Other" or custom
        return { subject: "Custom", chapter: input.trim() };
    },

    /**
     * Returns the color associated with a subject for UI elements.
     */
    getSubjectColor: function(subject) {
        switch (subject) {
            case "Physics": return "#7BBFDF"; // Sky Blue
            case "Chemistry": return "#B8E04A"; // Lime Green
            case "Mathematics": return "#E8943A"; // Warm Orange
            default: return "#E87060"; // Coral/Salmon for Custom
        }
    }
};

window.ChapterValidator = ChapterValidator;
window.ChapterDatabase = ChapterDatabase;