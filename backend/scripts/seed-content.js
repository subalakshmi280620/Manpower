require("dotenv").config();
const pool = require("../src/db");

const content = {
  about: {
    title: "Your Trusted Facility Service Partner",
    description: "Sri Sai provides dependable manpower, professional security, and housekeeping solutions for corporate hubs, industrial facilities, and residential developments.",
    image: "/images/Property 1=Default (3).png",
    highlights: [
      { title: "Police & ESIC/PF Cleared", description: "Statutory compliance and background scrutiny." },
      { title: "Standardized Training", description: "Role-specific training in protocols, safety, and etiquette." },
      { title: "Immediate Replacement", description: "A backup pool to help cover staff absences." },
      { title: "Multi-Site Capability", description: "Coordinated management across multiple locations." }
    ]
  },
  services: {
    title: "Complete Facility Support Under One Roof",
    description: "Integrated service delivery configured to reduce vendor fragmentation, with one reporting cadence and clear site accountability.",
    items: [
      {
        title: "Security Services",
        heading: "Protection That Works Around The Clock",
        description: "Trained security personnel help maintain safety, access control, and discipline across residential, commercial, and industrial environments.",
        details: ["Trained Security Personnel", "Corporate Security", "Industrial Security", "Residential & Apartment Security", "Commercial Building Security", "Event Security", "Gate & Entry Management", "Visitor Management", "Security Patrolling", "Day & Night Security Support", "24/7 Security Assistance"],
        image: "/images/Property 1=Default (3).png"
      },
      {
        title: "Manpower Services",
        heading: "The Right People For The Right Requirement",
        description: "Manpower solutions for businesses, facilities, and day-to-day operations, with workforce requirements handled according to your needs.",
        details: ["Skilled Manpower", "Unskilled Labour", "Technicians", "Office Support Staff", "Facility Support Staff", "Helpers", "Loading & Unloading Staff", "Contract Staffing", "Temporary Manpower", "Industrial Workforce", "Event Manpower", "Customized Staffing Solutions"],
        image: "/images/Property 1=Default (2).png"
      },
      {
        title: "Housekeeping Services",
        heading: "Clean Spaces. Better Work Environments.",
        description: "Housekeeping teams help maintain clean, hygienic, and well-presented spaces across offices, apartments, commercial properties, and other facilities.",
        details: ["Office Housekeeping", "Commercial Cleaning", "Residential Housekeeping", "Apartment Housekeeping", "Common Area Cleaning", "Floor Cleaning", "Washroom Cleaning & Maintenance", "Deep Cleaning", "Dusting & Surface Cleaning", "Regular Cleaning Services", "Facility Cleaning Support", "Customized Housekeeping Solutions"],
        image: "/images/Property 1=Default (4).png"
      }
    ]
  },
  industries: {
    title: "Industries We Serve",
    description: "Facility management, security, and support staffing for different property types and operational scales.",
    image: "/images/Property 1=Default (5).png",
    items: [
      { title: "Corporate Offices", description: "Security, manpower, and cleaning solutions for professional office environments." },
      { title: "Residential Communities" },
      { title: "Commercial Spaces" },
      { title: "Industrial Facilities", image: "/images/Property 1=Default (8).png" },
      { title: "Educational Institutions" },
      { title: "Events & Special Requirements", image: "/images/Property 1=Default (10).png" }
    ]
  },
  whyUs: {
    title: "More Than A Service. A Reliable Partner.",
    description: "Integrated service delivery focused on coordinated operations and site accountability.",
    items: [
      { title: "Trained Workforce", description: "Teams are selected and prepared according to the required role." },
      { title: "Flexible Deployment", description: "Support structured around operational requirements." },
      { title: "Professional Supervision", description: "Ongoing coordination and service-quality focus." },
      { title: "Reliable Support", description: "Responsive assistance for day-to-day operations." },
      { title: "Customized Solutions", description: "Services adapted to property and business requirements." }
    ]
  },
  process: {
    title: "Simple Process. Professional Execution.",
    items: [
      { title: "Tell Us Your Requirement", description: "Share your manpower, security, or housekeeping requirement." },
      { title: "Understand Your Need", description: "We discuss your location, workforce requirements, and service expectations." },
      { title: "Deploy The Right Team", description: "Personnel are assigned according to your requirement." },
      { title: "Continuous Support", description: "Our team stays connected to provide ongoing support." }
    ]
  },
  policies: {
    privacyPolicy: "",
    termsConditions: ""
  }
};

function containsPlaceholder(value) {
  if (typeof value === "string") {
    return /add (the|your)|details to be confirmed|^(service|industry)\s+\d+$|^nothing$/i.test(value.trim());
  }

  if (Array.isArray(value)) {
    return value.some(containsPlaceholder);
  }

  return value !== null && typeof value === "object"
    ? Object.values(value).some(containsPlaceholder)
    : false;
}

async function seedContent() {
  for (const [key, value] of Object.entries(content)) {
    const [existing] = await pool.query(
      "SELECT content_value FROM site_content WHERE content_key = ?",
      [key]
    );

    if (!existing.length) {
      await pool.query(
        "INSERT INTO site_content (content_key, content_value, is_published) VALUES (?, ?, 1)",
        [key, JSON.stringify(value)]
      );
      continue;
    }

    let existingValue = existing[0].content_value;
    if (typeof existingValue === "string") {
      existingValue = JSON.parse(existingValue);
    }

    if (containsPlaceholder(existingValue)) {
      await pool.query(
        "UPDATE site_content SET content_value = ?, is_published = 1 WHERE content_key = ?",
        [JSON.stringify(value), key]
      );
    }
  }

  console.log("Website content seeded; existing non-placeholder content was preserved.");
}

seedContent()
  .catch((error) => {
    console.error("Content seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
