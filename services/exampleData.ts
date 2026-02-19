
import { WordSection, CaseAnalysis } from "../types";

export const EXAMPLE_URL = "https://www.dataprotection.ie/sites/default/files/uploads/2023-01/Final%20Decision%20VIEC%20IN-21-2-5%20121222_Redacted.pdf";

export const STATIC_WORD_CONTENT: WordSection[] = [
  {
    title: "1. Executive Summary: The €405M Instagram Inquiry",
    content: `# The Incident
In a landmark decision concluded in **January 2023**, the Irish Data Protection Commission (DPC) imposed a staggering **€405 million administrative fine** on Meta Platforms Ireland Limited. The inquiry targeted systematic failures in the processing of personal data belonging to child users (ages 13–17) on the Instagram platform between 2018 and 2020.

## Core Violations
The investigation identified two critical "toxic" default settings:
1. **The Business Account Exposure**: Children were permitted to operate 'Business Accounts', which, by architectural design, required the public publication of the user's phone number and/or email address.
2. **Public-by-Default Onboarding**: During the registration process, accounts for users under 18 were set to 'public' by default, exposing their content, bio, and interactions to the global internet without a conscious opt-in for high-privacy settings.

## Strategic Mitigation
To avoid such catastrophic regulatory exposure, organizations must move beyond "compliance checklists" to **Privacy by Design (PbD)**. This requires:
- **Mandatory Age Verification** at entry points.
- **Privacy-as-the-Standard**: Enforcing the most restrictive settings for all vulnerable demographics.
- **Data Minimization**: Eliminating the collection of contact details that are not strictly necessary for the service's primary function.`
  },
  {
    title: "2. Legal Timeline & Procedural Milestones",
    content: `| Date | Stakeholder | Action / Event |
|:---|:---|:---|
| **22 Sep 2020** | **Irish DPC** | Formal commencement of inquiry IN-21-2-5 into Meta's processing of children's personal data. |
| **03 Dec 2021** | **Meta Ireland** | Submission of initial defense arguing that business accounts were a user-requested feature for analytics. |
| **13 Jun 2022** | **EDPB** | Dispute resolution triggered under **Art. 65 GDPR** after several EU authorities disagreed with the DPC's proposed fine. |
| **15 Sep 2022** | **Irish DPC** | Final adoption of the decision incorporating the EDPB's mandate for a significantly higher deterrent fine. |
| **12 Dec 2022** | **VIEC** | Official publication of the redacted final dossier providing legal clarity to the public and industry experts. |`
  },
  {
    title: "3. The Legal Struggle: Defense vs Findings",
    content: `### Meta's Primary Defense: 'User Choice'
Meta argued that the conversion to a **Business Account** was a proactive user choice. They contended that teenagers sought these accounts to access "advanced analytics" and that the publication of contact info was a standard "Business Feature" necessary for the contractual performance of a commercial profile.

### The Regulator's Counter-Finding: 'Illusion of Choice'
The DPC, supported by the **European Data Protection Board (EDPB)**, rejected this defense on three grounds:
1. **Lack of Capacity**: Minors do not have the legal or cognitive maturity to appreciate the long-term risks of publishing contact data.
2. **Architecture as Nudge**: The UI design actively nudged children toward business accounts to increase platform engagement, failing the 'Fairness' principle under **Art. 5(1)(a)**.
3. **Violation of Art. 24**: As the controller, Meta failed to implement appropriate technical and organizational measures to protect the data of a vulnerable class.`
  },
  {
    title: "4. PM Strategy & Design Constraints",
    content: `### Critical Constraints for Product Teams
- **Age-Gated Account Types**: Engineers must implement strict logic that disables the 'Business Account' upgrade path for any user whose verified age is under 18 to prevent accidental data exposure.
- **Default Privacy Hardening**: Initial onboarding for 13-17s must default to 'Private'. Any attempt to switch to 'Public' should be gated by a "Risk Education" module and a parental notification requirement.
- **The 'Young User' UI Pattern**: Implement **Just-in-Time** (JIT) privacy notices that use icons and simple language to explain data visibility at the point of interaction.

> **Expert Note**: A product's success is now measured by its "Regulatory Resilience". If your growth loop relies on child data exposure, your business model is a legal liability.`
  },
  {
    title: "5. DPO Technical Deep Dive",
    content: `### Legal Basis Analysis
Meta attempted to rely on **Art. 6(1)(b) (Contractual Necessity)** for the processing of children's contact data in business profiles. The DPC ruled this **invalid**, stating that such publication is not "objectively necessary" to provide a social media service.

### Specific Articles Breached:
- **Art. 5(1)(c)**: Data Minimization (Collecting and exposing phone numbers needlessly was found to be disproportionate to the service goal).
- **Art. 25**: Data Protection by Design and by Default (The failure to build privacy into the core product architecture led to the bulk of the fine).
- **Art. 32**: Security of Processing (Publicly exposing child contact details created unacceptable risks of off-platform grooming and harassment).
- **Art. 35**: DPIA (The internal risk assessments were deemed legally deficient as they failed to address the specific vulnerabilities of minors).`
  }
];

export const STATIC_PPT_CONTENT: CaseAnalysis = {
  presentationTitle: "Meta: The €405M Instagram Inquiry",
  subtitle: "Strategic Breakdown of the Irish DPC Children's Data Decision",
  slides: [
    {
      id: "slide-0-example",
      title: "Executive Synthesis",
      type: "title",
      companyName: "Meta Platforms",
      authorityName: "Irish DPC",
      points: [{ text: "Strategic Analysis of the €405 Million GDPR Penalty: This high-impact executive report provides a comprehensive breakdown of the regulatory consequences stemming from systematic design failures and 'toxic' default privacy settings for minor users on the Instagram platform.", bold: true }],
      style: {
        backgroundColor: "#FFFFFF", textColor: "#1E293B", accentColor: "#4F46E5",
        titleFontSize: 32, bodyFontSize: 18, titleYPos: 10, titleXPos: 5,
        bodyYPos: 25, bodyXPos: 5, imageXPos: 65, imageYPos: 25, imageScale: 1.0, lineSpacing: 1.5
      }
    },
    {
      id: "slide-1-example",
      title: "Strategic Impact Overview",
      type: "strategic_summary",
      points: [
        { text: "Record-Breaking Administrative Fine: The €405,000,000 penalty imposed on Meta Ireland marks a historic milestone for GDPR enforcement, signaling that systematic child privacy violations will incur maximum deterrent penalties to prevent future non-compliance.", bold: true, color: "#E11D48" },
        { text: "Vulnerable Demographic Protection: The investigation established a strict legal precedent that users aged 13-17 are 'vulnerable data subjects' who require non-negotiable, proactive protections within a digital service's core architecture.", bold: true },
        { text: "Architecture Over Security: Regulators clarified that the fine was not triggered by an external data breach, but by internal architectural choices that systematically exposed minor contact data without an explicit and informed user opt-in.", bold: true }
      ],
      authorityOpinions: [
        "Privacy by Default is a mandatory engineering standard for modern platforms, not an optional design preference.",
        "Monetary penalties must be effective and dissuasive to prevent profitable non-compliance cycles.",
        "Protecting the digital rights of children is the highest priority for the European Data Protection Board."
      ],
      style: {
        backgroundColor: "#FFFFFF", textColor: "#1E293B", accentColor: "#4F46E5",
        titleFontSize: 32, bodyFontSize: 18, titleYPos: 10, titleXPos: 5,
        bodyYPos: 25, bodyXPos: 5, imageXPos: 65, imageYPos: 25, imageScale: 1.0, lineSpacing: 1.5
      }
    }
  ]
};
