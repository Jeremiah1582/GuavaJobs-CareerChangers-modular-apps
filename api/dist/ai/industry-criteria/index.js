"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDUSTRY_CRITERIA = void 0;
exports.getIndustryCriteria = getIndustryCriteria;
exports.INDUSTRY_CRITERIA = {
    SOFTWARE: {
        label: 'Software Engineering',
        keywordFocus: [
            'programming languages',
            'frameworks',
            'CI/CD',
            'cloud platforms',
            'system design',
            'testing',
            'APIs',
            'databases',
        ],
        seniorityExpectations: {
            JUNIOR: 'Foundational language skills, coursework or internships, basic tooling',
            MID: 'Production ownership, code review, debugging, one cloud stack',
            SENIOR: 'Architecture, mentoring, cross-team delivery, reliability',
            LEAD: 'Technical direction, hiring, roadmap trade-offs',
        },
    },
    SALES: {
        label: 'Sales',
        keywordFocus: [
            'CRM',
            'pipeline',
            'quota attainment',
            'negotiation',
            'B2B',
            'B2C',
            'prospecting',
            'closing',
        ],
        seniorityExpectations: {
            JUNIOR: 'Outbound activity, lead qualification, product knowledge',
            MID: 'Consistent quota, account management, objection handling',
            SENIOR: 'Enterprise deals, forecasting, coaching',
        },
    },
    DATA_ANALYSIS: {
        label: 'Data Analysis',
        keywordFocus: [
            'SQL',
            'Python',
            'R',
            'visualization',
            'statistics',
            'BI tools',
            'dashboards',
            'A/B testing',
        ],
        seniorityExpectations: {
            JUNIOR: 'SQL basics, Excel, simple dashboards',
            MID: 'End-to-end analysis, stakeholder communication',
            SENIOR: 'Metric design, experimentation, data governance',
        },
    },
    FINANCE: {
        label: 'Finance',
        keywordFocus: [
            'financial modelling',
            'compliance',
            'Excel',
            'accounting standards',
            'CFA',
            'ACA',
            'forecasting',
            'audit',
        ],
        seniorityExpectations: {
            JUNIOR: 'Modelling support, reconciliations, attention to detail',
            MID: 'Independent models, variance analysis',
            SENIOR: 'Strategic planning, controls, stakeholder reporting',
        },
    },
    HR: {
        label: 'Human Resources',
        keywordFocus: [
            'ATS',
            'employee relations',
            'recruitment',
            'HRIS',
            'compliance',
            'onboarding',
            'policy',
        ],
        seniorityExpectations: {
            JUNIOR: 'Coordination, scheduling, HR admin',
            MID: 'Full-cycle recruiting, ER cases with guidance',
            SENIOR: 'People strategy, policy design, leadership partnering',
        },
    },
    MARKETING: {
        label: 'Marketing',
        keywordFocus: [
            'campaigns',
            'SEO',
            'SEM',
            'analytics',
            'brand',
            'content',
            'social media',
            'conversion',
        ],
        seniorityExpectations: {
            JUNIOR: 'Channel execution, reporting, creative briefs',
            MID: 'Campaign ownership, budget tracking',
            SENIOR: 'Strategy, attribution, cross-channel planning',
        },
    },
    OPERATIONS: {
        label: 'Operations',
        keywordFocus: [
            'process improvement',
            'logistics',
            'KPIs',
            'Lean',
            'Six Sigma',
            'supply chain',
            'SOPs',
        ],
        seniorityExpectations: {
            JUNIOR: 'Process documentation, data collection',
            MID: 'Process redesign, vendor coordination',
            SENIOR: 'Operational strategy, cost optimisation',
        },
    },
    PRODUCT: {
        label: 'Product Management',
        keywordFocus: [
            'roadmap',
            'user research',
            'agile',
            'metrics',
            'stakeholder management',
            'PRD',
            'prioritisation',
        ],
        seniorityExpectations: {
            JUNIOR: 'User stories, backlog grooming, analytics support',
            MID: 'Feature ownership, discovery, delivery',
            SENIOR: 'Product strategy, OKRs, cross-functional leadership',
        },
    },
    DESIGN: {
        label: 'Design',
        keywordFocus: [
            'UX',
            'UI',
            'Figma',
            'portfolio',
            'design systems',
            'accessibility',
            'prototyping',
            'user testing',
        ],
        seniorityExpectations: {
            JUNIOR: 'Wireframes, design system usage, critique participation',
            MID: 'End-to-end flows, usability testing',
            SENIOR: 'Design direction, systems thinking, research leadership',
        },
    },
    OTHER: {
        label: 'General Professional',
        keywordFocus: [
            'achievements',
            'impact metrics',
            'tools',
            'certifications',
            'leadership',
            'communication',
        ],
        seniorityExpectations: {
            JUNIOR: 'Clear role scope, learning agility, teamwork',
            MID: 'Independent delivery, measurable outcomes',
            SENIOR: 'Strategic impact, mentoring, cross-functional influence',
        },
    },
};
function getIndustryCriteria(industry) {
    return exports.INDUSTRY_CRITERIA[industry];
}
//# sourceMappingURL=index.js.map