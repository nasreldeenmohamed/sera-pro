// LinkedIn data parser for CV builder integration
// Supports LinkedIn Data Export (JSON) format and extracts relevant CV information
// Reference: https://www.linkedin.com/help/linkedin/answer/a554590/download-your-linkedin-data

export type LinkedInData = {
  // Personal information
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string; // Professional title/headline
  summary?: string; // About section
  location?: string;
  email?: string;
  profileUrl?: string;
  
  // Experience
  positions?: Array<{
    title?: string;
    companyName?: string;
    startDate?: { month?: number; year?: number };
    endDate?: { month?: number; year?: number };
    description?: string;
    location?: string;
  }>;
  
  // Education
  educations?: Array<{
    schoolName?: string;
    degreeName?: string;
    fieldOfStudy?: string;
    startDate?: { year?: number };
    endDate?: { year?: number };
  }>;
  
  // Skills
  skills?: Array<{
    name?: string;
  }>;
  
  // Languages
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }>;
  
  // Certifications
  certifications?: Array<{
    name?: string;
    authority?: string;
    startDate?: { year?: number };
    endDate?: { year?: number };
  }>;
};

/**
 * Parses LinkedIn Data Export JSON file
 * @param jsonData - Raw JSON data from LinkedIn export
 * @returns Parsed and structured LinkedIn data
 */
export function parseLinkedInExport(jsonData: any): LinkedInData {
  // LinkedIn export structure varies; this handles the standard format
  const data: LinkedInData = {};

  // Extract personal information
  if (jsonData.Profile) {
    const profile = jsonData.Profile[0] || jsonData.Profile;
    data.firstName = profile.FirstName || profile.firstName;
    data.lastName = profile.LastName || profile.lastName;
    data.fullName = profile.FirstName && profile.LastName
      ? `${profile.FirstName} ${profile.LastName}`
      : profile.Name || profile.fullName;
    data.headline = profile.Headline || profile.headline || profile.ProfessionalHeadline;
    data.summary = profile.Summary || profile.summary || profile.About || profile.about;
    data.location = profile.Location || profile.location;
    data.email = profile.EmailAddress || profile.email;
    data.profileUrl = profile.ProfileUrl || profile.profileURL;
  }

  // Extract positions (work experience)
  if (jsonData.Positions) {
    data.positions = Array.isArray(jsonData.Positions)
      ? jsonData.Positions.map((pos: any) => ({
          title: pos.Title || pos.title,
          companyName: pos.CompanyName || pos.companyName,
          startDate: pos.StartDate || pos.startDate,
          endDate: pos.EndDate || pos.endDate,
          description: pos.Description || pos.description,
          location: pos.Location || pos.location,
        }))
      : [];
  }

  // Extract education
  if (jsonData.Education) {
    data.educations = Array.isArray(jsonData.Education)
      ? jsonData.Education.map((edu: any) => ({
          schoolName: edu.SchoolName || edu.schoolName,
          degreeName: edu.DegreeName || edu.degreeName,
          fieldOfStudy: edu.FieldOfStudy || edu.fieldOfStudy,
          startDate: edu.StartDate || edu.startDate,
          endDate: edu.EndDate || edu.endDate,
        }))
      : [];
  }

  // Extract skills
  if (jsonData.Skills) {
    data.skills = Array.isArray(jsonData.Skills)
      ? jsonData.Skills.map((skill: any) => ({
          name: skill.Name || skill.name,
        }))
      : [];
  }

  // Extract languages
  if (jsonData.Languages) {
    data.languages = Array.isArray(jsonData.Languages)
      ? jsonData.Languages.map((lang: any) => ({
          name: lang.Name || lang.name,
          proficiency: lang.Proficiency || lang.proficiency,
        }))
      : [];
  }

  // Extract certifications
  if (jsonData.Certifications) {
    data.certifications = Array.isArray(jsonData.Certifications)
      ? jsonData.Certifications.map((cert: any) => ({
          name: cert.Name || cert.name,
          authority: cert.Authority || cert.authority,
          startDate: cert.StartDate || cert.startDate,
          endDate: cert.EndDate || cert.endDate,
        }))
      : [];
  }

  return data;
}

/**
 * Maps LinkedIn data to CV builder form data format
 * @param linkedInData - Parsed LinkedIn data
 * @param existingData - Optional existing CV data to merge with
 * @returns CV form data ready for form.reset()
 */
export function mapLinkedInToCvData(
  linkedInData: LinkedInData,
  existingData?: any
): any {
  const cvData: any = {
    fullName: linkedInData.fullName || linkedInData.firstName || existingData?.fullName || "",
    title: linkedInData.headline || existingData?.title || "",
    summary: linkedInData.summary || existingData?.summary || "",
    contact: {
      email: linkedInData.email || existingData?.contact?.email || "",
      phone: existingData?.contact?.phone || "",
      location: linkedInData.location || existingData?.contact?.location || "",
      website: linkedInData.profileUrl || existingData?.contact?.website || "",
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    templateKey: existingData?.templateKey || "classic",
  };

  // Map positions to experience
  if (linkedInData.positions && linkedInData.positions.length > 0) {
    cvData.experience = linkedInData.positions.map((pos) => {
      let startDate = "";
      if (pos.startDate?.year) {
        const month = pos.startDate.month ? String(pos.startDate.month).padStart(2, "0") : "01";
        startDate = `${pos.startDate.year}-${month}`;
      }
      
      let endDate = "";
      if (pos.endDate?.year) {
        const month = pos.endDate.month ? String(pos.endDate.month).padStart(2, "0") : "12";
        endDate = `${pos.endDate.year}-${month}`;
      }
      
      return {
        company: pos.companyName || "",
        role: pos.title || "",
        startDate: startDate || "",
        endDate: endDate || undefined,
        description: pos.description || "",
      };
    });
  } else if (existingData?.experience) {
    cvData.experience = existingData.experience;
  }

  // Map educations
  if (linkedInData.educations && linkedInData.educations.length > 0) {
    cvData.education = linkedInData.educations.map((edu) => {
      const startDate = edu.startDate?.year ? `${edu.startDate.year}-01` : "";
      const endDate = edu.endDate?.year ? `${edu.endDate.year}-12` : "";
      
      return {
        school: edu.schoolName || "",
        degree: [edu.degreeName, edu.fieldOfStudy].filter(Boolean).join(" - ") || "",
        startDate,
        endDate: endDate || undefined,
      };
    });
  } else if (existingData?.education) {
    cvData.education = existingData.education;
  }

  // Map skills
  if (linkedInData.skills && linkedInData.skills.length > 0) {
    cvData.skills = linkedInData.skills.map((skill) => skill.name || "").filter(Boolean);
  } else if (existingData?.skills) {
    cvData.skills = existingData.skills;
  }

  // Map languages
  if (linkedInData.languages && linkedInData.languages.length > 0) {
    cvData.languages = linkedInData.languages.map((lang) => {
      const name = lang.name || "";
      const proficiency = lang.proficiency ? ` (${lang.proficiency})` : "";
      return name + proficiency;
    }).filter(Boolean);
  } else if (existingData?.languages) {
    cvData.languages = existingData.languages;
  }

  // Map certifications
  if (linkedInData.certifications && linkedInData.certifications.length > 0) {
    cvData.certifications = linkedInData.certifications.map((cert) => {
      const name = cert.name || "";
      const authority = cert.authority ? ` - ${cert.authority}` : "";
      return name + authority;
    }).filter(Boolean);
  } else if (existingData?.certifications) {
    cvData.certifications = existingData.certifications;
  }

  return cvData;
}

