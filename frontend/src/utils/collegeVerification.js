import collegesHierarchy from "../data/collegesHierarchy.json";

// In-memory cache for fast lookup
let verifiedCollegesSet = null;
let collegeDetailsMap = null;

const initLookup = () => {
  if (verifiedCollegesSet) return;
  verifiedCollegesSet = new Set();
  collegeDetailsMap = new Map();

  for (const state of Object.keys(collegesHierarchy)) {
    const districts = collegesHierarchy[state];
    for (const district of Object.keys(districts)) {
      const colleges = districts[district];
      for (const col of colleges) {
        const normalized = col.trim().toLowerCase();
        verifiedCollegesSet.add(normalized);
        if (!collegeDetailsMap.has(normalized)) {
          collegeDetailsMap.set(normalized, {
            college: col.trim(),
            state,
            district,
          });
        }
      }
    }
  }
};

/**
 * Check if a college name exists in the official 53,000+ colleges dataset
 * @param {string} name 
 * @param {Array<string|object>} [additionalVerifiedNames=[]] Optional list of admin-approved custom campuses
 * @returns {boolean}
 */
export const isCollegeVerified = (name, additionalVerifiedNames = []) => {
  if (!name || typeof name !== "string") return false;
  const clean = name.trim().toLowerCase();
  if (!clean) return false;

  initLookup();

  if (verifiedCollegesSet.has(clean)) return true;

  if (Array.isArray(additionalVerifiedNames) && additionalVerifiedNames.length > 0) {
    const match = additionalVerifiedNames.some(
      (extra) => (typeof extra === "string" ? extra : extra?.name || "").trim().toLowerCase() === clean
    );
    if (match) return true;
  }

  return false;
};

/**
 * Get State and District details for an official college
 * @param {string} name 
 * @returns {{ college: string, state: string, district: string } | null}
 */
export const getCollegeDetails = (name) => {
  if (!name || typeof name !== "string") return null;
  const clean = name.trim().toLowerCase();
  initLookup();
  return collegeDetailsMap.get(clean) || null;
};

/**
 * Normalizes college name to standard casing if found in official dataset
 * @param {string} name 
 * @returns {string}
 */
export const getCanonicalCollegeName = (name) => {
  const details = getCollegeDetails(name);
  return details ? details.college : name ? name.trim() : "";
};
